// Composable head system.
// Define a HeadConfig → get a HeadGeometry. Game.tsx rendering logic is unchanged.
// Add new levels by defining a config; no switch statements to extend.

const CX = 350;
const CANVAS_W = 700;
const CANVAS_H = 520;

// ─── Public types ─────────────────────────────────────────────────────────────

export type SkullShape = "round" | "oval" | "tall" | "narrow" | "wide" | "egg";
export type HairTop    = "bald" | "short-cap" | "full-top" | "fluffy" | "mohawk" | "comb-over" | "receding" | "spiky" | "man-bun";
export type HairSides  = "none" | "sideburns" | "mutton-chops" | "chin-strap" | "ear-tufts";
export type HairBeard  = "none" | "stubble" | "goatee" | "full" | "chinstrap-beard" | "soul-patch";

export interface HeadConfig {
  skull: SkullShape;
  hairTop: HairTop;
  hairSides: HairSides;
  hairBeard: HairBeard;
  hairColor: string;
}

// HeadGeometry is the contract consumed by Game.tsx (previously in geometry.ts).
export interface HeadGeometry {
  headPath: Path2D;
  hairPath: Path2D;
  bounds: { x: number; y: number; w: number; h: number };
  drawFace: (ctx: CanvasRenderingContext2D) => void;
  drawCape: (ctx: CanvasRenderingContext2D) => void;
  neckY: number;
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface BBox { x: number; y: number; w: number; h: number }
interface HairPart { path: Path2D; bounds: BBox }

// Per-skull metadata. Skull-specific anchor points let each hair component
// produce the same geometry it did in the original hardcoded functions.
interface SkullMeta {
  cx: number; cy: number; rx: number; ry: number;
  headPath: Path2D;
  neckY: number;
  earCy: number;   // y-centre for ear drawing
  faceCy: number;  // y-centre for face features
  // Sideburn Y anchors (relative to this skull)
  sideburnTop: number;
  sideburnBottom: number; // bottom when no beard present
  // Mutton-chop Y anchors
  muttonTop: number;
  muttonHeight: number;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function ellipsePath(cx: number, cy: number, rx: number, ry: number): Path2D {
  const p = new Path2D();
  p.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  return p;
}

function unionBBox(boxes: BBox[]): BBox {
  if (boxes.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const b of boxes) {
    x1 = Math.min(x1, b.x);
    y1 = Math.min(y1, b.y);
    x2 = Math.max(x2, b.x + b.w);
    y2 = Math.max(y2, b.y + b.h);
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

// ─── Skull builders ───────────────────────────────────────────────────────────
// Dimensions match the original hardcoded head functions exactly.
// sideburnTop/Bottom are tuned per-skull so that "sideburns" produces the
// same pixel geometry as the original round/oval/tall heads.

function buildSkull(shape: SkullShape): SkullMeta {
  switch (shape) {
    case "round":
      // Original roundHead / mohawkHead: cy=290, rx=150, ry=170
      return {
        cx: CX, cy: 290, rx: 150, ry: 170,
        headPath: ellipsePath(CX, 290, 150, 170),
        neckY: 452, earCy: 300, faceCy: 320,
        sideburnTop: 240, sideburnBottom: 310,
        muttonTop: 220, muttonHeight: 110,
      };
    case "oval":
      // Original ovalHead: cy=290, rx=140, ry=175
      return {
        cx: CX, cy: 290, rx: 140, ry: 175,
        headPath: ellipsePath(CX, 290, 140, 175),
        neckY: 457, earCy: 300, faceCy: 320,
        sideburnTop: 230, sideburnBottom: 310,
        muttonTop: 220, muttonHeight: 110,
      };
    case "tall":
      // Original tallHead: cy=310, rx=130, ry=180
      return {
        cx: CX, cy: 310, rx: 130, ry: 180,
        headPath: ellipsePath(CX, 310, 130, 180),
        neckY: 482, earCy: 330, faceCy: 350,
        sideburnTop: 260, sideburnBottom: 340,
        muttonTop: 230, muttonHeight: 110,
      };
    case "narrow":
      return {
        cx: CX, cy: 300, rx: 115, ry: 185,
        headPath: ellipsePath(CX, 300, 115, 185),
        neckY: 477, earCy: 315, faceCy: 335,
        sideburnTop: 250, sideburnBottom: 320,
        muttonTop: 225, muttonHeight: 110,
      };
    case "wide":
      // Broad jovial head — wider than tall
      return {
        cx: CX, cy: 300, rx: 175, ry: 155,
        headPath: ellipsePath(CX, 300, 175, 155),
        neckY: 447, earCy: 308, faceCy: 325,
        sideburnTop: 245, sideburnBottom: 315,
        muttonTop: 225, muttonHeight: 110,
      };
    case "egg": {
      // Narrower at the bottom, like an egg balanced point-down.
      // Top half: wide bezier arc (same as a ~125×180 ellipse).
      // Bottom half: taper via bezier. Control points must be at cy+207 so the
      // curve midpoint (t=0.5) actually reaches y = cy+155 ≈ neckY (450).
      // Formula: y_mid = 0.25*cy + 0.75*cp_y  →  cp_y = (450-0.25*295)/0.75 ≈ 502.
      const egCy = 295;
      const p = new Path2D();
      p.moveTo(CX - 125, egCy);
      p.bezierCurveTo(CX - 125, egCy - 180, CX + 125, egCy - 180, CX + 125, egCy);
      p.bezierCurveTo(CX + 80,  egCy + 207,  CX - 80,  egCy + 207,  CX - 125, egCy);
      p.closePath();
      return {
        cx: CX, cy: egCy, rx: 125, ry: 180,
        headPath: p,
        neckY: 450, earCy: 308, faceCy: 328,
        sideburnTop: 248, sideburnBottom: 316,
        muttonTop: 228, muttonHeight: 105,
      };
    }
  }
}

// ─── Hair component builders ──────────────────────────────────────────────────

function buildHairTop(type: HairTop, s: SkullMeta): HairPart | null {
  const { cx, cy, rx, ry } = s;
  switch (type) {
    case "bald":
    case "short-cap":
      return null;

    case "full-top": {
      const p = new Path2D();
      // Upper semi-ellipse slightly inside the skull
      p.ellipse(cx, cy, rx - 2, ry - 4, 0, Math.PI, 2 * Math.PI);
      // Forehead trim band
      p.rect(cx - rx + 30, cy - 30, rx * 2 - 60, 30);
      return {
        path: p,
        bounds: { x: cx - rx, y: cy - ry, w: rx * 2, h: ry },
      };
    }

    case "fluffy": {
      const p = new Path2D();
      // Fluffy top extends above and around the skull
      p.ellipse(cx, cy - 30, rx + 12, ry + 20, 0, Math.PI, 2 * Math.PI);
      return {
        path: p,
        bounds: { x: cx - (rx + 12), y: cy - 30 - (ry + 20), w: (rx + 12) * 2, h: ry + 20 },
      };
    }

    case "mohawk": {
      const stripW = 60;
      const p = new Path2D();
      p.rect(cx - stripW / 2, cy - ry - 20, stripW, ry + 30);
      return {
        path: p,
        bounds: { x: cx - stripW / 2 - 8, y: cy - ry - 20, w: stripW + 16, h: ry + 30 },
      };
    }

    case "comb-over": {
      // Swept from right side across the top — asymmetric wedge.
      // Path is CW (descend left side first) so it doesn't create winding holes
      // when it overlaps with other CW sub-paths (sideburns, beard, etc.).
      const p = new Path2D();
      p.moveTo(cx + rx - 20, cy - ry + 20);        // upper right
      p.bezierCurveTo(
        cx + rx - 10, cy - 10,
        cx - rx + 60, cy - 10,
        cx - rx + 40, cy - 20,                     // lower left
      );
      p.lineTo(cx - rx + 40, cy - ry + 30);        // upper left
      p.bezierCurveTo(
        cx - rx + 60, cy - ry - 10,
        cx + rx - 10, cy - ry - 10,
        cx + rx - 20, cy - ry + 20,               // back to upper right
      );
      p.closePath();
      return {
        path: p,
        bounds: { x: cx - rx + 30, y: cy - ry - 15, w: rx * 2 - 40, h: ry + 10 },
      };
    }

    case "receding": {
      // Hair on back and sides; forehead arc is bare
      const p = new Path2D();
      // Left side patch
      p.rect(cx - rx + 2, cy - ry + 60, rx - 40, ry - 20);
      // Right side patch
      p.rect(cx + 40, cy - ry + 60, rx - 40, ry - 20);
      // Back crown band connecting them
      p.ellipse(cx, cy - ry + 70, rx - 15, 28, 0, 0, Math.PI * 2);
      return {
        path: p,
        bounds: { x: cx - rx + 2, y: cy - ry + 40, w: rx * 2 - 4, h: ry - 10 },
      };
    }

    case "spiky": {
      // 6 jagged triangle peaks radiating above the skull
      const p = new Path2D();
      const numSpikes = 6;
      const baseY = cy - ry + 20;
      const tipY = cy - ry - 40;
      const spread = rx - 20;
      for (let i = 0; i < numSpikes; i++) {
        const t = (i / (numSpikes - 1)) * 2 - 1;          // −1 to +1 across the top
        const baseCx = cx + t * spread;
        const halfBase = 14;
        p.moveTo(baseCx - halfBase, baseY);
        p.lineTo(baseCx, tipY - Math.abs(t) * 10);        // centre spikes tallest
        p.lineTo(baseCx + halfBase, baseY);
        p.closePath();
      }
      return {
        path: p,
        bounds: { x: cx - rx, y: tipY - 10, w: rx * 2, h: baseY - tipY + 10 },
      };
    }

    case "man-bun": {
      // Small fluffy bun circle on top + short cap sides
      const p = new Path2D();
      // Short cap band
      p.ellipse(cx, cy, rx - 4, ry - 4, 0, Math.PI, 2 * Math.PI);
      p.rect(cx - rx + 20, cy - 18, rx * 2 - 40, 18);
      // Bun knot at the very top
      const bunCy = cy - ry - 10;
      p.ellipse(cx, bunCy, 26, 22, 0, 0, Math.PI * 2);
      return {
        path: p,
        bounds: { x: cx - rx, y: cy - ry - 32, w: rx * 2, h: ry + 32 },
      };
    }
  }
}

function buildHairSides(
  type: HairSides,
  s: SkullMeta,
  beardConnectY: number | null,
): HairPart | null {
  const { cx, rx } = s;
  switch (type) {
    case "none":
      return null;

    case "sideburns": {
      const top = s.sideburnTop;
      // Extend to beard connection point when a beard is present; otherwise use
      // the skull's default sideburn bottom so they don't look too long.
      const bottom = beardConnectY ?? s.sideburnBottom;
      const h = bottom - top;
      const p = new Path2D();
      p.rect(cx - rx + 4, top, 22, h);
      p.rect(cx + rx - 26, top, 22, h);
      const leftX = cx - rx + 4;
      const rightX = cx + rx - 26;
      return {
        path: p,
        bounds: { x: leftX, y: top, w: rightX + 22 - leftX, h },
      };
    }

    case "mutton-chops": {
      const top = s.muttonTop;
      const h = s.muttonHeight;
      const p = new Path2D();
      p.rect(cx - rx, top, 26, h);
      p.rect(cx + rx - 26, top, 26, h);
      const leftX = cx - rx;
      const rightX = cx + rx - 26;
      return {
        path: p,
        bounds: { x: leftX, y: top, w: rightX + 26 - leftX, h },
      };
    }

    case "chin-strap": {
      // Thin strip following the jaw line from each sideburn to the chin.
      // Both sub-paths must be CW so they don't punch holes where they overlap
      // with CW sideburn rects (nonzero winding rule: CW+CCW = 0 = unfilled).
      // Left is traced inner-edge-first (CW); right is naturally CW as-is.
      const { cy, ry } = s;
      const chinCy = cy + ry - 30;
      const p = new Path2D();
      // Left jaw strip — CW: inner edge descends first, outer edge returns upward
      p.moveTo(cx - rx + 30, s.sideburnTop + 10);   // inner top
      p.bezierCurveTo(
        cx - rx + 22, chinCy - 18,
        cx - 18, chinCy + 6,
        cx - 6, chinCy + 14,                        // inner bottom
      );
      p.lineTo(cx - 14, chinCy + 14);               // outer bottom
      p.bezierCurveTo(
        cx - 30, chinCy + 8,
        cx - rx + 10, chinCy - 20,
        cx - rx + 18, s.sideburnTop + 10,            // outer top
      );
      p.closePath();
      // Right jaw strip — already CW
      p.moveTo(cx + rx - 18, s.sideburnTop + 10);
      p.bezierCurveTo(
        cx + rx - 10, chinCy - 20,
        cx + 30, chinCy + 8,
        cx + 14, chinCy + 14,
      );
      p.lineTo(cx + 6, chinCy + 14);
      p.bezierCurveTo(
        cx + 18, chinCy + 6,
        cx + rx - 22, chinCy - 18,
        cx + rx - 30, s.sideburnTop + 10,
      );
      p.closePath();
      return {
        path: p,
        bounds: { x: cx - rx + 8, y: s.sideburnTop, w: rx * 2 - 16, h: chinCy + 20 - s.sideburnTop },
      };
    }

    case "ear-tufts": {
      // Small fluffy oval patches just above each ear
      const earY = s.earCy - 30;
      const p = new Path2D();
      p.ellipse(cx - rx + 10, earY, 18, 14, -0.3, 0, Math.PI * 2);
      p.ellipse(cx + rx - 10, earY, 18, 14, 0.3, 0, Math.PI * 2);
      return {
        path: p,
        bounds: { x: cx - rx - 8, y: earY - 18, w: rx * 2 + 16, h: 36 },
      };
    }
  }
}

function buildHairBeard(
  type: HairBeard,
  s: SkullMeta,
): { part: HairPart | null; connectY: number | null } {
  const { cx, cy, rx, ry } = s;
  switch (type) {
    case "none":
    case "stubble":
    case "goatee":
      return { part: null, connectY: null };

    case "full": {
      const beardY = cy + 38;
      const chinCy = cy + ry - 30;
      const chinRy = 54;
      const p = new Path2D();
      p.rect(cx - rx + 8, beardY, rx * 2 - 16, ry - 46);
      p.ellipse(cx, chinCy, rx - 38, chinRy, 0, 0, Math.PI);
      return {
        part: {
          path: p,
          bounds: { x: cx - rx + 8, y: beardY, w: rx * 2 - 16, h: chinCy + chinRy - beardY },
        },
        connectY: beardY,
      };
    }

    case "chinstrap-beard": {
      // Jaw-line only — no mustache, thin strip following the chin arc
      const chinCy = cy + ry - 30;
      const chinRy = 50;
      const p = new Path2D();
      // Outer chin arc (lower half)
      p.ellipse(cx, chinCy, rx - 32, chinRy, 0, 0, Math.PI);
      // Inner cutout (slightly smaller) to make it a thin strip
      p.ellipse(cx, chinCy, rx - 46, chinRy - 12, 0, Math.PI, 0);
      const beardY = chinCy - 2;
      return {
        part: {
          path: p,
          bounds: { x: cx - rx + 30, y: beardY, w: rx * 2 - 60, h: chinRy + 4 },
        },
        connectY: beardY,
      };
    }

    case "soul-patch": {
      // Mouth smile is drawn at faceCy+32..+38; patch sits just below the lower lip
      const patchY = s.faceCy + 52;
      const p = new Path2D();
      p.ellipse(cx, patchY, 12, 16, 0, 0, Math.PI * 2);
      return {
        part: {
          path: p,
          bounds: { x: cx - 14, y: patchY - 18, w: 28, h: 36 },
        },
        connectY: null,
      };
    }
  }
}

// ─── Face and cape drawing (identical to geometry.ts) ─────────────────────────

function drawEars(ctx: CanvasRenderingContext2D, cy: number, rx: number): void {
  ctx.fillStyle = "#e8b890";
  ctx.beginPath();
  ctx.ellipse(CX - rx + 6, cy, 14, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(CX + rx - 6, cy, 14, 22, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFaceFeatures(ctx: CanvasRenderingContext2D, cy: number): void {
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(CX - 30, cy, 4, 0, Math.PI * 2);
  ctx.arc(CX + 30, cy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(CX - 18, cy + 32);
  ctx.quadraticCurveTo(CX, cy + 38, CX + 18, cy + 32);
  ctx.stroke();
}

function makeDrawCape(neckY: number): (ctx: CanvasRenderingContext2D) => void {
  return (ctx) => {
    const topW = 70;
    const bottomW = 540;
    const capeBottom = CANVAS_H + 40;
    const collarY = neckY + 6;

    const grad = ctx.createRadialGradient(CX, capeBottom - 10, 50, CX, capeBottom - 10, 320);
    grad.addColorStop(0, "rgba(0,0,0,0.18)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, capeBottom - 80, CANVAS_W, 80);

    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.moveTo(CX - topW / 2, collarY);
    ctx.bezierCurveTo(
      CX - topW / 2 - 40, collarY + 60,
      CX - bottomW / 2 + 30, capeBottom - 80,
      CX - bottomW / 2, capeBottom,
    );
    ctx.lineTo(CX + bottomW / 2, capeBottom);
    ctx.bezierCurveTo(
      CX + bottomW / 2 - 30, capeBottom - 80,
      CX + topW / 2 + 40, collarY + 60,
      CX + topW / 2, collarY,
    );
    ctx.closePath();
    ctx.fill();

    const fabricGrad = ctx.createLinearGradient(CX, collarY, CX, capeBottom);
    fabricGrad.addColorStop(0, "rgba(255,255,255,0.08)");
    fabricGrad.addColorStop(0.5, "rgba(255,255,255,0.03)");
    fabricGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = fabricGrad;
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      const xOff = i * 70;
      ctx.beginPath();
      ctx.moveTo(CX + xOff * 0.2, collarY + 30);
      ctx.quadraticCurveTo(CX + xOff * 0.6, collarY + 120, CX + xOff, capeBottom - 20);
      ctx.stroke();
    }

    const trimY = collarY - 4;
    const trimH = 10;
    const stripeW = 6;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(CX - topW / 2 - 8, trimY);
    ctx.bezierCurveTo(
      CX - topW / 2 - 12, trimY + trimH,
      CX + topW / 2 + 12, trimY + trimH,
      CX + topW / 2 + 8, trimY,
    );
    ctx.bezierCurveTo(
      CX + topW / 2 + 4, trimY - 4,
      CX - topW / 2 - 4, trimY - 4,
      CX - topW / 2 - 8, trimY,
    );
    ctx.closePath();
    ctx.clip();
    const trimLeft = CX - topW / 2 - 14;
    const trimRight = CX + topW / 2 + 14;
    let sx = trimLeft;
    let toggle = 0;
    while (sx < trimRight) {
      ctx.fillStyle = toggle % 2 === 0 ? "#ea580c" : "#fef3e7";
      ctx.fillRect(sx, trimY - 6, stripeW, trimH + 10);
      sx += stripeW;
      toggle++;
    }
    ctx.restore();

    ctx.strokeStyle = "#0f2942";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(CX - topW / 2 - 8, trimY);
    ctx.bezierCurveTo(
      CX - topW / 2 - 12, trimY + trimH,
      CX + topW / 2 + 12, trimY + trimH,
      CX + topW / 2 + 8, trimY,
    );
    ctx.stroke();
  };
}

// ─── Composition ──────────────────────────────────────────────────────────────

export function randomHeadConfig(): HeadConfig {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  return {
    skull:     pick<SkullShape>(["round","oval","tall","narrow","wide","egg"]),
    hairTop:   pick<HairTop>(["bald","short-cap","full-top","fluffy","mohawk","comb-over","receding","spiky","man-bun"]),
    hairSides: pick<HairSides>(["none","sideburns","mutton-chops","chin-strap","ear-tufts"]),
    hairBeard: pick<HairBeard>(["none","full","chinstrap-beard","soul-patch"]),
    hairColor: pick(["#3b2a1e","#5b3a1a","#1a1a1a","#6b4226","#2a1810","#c4a35a","#8b4513","#4a3728"]),
  };
}

export function composeHead(config: HeadConfig): HeadGeometry {
  const skull = buildSkull(config.skull);

  // Build beard first — its connectY determines how far sideburns extend.
  const { part: beardPart, connectY: beardConnectY } = buildHairBeard(config.hairBeard, skull);
  const topPart   = buildHairTop(config.hairTop, skull);
  const sidesPart = buildHairSides(config.hairSides, skull, beardConnectY);

  // Union all hair paths into one Path2D.
  const hairPath = new Path2D();
  if (topPart)   hairPath.addPath(topPart.path);
  if (sidesPart) hairPath.addPath(sidesPart.path);
  if (beardPart) hairPath.addPath(beardPart.path);

  // Union bounds — must encompass every hair pixel; coverage sampling reads from here.
  const parts = [topPart, sidesPart, beardPart].filter((p): p is HairPart => p !== null);
  const bounds = unionBBox(parts.map((p) => p.bounds));

  return {
    headPath: skull.headPath,
    hairPath,
    bounds,
    neckY: skull.neckY,
    drawFace: (ctx) => {
      drawEars(ctx, skull.earCy, skull.rx);
      drawFaceFeatures(ctx, skull.faceCy);
    },
    drawCape: makeDrawCape(skull.neckY),
  };
}
