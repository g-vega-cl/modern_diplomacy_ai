# Modern Diplomacy AI: Architecture & Game Plan

## 1. Game Purpose & Vision
The goal is to build a modern, locally-run, frontend-only implementation of the classic board game **Diplomacy**. This platform will allow a human player to interact, negotiate, and compete against Large Language Models (LLMs) acting as the other major European powers. 

Because Diplomacy relies heavily on negotiation, trust, and backstabbing, the LLM integration is central. The game will run entirely in the browser (local execution) without needing a complex backend, ensuring privacy and portability.

## 2. High-Level Architecture
As a frontend-only application, the architecture will consist of three main pillars:

### A. The UI and Map Engine
* **Technology**: Modern frontend framework (e.g., React or Vue) for reactive state management, combined with Vanilla CSS for a premium aesthetic.
* **Map Rendering**: An interactive SVG-based map of standard Diplomacy (Europe, North Africa, Middle East).
  * SVG paths will represent the 75 provinces (land, sea, coastal).
  * Units (Armies, Fleets) will be rendered over the SVG and animated during resolution.
* **Control Panel**: Interfaces for the human player to submit orders (Hold, Move/Attack, Support, Convoy, Build, Disband).
* **Communication Hub**: A chat interface to send and receive diplomatic messages with the LLMs.

### B. The Rules Engine (Adjudicator)
Diplomacy order resolution is notoriously complex (paradoxes, convoys, support cuts). Ensure 100% compliance with standard rules.
* **DATC (Diplomacy Adjudicator Test Cases)**: The engine will be validated against the `DATC3.md` test cases to ensure edge cases (e.g., the "Pandin's Paradox") are handled flawlessly.
* **State Management**: The game state will be an immutable object representing the current phase (Spring/Fall Orders, Retreats, Winter Builds), unit locations, and province ownership.

### C. The LLM Agent System
* **State Serialization**: The engine must convert the visual board state and valid moves into a structured text/JSON format that LLMs can easily understand.
* **Negotiation Module**: LLMs need to receive text from the human, parse intent, and reply. They also need to "talk" to each other in the background (simulated).
* **Order Generation**: Based on the board state and negotiations, LLMs must output strictly formatted orders that the adjudicator can parse.

## 3. Data Representation
To make the game function locally and interface well with LLMs, data must be highly structured:

* **Map Graph**: A static JSON defining every province, its type (Land, Water, Coast), and its adjacencies (including specific coasts like Spain North/South Coast).
* **GameState Object**: 
  ```json
  {
    "year": 1901,
    "season": "Spring",
    "phase": "Orders",
    "supplyCenters": { "ENG": ["Lon", "Lpl", "Edi"], ... },
    "units": { "ENG": [{ "type": "Fleet", "location": "Lon" }, ...] },
    "dislodged": []
  }
  ```

## 4. Interaction Flow
A standard turn will look like this:
1. **Diplomacy Phase**: Human and LLMs exchange messages. Messages are processed asynchronously.
2. **Order Writing Phase**: Human inputs moves via the UI. LLMs generate their moves under the hood. Only valid moves are accepted.
3. **Adjudication Phase**: The engine simultaneously resolves all orders, applying the rules, and updating the state.
4. **Retreats/Builds**: If necessary, conditional phases are triggered, prompting only the affected powers for decisions.
5. **Animation**: The UI visually updates the board to reflect the resolved state.

## 5. Design & Aesthetics
* **Theme**: A premium, "war room" style dark mode with high-contrast, elegant colors for each nation (e.g., deep red for Austria, royal blue for France).
* **Animations**: Smooth transitions when units move, retreat, or are destroyed to make the game feel alive instead of a static spreadsheet.

---

## Areas for Clarification & Refinement
To finalize this architecture, some decisions need to be made. Review the questions below.
