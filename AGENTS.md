# Project Instructions: Modern Diplomacy AI

## Architecture: Vertical Feature Slices

The project follows a **vertical codebase structure**. Each feature should be self-contained within a directory under `src/features/`.

### Feature Structure
Each feature directory (e.g., `src/features/negotiation/`) should ideally contain:
- `server/`: Server-side state, managers, and business logic (e.g., `chat-manager.ts`, `user-service.ts`).
- `components/`: React UI components.
- `types.ts`: Feature-specific TypeScript interfaces.
- `__tests__/`: Comprehensive tests for the feature.
- `index.ts`: Barrel export for the feature's public API.

### API Standardization
We use **TanStack Start API routes** located in `src/routes/api/`. 
- **NO Nitro routes** in `server/api/`.
- API route files must be thin wrappers that delegate business logic to a service or manager inside a feature's `server/` directory.
- Use dynamic parameter syntax (e.g., `$id.ts` or `$playerId.ts`) as per TanStack Router conventions.

## Development Workflow: TDD

Always use **Test-Driven Development (TDD)** for new features or bug fixes.
1. **Red**: Write a failing test in the feature's `__tests__/` directory.
2. **Green**: Implement the minimal code to pass the test.
3. **Refactor**: Clean up the implementation while keeping tests green.

### Running Tests
- `pnpm test`: Runs all Vitest suites.
- `pnpm test <path>`: Runs a specific test file.

## AI Bridge
The `ai-orchestrator/engine-bridge.ts` is a critical component that allows Python agents to interact with the TypeScript game engine. 
- It MUST import shared managers (like `ChatManager`) from `src/features/` to avoid logic duplication.
- Any change to game rules or chat behavior must be reflected in the bridge and its tests (`ai-orchestrator/__tests__/engine-bridge.test.ts`).
