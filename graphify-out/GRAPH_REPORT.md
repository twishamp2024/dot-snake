# Graph Report - SnakeGame  (2026-11-22)

## Corpus Check
- Corpus is ~6,663 words - fits in a single context window. You may not need a graph.

## Summary
- 155 nodes · 310 edges · 9 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Game Engine & State
- Game Controller
- Package Dependencies
- React UI Components
- Tooling Config
- Canvas Renderer
- HUD & Icons
- NPM Scripts
- Vercel Config

## God Nodes (most connected - your core abstractions)
1. `GameController` - 33 edges
2. `compilerOptions` - 16 edges
3. `drawFrame()` - 10 edges
4. `Direction` - 10 edges
5. `GameState` - 8 edges
6. `bindKeyboard()` - 8 edges
7. `scripts` - 7 edges
8. `App()` - 7 edges
9. `Hud()` - 7 edges
10. `Difficulty` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Props` --references--> `GameController`  [EXTRACTED]
  src/components/GameBoard.tsx → src/game/controller.ts
- `Window` --references--> `GameController`  [EXTRACTED]
  src/hooks/useGameController.ts → src/game/controller.ts
- `App()` --calls--> `Hud()`  [EXTRACTED]
  src/App.tsx → src/components/Hud.tsx
- `UiSnapshot` --references--> `Difficulty`  [EXTRACTED]
  src/game/controller.ts → src/game/engine.ts
- `GameController` --references--> `GameState`  [EXTRACTED]
  src/game/controller.ts → src/game/types.ts

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "Game Engine & State"
Cohesion: 0.14
Nodes (27): BEST_KEY(), readBest(), UiSnapshot, writeBest(), BASE_CONFIG, createGame(), DIFFICULTIES, DIRECTION_VECTORS (+19 more)

### Community 1 - "Game Controller"
Cohesion: 0.13
Nodes (8): GameController, Difficulty, start(), Direction, bindKeyboard(), CODE_DIRECTIONS, isTypingTarget(), KEY_DIRECTIONS

### Community 2 - "Package Dependencies"
Cohesion: 0.11
Nodes (22): dependencies, react@^19.3.1, react-dom@^19.3.1, description, devDependencies, @types/react@^19.3.0, @types/react-dom@^19.3.0, typescript@^7.0.2 (+14 more)

### Community 3 - "React UI Components"
Cohesion: 0.20
Nodes (11): react, App(), BUTTONS, DirectionPad(), GameBoard(), Props, ChevronIcon(), DIFFICULTY_LABELS (+3 more)

### Community 4 - "Tooling Config"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 5 - "Canvas Renderer"
Cohesion: 0.27
Nodes (12): circle(), clamp01(), drawFrame(), drawWrapped(), easeOutBack(), FrameInfo, lerp(), mixRgb() (+4 more)

### Community 6 - "HUD & Icons"
Cohesion: 0.50
Nodes (6): Hud(), Stat(), PauseIcon(), PlayIcon(), RestartIcon(), ROTATION

### Community 7 - "NPM Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, preview, test, test:watch, typecheck

### Community 8 - "Vercel Config"
Cohesion: 0.29
Nodes (6): buildCommand, framework, headers, installCommand, outputDirectory, $schema

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GameController` connect `Game Controller` to `Game Engine & State`, `React UI Components`, `HUD & Icons`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **Should `Game Engine & State` be split into smaller, more focused modules?**
  _Cohesion score 0.1350806451612903 - nodes in this community are weakly interconnected._
- **Why does `react` connect `React UI Components` to `Package Dependencies`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Should `Game Controller` be split into smaller, more focused modules?**
  _Cohesion score 0.13227513227513227 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `Package Dependencies` to `Game Engine & State`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11231884057971014 - nodes in this community are weakly interconnected._
- **Should `Tooling Config` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._