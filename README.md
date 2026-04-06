# Game Design Documentation for Modern Diplomacy AI

## Overview
This document outlines the complete game design for the Modern Diplomacy AI strategy board game.

## Game Concept
The game is a strategy board game where players control different nations and engage in diplomacy, warfare, and alliances to achieve dominance.

## Constraints
- Each player can control only one nation.
- Game duration is limited to 50 turns.
- Players must adhere to international diplomacy rules.

## Mechanics
- Players take turns negotiating and submitting orders.
- Alliances can be formed and broken at any time.

### Troop Counts
- Each nation starts with a fixed number of troops:
    - Infantry: 10
    - Cavalry: 5
    - Artillery: 3

### Combat Formulas
- Combat is resolved using the following formula:
  - For each troop type involved in a battle, roll a six-sided die (1d6).
  - Combat results determine troop losses based on the number of troops engaged and the roll result.

### Turn Order Systems
- Turn order is determined randomly at the start of the game and rotates clockwise.
- Players must submit their orders before the end of each turn.

## Conclusion
This document serves as a comprehensive guide to the game's design, ensuring all players understand the mechanics and constraints involved in playing Modern Diplomacy AI.