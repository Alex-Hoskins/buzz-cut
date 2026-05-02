// Geometry for head shapes. Each shape returns:
//  - headPath:  silhouette (skin) - drawn under the hair
//  - hairPath:  the area that starts covered with hair (the mask we erase from)
//  - bounds:    bounding box of the hair area, used for coverage sampling and clipper travel
//  - drawFace:  fn that draws face features (ears, eyes, nose) onto a context
//  - drawCape:  fn that draws the barbershop cape (drawn FIRST, behind everything)
import type { HeadShape } from "./levels";

export interface HeadGeometry {
  headPath: Path2D;
  hairPath: Path2D;
  bounds: { x: number; y: number; w: number; h: number };
  drawFace: (ctx: CanvasRenderingContext2D) => void;
  drawCape: (ctx: CanvasRenderingContext2D) => void;
  // Where the neck meets the body — used to position the cape neckline
  neckY: number;
}

// All shapes are designed for a 700x520 canvas, centered around (350, 280).
const CX = 350;
const CANVAS_W = 700;
const CANVAS_H = 520;

export function buildGeometry(shape: HeadShape): HeadGeometry {
  switch (shape) {
    case "round":
      return roundHead();
    case "tall":
      return tallHead();
    case "mohawk":
      return mohawkHead();
    case "oval":
      return ovalHead();
    case "beard":
      return beardHead();
  }
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number): Path2D {
  const p = new Path2D();
  p.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  return p;
}

