"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import type { Level } from "@/lib/levels";
import { calcStars } from "@/lib/levels";
import { saveScore } from "@/lib/storage";
import { buildGeometry } from "@/lib/geometry";

const CANVAS_W = 700;
const CANVAS_H = 520;
// Approximate height of nav + page padding + HUD + coverage bar + hint + gaps
const VIEWPORT_OVERHEAD = 200;
const CLIPPER_RADIUS = 22;       // half of clipper width (44px wide stripe)
const CLIPPER_DROP_SPEED = 720;  // px/s descent
const CLIPPER_RETRACT_SPEED = 900;
const SWING_PADDING = 60;        // pendulum swings within [pad, W - pad]
const SWING_Y = 50;              // y position of the pendulum pivot (top of screen)
const COVERAGE_GRID = 60;        // sample resolution for coverage %
const ALPHA_THRESHOLD = 100;     // pixel must be substantially opaque to count as hair
const WIN_THRESHOLD = 1.0;       // 100% — must clear all sampled hair pixels

type ClipperState = "swinging" | "dropping" | "retracting";

interface GameProps {
  level: Level;
  onFinish: (result: { passes: number; timeMs: number; stars: 1 | 2 | 3 }) => void;
}

export default function Game({ level, onFinish }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(1);
  const stateRef = useRef({
    clipper: {
      x: CANVAS_W / 2,
      y: SWING_Y,
      dir: 1 as 1 | -1,
      mode: "swinging" as ClipperState,
    },
    passes: 0,
    startTime: 0,
    coverage: 0,
    totalHairPixels: 0,
    finished: false,
    lastSampleAt: 0,
  });

  const [coverage, setCoverage] = useState(0);
  const [passes, setPasses] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Drop the clippers (user input).
  const dropClippers = useCallback(() => {
    const s = stateRef.current.clipper;
    if (s.mode === "swinging") {
      s.mode = "dropping";
      stateRef.current.passes += 1;
      setPasses(stateRef.current.passes);
    }
  }, []);

  // Compute display scale to fit canvas within the viewport on any screen size.
  useLayoutEffect(() => {
    const update = () => {
      if (!wrapperRef.current) return;
      const availW = wrapperRef.current.clientWidth;
      const availH = window.innerHeight - VIEWPORT_OVERHEAD;
      setDisplayScale(Math.min(1, availW / CANVAS_W, Math.max(0.2, availH / CANVAS_H)));
    };
    update();
    const ro = new ResizeObserver(update);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Set up canvases and mask once per level mount.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Hi-DPI scaling — internal resolution stays at CANVAS_W×CANVAS_H * dpr;
    // display size is controlled via CSS (the `style` prop on the canvas element).
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // Build the offscreen mask canvas (1:1 logical px, no DPR — we sample it at logical coords).
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = CANVAS_W;
    maskCanvas.height = CANVAS_H;
    maskCanvasRef.current = maskCanvas;
    const mctx = maskCanvas.getContext("2d", { willReadFrequently: true })!;

    const geom = buildGeometry(level.shape);

    // Paint the hair onto the mask, intersected with the head shape (so hair never spills off the skin).
    mctx.save();
    mctx.clip(geom.headPath);
    mctx.fillStyle = level.hairColor;
    mctx.fill(geom.hairPath);
    mctx.restore();

    // Compute total hair pixels by sampling.
    const sampleHair = () => {
      const { x, y, w, h } = geom.bounds;
      const stepX = Math.max(1, Math.floor(w / COVERAGE_GRID));
      const stepY = Math.max(1, Math.floor(h / COVERAGE_GRID));
      let total = 0;
      for (let py = y; py < y + h; py += stepY) {
        for (let px = x; px < x + w; px += stepX) {
          if (px < 0 || py < 0 || px >= CANVAS_W || py >= CANVAS_H) continue;
          const data = mctx.getImageData(px, py, 1, 1).data;
          if (data[3] > ALPHA_THRESHOLD) total++;
        }
      }
      return total;
    };
    stateRef.current.totalHairPixels = sampleHair();

    // Reset state
    stateRef.current.clipper = {
      x: CANVAS_W / 2,
      y: SWING_Y,
      dir: 1,
      mode: "swinging",
    };
    stateRef.current.passes = 0;
    stateRef.current.coverage = 0;
    stateRef.current.startTime = performance.now();
    stateRef.current.finished = false;
    stateRef.current.lastSampleAt = 0;
    setCoverage(0);
    setPasses(0);
    setElapsed(0);

    // Game loop
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const st = stateRef.current;
      const c = st.clipper;

      // --- Update clipper ---
      if (c.mode === "swinging") {
        c.x += c.dir * level.swingSpeed * dt;
        if (c.x < SWING_PADDING) {
          c.x = SWING_PADDING;
          c.dir = 1;
        } else if (c.x > CANVAS_W - SWING_PADDING) {
          c.x = CANVAS_W - SWING_PADDING;
          c.dir = -1;
        }
      } else if (c.mode === "dropping") {
        c.y += CLIPPER_DROP_SPEED * dt;
        // Stamp a circle on the mask at every step (carve out hair)
        mctx.save();
        mctx.globalCompositeOperation = "destination-out";
        mctx.beginPath();
        mctx.arc(c.x, c.y, CLIPPER_RADIUS, 0, Math.PI * 2);
        mctx.fill();
        mctx.restore();

        if (c.y >= CANVAS_H - 40) {
          c.mode = "retracting";
        }
      } else if (c.mode === "retracting") {
        c.y -= CLIPPER_RETRACT_SPEED * dt;
        if (c.y <= SWING_Y) {
          c.y = SWING_Y;
          c.mode = "swinging";
        }
      }

      // --- Periodic coverage sample (every ~120ms) ---
      if (now - st.lastSampleAt > 120) {
        st.lastSampleAt = now;
        const { x, y, w, h } = geom.bounds;
        const stepX = Math.max(1, Math.floor(w / COVERAGE_GRID));
        const stepY = Math.max(1, Math.floor(h / COVERAGE_GRID));
        let remaining = 0;
        for (let py = y; py < y + h; py += stepY) {
          for (let px = x; px < x + w; px += stepX) {
            if (px < 0 || py < 0 || px >= CANVAS_W || py >= CANVAS_H) continue;
            const data = mctx.getImageData(px, py, 1, 1).data;
            if (data[3] > ALPHA_THRESHOLD) remaining++;
          }
        }
        const cov =
          st.totalHairPixels > 0
            ? 1 - remaining / st.totalHairPixels
            : 1;
        st.coverage = cov;
        setCoverage(cov);
        setElapsed(now - st.startTime);

        if (cov >= WIN_THRESHOLD && !st.finished) {
          st.finished = true;
          const stars = calcStars(st.passes, level.par);
          const result = {
            passes: st.passes,
            timeMs: Math.round(now - st.startTime),
            stars,
          };
          saveScore(level.id, result);
          // Defer onFinish to next tick so the canvas paints final state first.
          setTimeout(() => onFinish(result), 250);
        }
      }

      // --- Render ---
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background — warm barbershop interior
      const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bg.addColorStop(0, "#fef3e7");
      bg.addColorStop(1, "#f5d9b8");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Cape (drawn first, behind the head — also provides the floor shadow)
      geom.drawCape(ctx);

      // Skin
      ctx.fillStyle = "#f4c9a0";
      ctx.fill(geom.headPath);

      // Stubble shading (hint at hair area underneath the mask)
      ctx.save();
      ctx.clip(geom.headPath);
      ctx.fillStyle = "rgba(80,50,30,0.08)";
      ctx.fill(geom.hairPath);
      ctx.restore();

      // Hair (from mask)
      ctx.drawImage(maskCanvas, 0, 0);

      // Face features
      geom.drawFace(ctx);

      // Pendulum line (from pivot at top center)
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_W / 2, 0);
      ctx.lineTo(c.x, c.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Clipper body
      drawClipper(ctx, c.x, c.y, c.mode);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [level, onFinish]);

  // Input handlers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        dropClippers();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dropClippers]);

  const dW = Math.floor(CANVAS_W * displayScale);
  const dH = Math.floor(CANVAS_H * displayScale);

  return (
    <div ref={wrapperRef} className="w-full flex flex-col items-center gap-3">
      {/* HUD */}
      <div
        style={{ width: dW }}
        className="grid grid-cols-3 gap-2 text-[#0f2942] font-mono text-sm"
      >
        <Stat label="PASSES" value={`${passes} / ${level.par}`} />
        <Stat label="COVERAGE" value={`${Math.round(coverage * 100)}%`} />
        <Stat label="TIME" value={`${(elapsed / 1000).toFixed(1)}s`} />
      </div>

      {/* Coverage bar */}
      <div
        style={{ width: dW }}
        className="h-2 bg-[#0f2942]/10 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-[#ea580c] transition-[width] duration-100 ease-linear"
          style={{ width: `${Math.round(coverage * 100)}%` }}
        />
      </div>

      <canvas
        ref={canvasRef}
        onClick={dropClippers}
        onTouchStart={(e) => {
          e.preventDefault();
          dropClippers();
        }}
        className="rounded-2xl shadow-2xl cursor-pointer touch-none select-none border-4 border-[#0f2942]"
        style={{ width: dW, height: dH, background: "#fef3e7" }}
      />

      <p className="text-xs text-[#0f2942]/60 font-mono uppercase tracking-widest">
        Tap / Space to drop
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center bg-[#0f2942]/5 rounded-lg py-2 px-2 sm:px-3">
      <span className="text-[9px] sm:text-[10px] tracking-widest opacity-60">{label}</span>
      <span className="text-base sm:text-lg font-bold tabular-nums">{value}</span>
    </div>
  );
}

function drawClipper(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  mode: ClipperState
) {
  // Body
  ctx.save();
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(x, y + 28, 24, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Handle
  ctx.fillStyle = "#0f2942";
  ctx.fillRect(x - 18, y - 22, 36, 30);

  // Brand stripe
  ctx.fillStyle = "#ea580c";
  ctx.fillRect(x - 18, y - 6, 36, 4);

  // Blade housing
  ctx.fillStyle = "#1f3a5c";
  ctx.fillRect(x - 22, y + 8, 44, 14);

  // Teeth
  ctx.fillStyle = "#d4d4d8";
  for (let i = 0; i < 10; i++) {
    ctx.fillRect(x - 22 + i * 4.4, y + 22, 3, 5);
  }

  // Vibration lines if dropping
  if (mode === "dropping") {
    ctx.strokeStyle = "#ea580c";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      const off = (Math.random() - 0.5) * 8;
      ctx.beginPath();
      ctx.moveTo(x - 30 + off, y - 10 + i * 8);
      ctx.lineTo(x - 36 + off, y - 10 + i * 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 30 - off, y - 10 + i * 8);
      ctx.lineTo(x + 36 - off, y - 10 + i * 8);
      ctx.stroke();
    }
  }

  ctx.restore();
}
