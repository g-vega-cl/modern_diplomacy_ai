# Vertical Architecture & TDD Refactoring Plan

## Objective
Transition the `modern_diplomacy_ai` codebase from a mixed architecture to a strict vertical (feature-based) structure using Test-Driven Development (TDD) principles.

## TDD Workflow
For every change below, we will follow the Red-Green-Refactor cycle:
1.  **Red**: Write failing tests for the expected behavior (or verify existing tests fail when we start moving logic).
2.  **Green**: Implement the change or move the code until the tests pass.
3.  **Refactor**: Clean up dependencies, types, and remove the duplicated/legacy code.

---

## Phase 1: Consolidate `ChatManager` (Eliminating Duplication)
**Goal:** Make `src/features/negotiation/chat-manager.ts` the single source of truth for chat logic, removing the duplicate implementation in `ai-orchestrator/engine-bridge.ts`.

1.  **Test (Red):** Review and expand `src/features/negotiation/__tests__/chat-manager.test.ts` to ensure it covers all methods required by the AI orchestrator (e.g., `getPlayerChannels`, `getMessagesSince`, `reset`).
2.  **Implementation (Green):** Update the `ChatManager` in `src/features/negotiation/chat-manager.ts` to satisfy these tests.
3.  **Refactor:** 
    - Modify `ai-orchestrator/engine-bridge.ts` to import the shared `ChatManager` instead of defining its own.
    - Run all orchestrator and engine tests to confirm everything works.

---

## Phase 2: Unify API Patterns & Boundaries
**Goal:** Standardize the API approach. Currently, `users` uses TanStack Start (`src/routes/api/users.ts`) while `chat` and `game` use Nitro (`server/api/`).

1.  **Test (Red):** Write integration tests for the current endpoints to ensure their contracts (input/output) do not change during the migration.
2.  **Implementation (Green):** 
    - *Decision Required:* We will standardize on using TanStack Start API routes (`src/routes/api/`) which can delegate to feature-specific logic, OR keep Nitro (`server/api/`) but have it act purely as a transport layer that imports logic from `src/features/`.
    - *Action:* Move the business logic out of the route files and into their respective feature's `server/` subdirectory (e.g., `src/features/negotiation/server/chat-service.ts`).
3.  **Refactor:** Update the route handlers to be minimal pass-throughs calling the feature services.

---

## Phase 3: Verticalize the `Users` Module
**Goal:** Move `users` away from the layered architecture (`src/utils/users.tsx` + `src/routes/api/users.ts`) into a cohesive feature slice.

1.  **Test (Red):** Create `src/features/users/__tests__/user-service.test.ts`. Write tests for fetching and managing user data.
2.  **Implementation (Green):** 
    - Create `src/features/users/`.
    - Move types and logic from `src/utils/users.tsx` to `src/features/users/types.ts` and `src/features/users/service.ts`.
    - Move UI components to `src/features/users/components/`.
3.  **Refactor:** Update `src/routes/users.tsx` and API routes to import exclusively from `src/features/users/`. Delete `src/utils/users.tsx`.

---

## Phase 4: Formalize `Engine` as a Core Feature
**Goal:** The engine is well-tested but acts as a global shared resource. We need to formalize its boundary so that `server/game/game-manager.ts` and `src/cli/index.ts` use it without duplicating state transition logic.

1.  **Test (Red):** Check `src/features/engine/__tests__/`. Write tests defining the strict expected contract for state transitions (e.g., ensuring `GameManager` logic isn't leaked out).
2.  **Implementation (Green):** Ensure `src/features/engine/engine.ts` encapsulates all phase transitions perfectly.
3.  **Refactor:** 
    - Refactor `src/cli/index.ts` to strictly consume the engine's public API without reimplementing the loop.
    - Refactor `server/game/game-manager.ts` similarly.

## Next Steps
We will begin with **Phase 1: Consolidate ChatManager** to eliminate the immediate logic duplication.
