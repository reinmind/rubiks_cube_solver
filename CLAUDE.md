# Cube Solver Project

## Tech Stack
- React 19 + TypeScript + Vite
- Three.js with @react-three/fiber for 3D rendering
- Zustand for state management (with localStorage persistence)
- cubejs library for Kociemba two-phase solving algorithm

## Critical: Color Mapping
U=yellow, D=white, L=orange, R=red, F=blue, B=green
(requirement.md #6)

## cubejs Library Loading
- Runs in Web Worker (Blob URL with inline code) to avoid blocking UI
- Main thread fetches cube.js, passes code to worker via postMessage
- Worker uses `new Function(code)` to execute (avoids strict mode issues)

## Solver Initialization
- `Cube.initSolver()` is CPU-intensive (4-5 sec)
- Runs in Web Worker thread (doesn't block main thread)
- Pre-initializes on page load via `preloadSolver()`

## Scramble Generation
- MUST apply random moves to solved cube (not randomize colors)
- Random colors create invalid states that can't be solved
- Use `generateScrambleMoves()` then apply to `createSolvedCube()`

## Key Files
- `src/solver/Solver.ts` - Web Worker implementation, solve logic
- `src/hooks/useCubeStore.ts` - Zustand store with persistence
- `src/components/Cube3D.tsx` - Three.js 3D rendering
- `src/components/SolutionPanel.tsx` - Combined solve + animation controls
- `public/cube.js` - merged cubejs library (cube.js + solve.js)