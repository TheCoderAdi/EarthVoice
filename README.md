# EarthVoice

An interactive, voice-forward globe UI built with React, Vite, TypeScript and Tailwind CSS.

EarthVoice presents location memories, ambient sound control, and collaborative cursors on a 3D globe. It's focused on exploration and multimedia memory timelines.

## Key features

- Interactive 3D globe visualization (using `react-globe.gl`)
- Memory timeline with location-based memories
- Ambient audio controls and voice/visitor presence features
- Visitor cursors and small collaborative UX touches
- Tours/demos with guided steps

## Tech stack

- Vite + TypeScript
- React 19
- Tailwind CSS
- react-globe.gl for globe rendering
- sonner for toast UI

## Quick start (Windows / PowerShell)

1. Install dependencies

```powershell
npm install
```

2. Run the dev server (hosted for LAN testing)

```powershell
npm run dev
```

3. Build for production

```powershell
npm run build
```

4. Preview the production build locally

```powershell
npm run preview
```

Useful scripts (from `package.json`)

- `dev` — start Vite dev server (with `--host` flag)
- `build` — run `tsc -b` then `vite build`
- `preview` — preview the production build
- `lint` — run ESLint across the project

## Project structure (important files)

- `index.html` — app entry HTML
- `src/main.tsx` — React entry
- `src/App.tsx` — top-level app component
- `src/pages/` — route pages (e.g., `Home.tsx`, `NotFound.tsx`)
- `src/components/` — UI and domain components (Globe, HUD, VoicePanel, etc.)
- `src/lib/` — small libraries (api, ambient, memory, presence)
- `src/data/locations.ts` — sample locations data
- `tailwind.config.ts` — Tailwind CSS config

Explore the `src/components` folder for smaller UI primitives in `src/components/ui`.

## Development notes and assumptions

- This repository uses TypeScript; run the typechecker if you modify types: `tsc -b`.
- Tailwind utilities are used in `index.css` / `src/index.css`.
- Some packages appear to be shadcn/shadui and custom components — follow existing patterns when adding UI.

## Tests & linting

- ESLint is configured; run `npm run lint` to check code style.
- There are no unit tests included by default; adding a small test harness (Vitest or Jest) is a recommended next step.

## Contributing

1. Fork and create a feature branch.
2. Keep changes focused and add small commits with clear messages.
3. Run `npm run lint` and `tsc -b` before opening a PR.

If you add features that affect the public API or UI primitives, include a brief example in the README or a Storybook story.

## Contact

If you want help or to report issues, open an issue in the repository.