function drawEars(ctx: CanvasRenderingContext2D, cy: number, rx: number) {
  ctx.fillStyle = "#e8b890";
  ctx.beginPath();
  ctx.ellipse(CX - rx + 6, cy, 14, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(CX + rx - 6, cy, 14, 22, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFaceFeatures(ctx: CanvasRenderingContext2D, cy: number) {
  // Eyes
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(CX - 30, cy, 4, 0, Math.PI * 2);
  ctx.arc(CX + 30, cy, 4, 0, Math.PI * 2);
  ctx.fill();
  // Nervous mouth
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(CX - 18, cy + 32);
  ctx.quadraticCurveTo(CX, cy + 38, CX + 18, cy + 32);
  ctx.stroke();
}

// Draws a classic barbershop cape: dark fabric draped wide from a neckline,
// with a striped trim at the collar. Anchored at neckY.
function makeDrawCape(neckY: number): (ctx: CanvasRenderingContext2D) => void {
  return (ctx) => {
    const topW = 70;       // collar width
    const bottomW = 540;   // splays out wide
    const capeBottom = CANVAS_H + 40; // off the bottom edge for clean look
    const collarY = neckY + 6;

    // Soft floor shadow under cape
    const grad = ctx.createRadialGradient(CX, capeBottom - 10, 50, CX, capeBottom - 10, 320);
    grad.addColorStop(0, "rgba(0,0,0,0.18)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, capeBottom - 80, CANVAS_W, 80);

    // Cape main body
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.moveTo(CX - topW / 2, collarY);
    ctx.bezierCurveTo(
      CX - topW / 2 - 40, collarY + 60,
      CX - bottomW / 2 + 30, capeBottom - 80,
      CX - bottomW / 2, capeBottom
    );
    ctx.lineTo(CX + bottomW / 2, capeBottom);
    ctx.bezierCurveTo(
      CX + bottomW / 2 - 30, capeBottom - 80,
      CX + topW / 2 + 40, collarY + 60,
      CX + topW / 2, collarY
    );
    ctx.closePath();
    ctx.fill();

    // Subtle highlight down the center
    const fabricGrad = ctx.createLinearGradient(CX, collarY, CX, capeBottom);
    fabricGrad.addColorStop(0, "rgba(255,255,255,0.08)");
    fabricGrad.addColorStop(0.5, "rgba(255,255,255,0.03)");
    fabricGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = fabricGrad;
    ctx.fill();

    // Soft fabric folds
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      ctx.beginPath();
      const xOff = i * 70;
      ctx.moveTo(CX + xOff * 0.2, collarY + 30);
      ctx.quadraticCurveTo(
        CX + xOff * 0.6, collarY + 120,
        CX + xOff, capeBottom - 20
      );
      ctx.stroke();
    }

    // Striped trim around the collar (barbershop signature)
    const trimY = collarY - 4;
    const trimH = 10;
    const stripeW = 6;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(CX - topW / 2 - 8, trimY);
    ctx.bezierCurveTo(
      CX - topW / 2 - 12, trimY + trimH,
      CX + topW / 2 + 12, trimY + trimH,
      CX + topW / 2 + 8, trimY
    );
    ctx.bezierCurveTo(
      CX + topW / 2 + 4, trimY - 4,
      CX - topW / 2 - 4, trimY - 4,
      CX - topW / 2 - 8, trimY
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

    // Trim outline
    ctx.strokeStyle = "#0f2942";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(CX - topW / 2 - 8, trimY);
    ctx.bezierCurveTo(
      CX - topW / 2 - 12, trimY + trimH,
      CX + topW / 2 + 12, trimY + trimH,
      CX + topW / 2 + 8, trimY
    );
    ctx.stroke();
  };
}

// ---- Round head (tutorial) ----
// Hair caps the top of the skull and comes down a bit at the forehead.
function roundHead(): HeadGeometry {
  const cy = 290;
  const rx = 150;
  const ry = 170;
  const headPath = ellipsePath(CX, cy, rx, ry);
  const hairPath = new Path2D();
  // Hair ellipse matches the head exactly so the top is flush with the skull top.
  hairPath.ellipse(CX, cy, rx - 2, ry - 4, 0, Math.PI, 2 * Math.PI);
  // Forehead trim — extend hair down a bit at the front
  hairPath.rect(CX - rx + 30, cy - 30, rx * 2 - 60, 30);
  // Sideburns
  hairPath.rect(CX - rx + 4, cy - 50, 22, 70);
  hairPath.rect(CX + rx - 26, cy - 50, 22, 70);
  return {
    headPath,
    hairPath,
    bounds: { x: CX - rx, y: cy - ry, w: rx * 2, h: ry + 20 },
    neckY: cy + ry - 8,
    drawFace: (ctx) => {
      drawEars(ctx, cy + 10, rx);
      drawFaceFeatures(ctx, cy + 30);
    },
    drawCape: makeDrawCape(cy + ry - 8),
  };
}

// ---- Tall / Long hair ----
function tallHead(): HeadGeometry {
  const cy = 310;
  const rx = 130;
  const ry = 180;
  const headPath = ellipsePath(CX, cy, rx, ry);
  const hairPath = new Path2D();
  // Big fluffy top - extends well above and around the skull (long hair piled up)
  hairPath.ellipse(CX, cy - 30, rx + 12, ry + 20, 0, Math.PI, 2 * Math.PI);
  // Side mutton-chops down to mid-face
  hairPath.rect(CX - rx, cy - 80, 26, 110);
  hairPath.rect(CX + rx - 26, cy - 80, 26, 110);
  return {
    headPath,
    hairPath,
    bounds: { x: CX - rx - 14, y: cy - 30 - (ry + 20), w: rx * 2 + 28, h: ry + 110 },
    neckY: cy + ry - 8,
    drawFace: (ctx) => {
      drawEars(ctx, cy + 20, rx);
      drawFaceFeatures(ctx, cy + 40);
    },
    drawCape: makeDrawCape(cy + ry - 8),
  };
}

// ---- Mohawk: only a center strip is hair ----
function mohawkHead(): HeadGeometry {
  const cy = 290;
  const rx = 150;
  const ry = 170;
  const headPath = ellipsePath(CX, cy, rx, ry);
  const hairPath = new Path2D();
  const stripW = 60;
  // Mohawk strip - extends slightly above the skull (spiked up)
  hairPath.rect(CX - stripW / 2, cy - ry - 20, stripW, ry + 30);
  return {
    headPath,
    hairPath,
    bounds: { x: CX - stripW / 2 - 8, y: cy - ry - 20, w: stripW + 16, h: ry + 30 },
    neckY: cy + ry - 8,
    drawFace: (ctx) => {
      drawEars(ctx, cy + 10, rx);
      drawFaceFeatures(ctx, cy + 30);
    },
    drawCape: makeDrawCape(cy + ry - 8),
  };
}

// ---- Oval (speed demon) ----
function ovalHead(): HeadGeometry {
  const cy = 290;
  const rx = 140;
  const ry = 175;
  const headPath = ellipsePath(CX, cy, rx, ry);
  const hairPath = new Path2D();
  // Caps the head, slightly puffy on top
  hairPath.ellipse(CX, cy, rx - 2, ry - 4, 0, Math.PI, 2 * Math.PI);
  // Forehead trim
  hairPath.rect(CX - rx + 30, cy - 30, rx * 2 - 60, 30);
  // Sideburns
  hairPath.rect(CX - rx + 4, cy - 60, 22, 80);
  hairPath.rect(CX + rx - 26, cy - 60, 22, 80);
  return {
    headPath,
    hairPath,
    bounds: { x: CX - rx, y: cy - ry, w: rx * 2, h: ry + 20 },
    neckY: cy + ry - 8,
    drawFace: (ctx) => {
      drawEars(ctx, cy + 10, rx);
      drawFaceFeatures(ctx, cy + 30);
    },
    drawCape: makeDrawCape(cy + ry - 8),
  };
}

// ---- Beard: head AND beard ----
function beardHead(): HeadGeometry {
  const cy = 270;
  const rx = 140;
  const ry = 160;
  const headPath = ellipsePath(CX, cy, rx, ry);
  const hairPath = new Path2D();
  // Top hair caps the head
  hairPath.ellipse(CX, cy, rx - 2, ry - 4, 0, Math.PI, 2 * Math.PI);
  // Forehead trim
  hairPath.rect(CX - rx + 30, cy - 30, rx * 2 - 60, 30);
  // Sideburns
  hairPath.rect(CX - rx + 4, cy - 50, 22, 60);
  hairPath.rect(CX + rx - 26, cy - 50, 22, 60);
  // Beard - lower jaw area extending below
  hairPath.ellipse(CX, cy + ry - 30, rx - 20, 80, 0, 0, Math.PI);
  return {
    headPath,
    hairPath,
    bounds: { x: CX - rx, y: cy - ry, w: rx * 2, h: ry + 130 },
    neckY: cy + ry - 8,
    drawFace: (ctx) => {
      drawEars(ctx, cy + 10, rx);
      drawFaceFeatures(ctx, cy + 20);
    },
    drawCape: makeDrawCape(cy + ry - 8),
  };
}
