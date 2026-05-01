# Buzz Cut ✂️

A pendulum-clipper barbershop puzzle game. The clippers swing back and forth on a pendulum at the top of the screen — click, tap, or hit space to drop them down and shave a stripe of hair off the customer's head. Try to give a clean cut in as few passes as possible.

Built with Next.js 15, TypeScript, Tailwind, and HTML5 Canvas. Deploys to Vercel with zero config.

## Play

- **Click / Tap / Spacebar** — drop the clippers
- **3 stars** = at or under par passes
- **2 stars** = par + 1 or 2
- **1 star** = you finished, but the customer is filing a complaint

## Levels

1. **The First Customer** — round head, slow swing
2. **The Long Hair** — taller dome
3. **The Mohawk** — only the strip needs shaving
4. **The Speed Demon** — clippers are wired
5. **The Full Service** — head AND beard

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Push to GitHub, then:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the repo
3. Click Deploy — no config needed

## Architecture

- `app/page.tsx` — title screen + level select grid
- `app/play/[level]/page.tsx` — the game screen
- `components/Game.tsx` — canvas, game loop, clipper physics, coverage tracking
- `components/ResultModal.tsx` — stars + retry/next
- `lib/levels.ts` — level definitions and star-rating logic
- `lib/geometry.ts` — head/hair shapes built from `Path2D`
- `lib/storage.ts` — `localStorage` for best scores per level

The game uses two canvases: a visible main canvas that renders every frame, and an offscreen "hair mask" canvas that the clippers carve away from using `globalCompositeOperation = "destination-out"`. Coverage % is sampled on a 40×40 grid every ~120ms (sampling every pixel every frame is way too slow, sampling 1600 points is plenty).

## License

MIT
