# WORLD DOMINION — Game Design Specification
**Version:** 0.2  
**Status:** In Development  
**Last Updated:** 2026-04-06  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Factions](#2-factions)
3. [Win Condition](#3-win-condition)
4. [Map & Regions](#4-map--regions)
5. [Region Traits](#5-region-traits)
6. [Combat System](#6-combat-system)
7. [Troop Economy](#7-troop-economy)
8. [Turn Structure](#8-turn-structure)
9. [Diplomacy](#9-diplomacy)
10. [The Storyteller Role](#10-the-storyteller-role)
11. [Occupation & Resistance](#11-occupation--resistance)
12. [Last Stand Mode](#12-last-stand-mode)
13. [National Identity Bonuses](#13-national-identity-bonuses)
14. [Full Region List](#14-full-region-list)
15. [Adjacency Map](#15-adjacency-map)
16. [TODOs & Open Questions](#16-todos--open-questions)

---

## 1. Overview

**World Dominion** is a turn-based strategy board game for 2–9 players set on a modern-day world map. Players control one of nine major world powers and compete through military strategy, economic management, and diplomacy.

**Core design pillars:**
- Simplicity over complexity — every rule should be explainable in one sentence
- Geopolitical realism — regions, traits, and chokepoints reflect real-world strategic logic
- Emergent narrative — the Storyteller role and diplomacy create stories, not just mechanics
- Every dollar counts — GDP drives everything: troops, production, and victory

---

## 2. Factions

Each faction starts with a number of regions and troops proportional to its real-world GDP. One region ≈ $1 Trillion USD GDP.

| Faction | Starting Regions | Base Troops | Starting GDP |
|---|---|---|---|
| United States (USA) | 28 | 28 | ~$28T |
| European Union (EU) | 18 | 18 | ~$18T |
| China | 18 | 18 | ~$18T |
| India | 4 | 4 | ~$4T |
| Japan | 4 | 4 | ~$4T |
| United Kingdom (UK) | 3 | 3 | ~$3T |
| Russia | 2 | 3* | ~$2T |
| Brazil | 2 | 2 | ~$2T |
| South Korea | 2 | 2 | ~$2T |

> *Russia receives +1 troop from its **Militaristic** national identity bonus (see Section 13).

**Neutral regions** (~27 regions, ~$27T total GDP) are managed by the Storyteller.

---

## 3. Win Condition

**A player wins by controlling regions that represent more than 50% of total global GDP.**

- Global GDP baseline = ~$105 Trillion
- Win threshold = regions worth >$52.5T
- GDP is calculated as the sum of all controlled regions' GDP values
- The win condition is checked at the **end of each year** (after all turns resolve)
- If multiple players cross 50% simultaneously (edge case), the player with the higher GDP total wins

---

## 4. Map & Regions

### 4.1 Structure

The world is divided into approximately **108 regions**, each representing roughly $1 Trillion USD in GDP. Regions are the fundamental unit of territory — owning a region grants its GDP value, its trait bonus (if any), and its base troop garrison.

### 4.2 Movement Rules

- A troop can move **one region per turn**
- Multiple troops can occupy the same region
- A troop cannot move and attack in the same action — moving into a hostile region **initiates combat**
- Island regions (Hawaii, Japan, UK, etc.) require a **Naval Base** trait in an adjacent region to be accessed, unless the attacker already controls an adjacent coastal region

### 4.3 Chokepoint Regions

Certain regions have strategic chokepoint traits that allow their controller to affect global movement or resources. See Section 5 for full trait definitions.

Key chokepoints:
- **Iran** — Strait of Hormuz
- **Egypt** — Suez Canal
- **Turkey** — Bosphorus / Strategic Chokepoint
- **Indonesia** — Malacca Strait / Naval Chokepoint
- **China: Hainan & South China Sea** — Naval Chokepoint

---

## 5. Region Traits

Each region may have zero or one trait. Traits provide passive bonuses, active abilities, or special rules for their controller.

| Trait | Effect |
|---|---|
| **Energy Exporter** | Produces surplus energy. Immune to Energy Insufficiency debuff. Can sell energy to allies (TODO: define economic mechanic). |
| **Energy Self-Reliance** | Fully immune to Strait of Hormuz and any Energy Insufficiency debuff, regardless of source. |
| **Financial Hub** | +0.5 GDP bonus per game year added to this region's value. May be priority target for economic warfare actions. |
| **Tech Hub** | *(TODO — define bonus)* |
| **Industry** | *(TODO — define bonus)* |
| **Trade Hub** | *(TODO — define bonus)* |
| **Agriculture** | *(TODO — define bonus)* |
| **Naval Base** | Allows the controlling faction to project troops to non-adjacent coastal regions (counts as two moves in one turn). |
| **Naval Chokepoint** | Controller may impose a movement penalty: troops passing through this region cost 1 extra move. Active ability — must be declared at the start of the year. |
| **Strait of Hormuz** *(Iran only)* | Controller may declare **"Close the Strait"** once per year. Effect: all factions that do not have Energy Self-Reliance or Energy Exporter in at least one owned region suffer **Energy Insufficiency** debuff: -2 to all attack and defense D20 rolls for the remainder of the year. |
| **Suez Canal** *(Egypt only)* | Controller may declare **"Close the Canal"** once per year. Effect: naval movement between Mediterranean-adjacent regions and Indian Ocean-adjacent regions costs +2 moves for all other factions. |
| **Strategic Chokepoint** *(Turkey only)* | Similar to Naval Chokepoint but applies specifically to Black Sea access. Controller may restrict passage for one faction per year. |

### 5.1 Chokepoint Activation Rules

- Chokepoint abilities are **active** — they must be declared by the controlling player
- They can only be activated **once per game year**
- They last until the **end of that game year**
- They can be countered or nullified by the relevant immunity traits

---

## 6. Combat System

### 6.1 Attack Declaration

A player may declare an attack when they have troops in a region **adjacent** to a hostile region. The attacker moves any number of their troops from the adjacent region into the contested region.

### 6.2 Attack Resolution Formula

```
Attack succeeds if:
  SUM(Attacker D20 rolls) > SUM(Defender D20 rolls) × 2

Otherwise, Defense succeeds.
```

- Each troop rolls **one D20**
- **Bonuses and debuffs** from traits, national identity, yearly focus, and active effects are applied to individual rolls before summing
- Rolls are simultaneous

**Example:** 3 attacking troops roll 14, 9, 18 → Sum = 41. 2 defending troops roll 12, 15 → Sum = 27 × 2 = 54. 41 < 54 → Defense wins.

### 6.3 Troop Breaking (Casualties)

When a side loses a combat, each of their troops has a **chance to break** (be permanently destroyed):

```
Break chance per troop = |SUM(Losers rolls) - SUM(Winners rolls × 2)| / 40
```

- This is calculated as a probability (0.0 to 1.0), capped at 1.0
- Roll a D20 for each troop on the losing side: if the result ≤ (Break Chance × 20), the troop is broken and removed
- Broken troops are **permanently destroyed** and removed from both field and stockpile

**Example:** Difference = 13. Break chance = 13/40 = 0.325. Each losing troop rolls D20 — on a 1–6 (≈32.5% of 20), they break.

### 6.4 Retreat

- If the **defense fails** and no defending troops break, the defending troops **retreat** to an adjacent friendly region
- If the **attack fails** and no attacking troops break, the attacking troops **retreat** to their origin region
- A troop cannot retreat into a region that has no adjacent friendly territory — if no valid retreat exists, breaking chance doubles

### 6.5 Region Capture

- If the **attack succeeds**, the attacker takes control of the region
- All surviving defending troops retreat or are broken
- The region immediately applies its **Resistance modifier** (see Section 11)
- The attacker's GDP increases by the captured region's GDP value at the **end of the current year**

---

## 7. Troop Economy

### 7.1 Troop Representation

One troop ≈ $1 Trillion GDP in military capacity.

### 7.2 Base Troop Counts (Starting Field Troops)

See Section 2. These are the troops each faction starts with **on the field**.

### 7.3 Troop Cap (Maximum Field Troops)

Each faction has a **maximum number of troops** it can have on the field at any time, based on its current GDP:

```
Field Troop Cap = Number of regions currently controlled (i.e., current GDP in $T)
```

If a faction loses regions and drops below its current field troop count, it cannot produce new troops until field troops fall back below the cap naturally (through attrition or combat losses).

### 7.4 Troop Stockpile (Population Reserve)

Each faction has a **total troop stockpile** representing its population and military reserve. Stockpile is larger than the field cap and is depleted when troops are broken in combat.

Base stockpiles at game start:

| Faction | Stockpile |
|---|---|
| USA | 50 |
| EU | 40 |
| China | 80 |
| India | 60 |
| Japan | 20 |
| UK | 15 |
| Russia | 25 |
| Brazil | 30 |
| South Korea | 10 |

> China and India have significantly larger stockpiles to reflect their population sizes.

### 7.5 Troop Production

- **Once per year**, each faction may produce **one new troop** from their stockpile and place it in any region they control
- The troop must come from the stockpile — if stockpile is empty, no production is possible
- Special events, bonuses, or yearly focus (Economic) may modify production rate
- Troops cannot be produced above the current field troop cap

### 7.6 Population Stockpile Debuffs

As a faction's stockpile depletes, it suffers escalating penalties:

*(TODO — define specific thresholds and debuff values. Suggested: penalties at 75%, 50%, 25%, and 10% of starting stockpile.)*

---

## 8. Turn Structure

### 8.1 Year Overview

The game is organized into **years**. Each year consists of **3 turns** (representing ~4 months each).

```
YEAR START
  → All players secretly choose Yearly Focus
  → Turn order is randomized (see 8.3)

  TURN 1 (Months 1–4)
    → Each player makes their Turn Choice (yes/no decision)
    → Players take actions in turn order
    → Combat resolves

  TURN 2 (Months 5–8)
    → Each player makes their Turn Choice
    → Players take actions in turn order
    → Combat resolves

  TURN 3 (Months 9–12)
    → Each player makes their Turn Choice
    → Players take actions in turn order
    → Combat resolves

YEAR END
  → Troop production phase (each faction adds 1 troop if eligible)
  → GDP recalculated based on controlled regions
  → Win condition checked
  → Chokepoint effects expire
  → New year begins
```

### 8.2 Yearly Focus

At the start of each year, each player **secretly selects one focus**. Focus is revealed simultaneously before Turn 1 begins.

| Focus | Effect |
|---|---|
| **Offensive** | +1 to all attack D20 rolls this year |
| **Defensive** | +1 to all defense D20 rolls this year |
| **Economic** | Produce 1 additional troop at Year End (if under cap and stockpile allows) |

### 8.3 Turn Order

- Turn order within each year is **randomized** at the start of the year
- All players use the same order for all 3 turns within that year
- Base odds are equal (each faction has equal probability of any position)
- Certain national identity bonuses or event cards may modify turn order odds *(TODO — define these)*

### 8.4 Turn Actions

On their turn, a player may perform the following actions (order is player's choice):

1. **Move troops** — move any number of troops, each up to 1 region
2. **Declare attacks** — any troop that moved into a hostile region initiates combat
3. **Activate a chokepoint** — if controlling a chokepoint region, may declare its effect
4. **Negotiate** — may communicate with any other player at any time (see Section 9)

### 8.5 Turn Choice (Yes/No Decision)

At the start of each turn, every player is presented with a **yes/no event card** relevant to their situation. Each choice has a tradeoff.

*(TODO — define full list of yes/no choices. Examples: "Do you increase military spending this quarter? YES: +1 attack roll this turn, NO: +0.5 GDP bonus at year end." These should be faction-agnostic and context-sensitive.)*

---

## 9. Diplomacy

### 9.1 Negotiation

- Players may communicate and negotiate **at any time**, including during other players' turns
- There is **no mechanical enforcement** of agreements — deals can be broken freely, just as in real geopolitics
- Reputation is the only currency: other players track who breaks deals and may respond accordingly

### 9.2 Types of Agreements (Informal)

Players may propose any of the following (all non-binding):

- **Non-aggression pact** — agree not to attack each other for a defined period
- **Military alliance** — agree to jointly attack or defend a region
- **Trade deal** — agree to share GDP bonuses or resource traits *(TODO — define economic trade mechanics)*
- **Vassal arrangement** — weaker faction agrees to support stronger faction in exchange for protection

### 9.3 Storyteller Diplomacy

The Storyteller (neutral country manager) may also negotiate on behalf of neutral factions. Neutral factions may offer allegiance or resources to player factions in exchange for protection from aggression.

---

## 10. The Storyteller Role

### 10.1 Overview

The **Storyteller** (also called Game Master) is a non-player role responsible for managing all **neutral regions and factions**. The Storyteller does not compete to win but shapes the narrative and manages neutral actors.

### 10.2 Responsibilities

- Controls all neutral-region troops defensively
- Roleplays neutral country behavior in response to player actions
- Manages the narrative arc of the game (e.g., if a player is being aggressive, neutral neighbors seek alliances)
- May combine neutral troops into **defensive coalitions** against aggressive players
- Adjudicates ambiguous situations and edge cases

### 10.3 Storyteller Principles

- Neutral factions always act **defensively first**
- Neutrals will seek alliances with player factions when threatened
- Neutrals can offer their troops and GDP to player factions as allies, pooling resources for defense
- The Storyteller should reward diplomatic players and make aggressive expansion narratively costly (resistance, coalitions, etc.)

### 10.4 Neutral Faction Troops

Neutral factions have base troops equal to their GDP (1 troop per $1T), matching the same scale as player factions. Notable neutral starting troops:

| Neutral Region | Approx. GDP | Base Troops |
|---|---|---|
| Canada West | $1.0T | 1 |
| Canada East | $1.0T | 1 |
| Mexico North | $0.8T | 1 |
| Mexico South | $0.7T | 1 |
| Turkey | $1.0T | 1 |
| Saudi Arabia | $1.0T | 1 |
| Australia East | $0.9T | 1 |
| Indonesia | $1.0T | 1 |
| Taiwan | $0.7T | 1 |

---

## 11. Occupation & Resistance

### 11.1 Resistance Modifier

When a player captures a region, that region enters a **Resistance** state. While in Resistance:

- The occupying faction's troops in that region have a **-2 penalty** to all defense rolls
- The region generates **reduced GDP**: 50% of its listed value for the year following capture
- Resistance lasts for **1 full year** after capture

### 11.2 Pacification

After 1 full year of unbroken occupation, the region is considered **pacified**:

- The -2 defense penalty is removed
- GDP returns to full value
- If the region changes hands again, Resistance resets

### 11.3 Storyteller Resistance Events

The Storyteller may introduce **resistance events** during occupation — special narrative moments that create additional challenges for occupying factions.

*(TODO — define a list of resistance event types and their mechanical effects.)*

---

## 12. Last Stand Mode

### 12.1 Trigger

A faction enters **Last Stand** when it has **no regions remaining** under its control. This can happen when all its territories are captured.

### 12.2 Last Stand Rules

- All remaining troops of the faction are considered in Last Stand
- Last Stand troops receive a **×2 multiplier** on all D20 rolls for their final engagement
- Last Stand troops may make **one final attack** on any adjacent region before disbanding
- If the Last Stand attack succeeds, the faction recaptures that region and exits Last Stand
- If the Last Stand attack fails, all remaining troops are disbanded and the faction is **eliminated**

### 12.3 Disbanding

- Disbanded troops are removed from the game entirely
- Their regions remain under the control of whoever captured them
- An eliminated faction may continue participating as a diplomatic observer (Storyteller's discretion)

---

## 13. National Identity Bonuses

Each faction has a unique **National Identity** — a passive bonus that reflects its real-world character. These are applied at all times unless otherwise specified.

| Faction | Identity | Bonus |
|---|---|---|
| **Russia** | Militaristic | Start with +1 extra troop (3 instead of 2). +1 to all defense rolls in Russian home regions. |
| **USA** | *(TODO)* | *(TODO)* |
| **EU** | *(TODO)* | *(TODO)* |
| **China** | *(TODO)* | *(TODO)* |
| **India** | *(TODO)* | *(TODO)* |
| **Japan** | *(TODO)* | *(TODO)* |
| **UK** | *(TODO)* | *(TODO)* |
| **Brazil** | *(TODO)* | *(TODO)* |
| **South Korea** | *(TODO)* | *(TODO)* |

> **Design note:** Identities should be thematically grounded and mechanically distinct. Avoid giving two factions the same type of bonus. Consider: diplomatic bonuses (EU), economic bonuses (Japan, South Korea), production bonuses (China, India), geographic/defensive bonuses (USA, UK).

---

## 14. Full Region List

### 14.1 United States (28 Regions)

| ID | Region Name | GDP ($T) | Base Troops | Trait |
|---|---|---|---|---|
| usa_pacific_north | Pacific Coast North | 1.2 | 1 | Tech Hub |
| usa_pacific_south | Pacific Coast South | 1.5 | 2 | Tech Hub |
| usa_california_c | California Central | 1.0 | 1 | Agriculture |
| usa_california_s | California South | 1.2 | 1 | — |
| usa_mountain_west | Mountain West | 1.0 | 1 | — |
| usa_southwest | Southwest | 1.0 | 1 | — |
| usa_texas_north | Texas North | 1.2 | 1 | Energy Exporter |
| usa_texas_south | Texas South | 1.3 | 1 | Energy Exporter |
| usa_plains_north | Great Plains North | 0.8 | 1 | Agriculture |
| usa_plains_south | Great Plains South | 0.8 | 1 | Agriculture |
| usa_midwest_ind | Midwest Industrial | 1.2 | 1 | Industry |
| usa_great_lakes | Great Lakes | 1.2 | 1 | Industry |
| usa_mid_south | Mid-South | 0.9 | 1 | — |
| usa_deep_south | Deep South | 0.9 | 1 | — |
| usa_southeast | Southeast | 1.0 | 1 | — |
| usa_florida | Florida | 1.1 | 1 | — |
| usa_appalachia | Appalachia | 0.7 | 1 | Energy Exporter |
| usa_midatl_south | Mid-Atlantic South | 1.0 | 1 | — |
| usa_midatl_north | Mid-Atlantic North | 1.1 | 1 | — |
| usa_pennsylvania | Pennsylvania | 0.9 | 1 | — |
| usa_nyc | New York City | 1.5 | 2 | Financial Hub |
| usa_ny_state | New York State | 0.9 | 1 | — |
| usa_ne_north | New England North | 0.6 | 1 | — |
| usa_ne_south | New England South | 0.9 | 1 | — |
| usa_alaska | Alaska | 0.6 | 1 | Energy Self-Reliance |
| usa_hawaii | Hawaii | 0.8 | 1 | Naval Base |
| usa_puertorico | Puerto Rico & Territories | 0.5 | 1 | — |
| usa_appalachian_e | Appalachian Energy Belt | 0.7 | 1 | Energy Exporter |

### 14.2 European Union (18 Regions)

| ID | Region Name | GDP ($T) | Base Troops | Trait |
|---|---|---|---|---|
| eu_germany_west | Germany West & Ruhr | 1.1 | 1 | Industry |
| eu_germany_east | Germany East & South | 1.0 | 1 | Industry |
| eu_germany_north | Germany North | 0.9 | 1 | Trade Hub |
| eu_france_north | France North | 1.0 | 1 | — |
| eu_france_south | France South | 1.0 | 1 | — |
| eu_italy_north | Italy North | 1.0 | 1 | Industry |
| eu_italy_south | Italy South | 0.8 | 1 | — |
| eu_spain_north | Iberian North | 0.8 | 1 | — |
| eu_spain_south | Iberian South | 0.7 | 1 | — |
| eu_netherlands | Netherlands & Belgium | 1.0 | 1 | Trade Hub |
| eu_poland | Poland | 0.8 | 1 | — |
| eu_sweden | Sweden & Norway | 0.7 | 1 | Energy Self-Reliance |
| eu_austria_czech | Austria & Czech Rep. | 0.7 | 1 | — |
| eu_denmark_finland | Denmark & Finland | 0.6 | 1 | — |
| eu_portugal_greece | Portugal & Greece | 0.6 | 1 | — |
| eu_romania_hungary | Romania & Hungary | 0.5 | 1 | — |
| eu_baltics | Baltic States | 0.4 | 1 | — |
| eu_ireland | Ireland | 0.5 | 1 | — |

### 14.3 China (18 Regions)

| ID | Region Name | GDP ($T) | Base Troops | Trait |
|---|---|---|---|---|
| china_beijing | Beijing & Hebei | 1.2 | 1 | — |
| china_shanghai | Shanghai & Jiangsu | 1.8 | 2 | Financial Hub |
| china_guangdong | Guangdong (Pearl River) | 1.6 | 2 | Trade Hub |
| china_zhejiang | Zhejiang & Fujian | 1.1 | 1 | — |
| china_shandong | Shandong | 1.0 | 1 | — |
| china_henan | Henan & Anhui | 0.9 | 1 | Agriculture |
| china_hubei | Hubei & Hunan | 0.9 | 1 | — |
| china_sichuan | Sichuan & Chongqing | 0.9 | 1 | — |
| china_liaoning | Liaoning & Jilin | 0.8 | 1 | Industry |
| china_heilong | Heilongjiang | 0.6 | 1 | — |
| china_shanxi | Shanxi & Shaanxi | 0.7 | 1 | Energy Exporter |
| china_yunnan | Yunnan & Guizhou | 0.6 | 1 | — |
| china_guangxi | Guangxi | 0.5 | 1 | — |
| china_inner_mongolia | Inner Mongolia | 0.5 | 1 | — |
| china_xinjiang | Xinjiang | 0.4 | 1 | — |
| china_tibet | Tibet | 0.2 | 1 | — |
| china_gansu | Gansu & Qinghai | 0.3 | 1 | — |
| china_hainan | Hainan & South China Sea | 0.5 | 1 | Naval Chokepoint |

### 14.4 India (4 Regions)

| ID | Region Name | GDP ($T) | Base Troops | Trait |
|---|---|---|---|---|
| india_north | North India | 1.2 | 1 | Agriculture |
| india_west | West India | 1.2 | 1 | Industry |
| india_south | South India | 1.0 | 1 | Tech Hub |
| india_east | East India | 0.8 | 1 | — |

### 14.5 Japan (4 Regions)

| ID | Region Name | GDP ($T) | Base Troops | Trait |
|---|---|---|---|---|
| japan_kanto | Kanto (Tokyo Metro) | 1.5 | 2 | Financial Hub |
| japan_kansai | Kansai (Osaka/Kyoto) | 1.2 | 1 | Industry |
| japan_chubu | Chubu (Nagoya) | 1.0 | 1 | Industry |
| japan_north_south | Hokkaido & Kyushu | 0.5 | 1 | — |

### 14.6 United Kingdom (3 Regions)

| ID | Region Name | GDP ($T) | Base Troops | Trait |
|---|---|---|---|---|
| uk_london | England South (London) | 1.2 | 1 | Financial Hub |
| uk_england_north | England North & Midlands | 1.0 | 1 | Industry |
| uk_scotland | Scotland & Wales & NI | 0.8 | 1 | — |

### 14.7 Russia (2 Regions)

| ID | Region Name | GDP ($T) | Base Troops | Trait |
|---|---|---|---|---|
| russia_west | Western Russia | 1.2 | 1 | Energy Exporter |
| russia_siberia | Siberia & Far East | 0.8 | 1 | Energy Self-Reliance |

### 14.8 Brazil (2 Regions)

| ID | Region Name | GDP ($T) | Base Troops | Trait |
|---|---|---|---|---|
| brazil_se | Southeast Brazil | 1.2 | 1 | Agriculture |
| brazil_north | North & Northeast Brazil | 0.8 | 1 | — |

### 14.9 South Korea (2 Regions)

| ID | Region Name | GDP ($T) | Base Troops | Trait |
|---|---|---|---|---|
| skorea_seoul | Seoul Capital Region | 1.2 | 1 | Tech Hub |
| skorea_south | Southern Korea | 0.8 | 1 | Industry |

### 14.10 Neutral Regions (~27 Regions)

| ID | Region Name | GDP ($T) | Base Troops | Trait |
|---|---|---|---|---|
| canada_west | Canada West | 1.0 | 1 | Energy Self-Reliance |
| canada_east | Canada East | 1.0 | 1 | — |
| mexico_north | Mexico North | 0.8 | 1 | — |
| mexico_south | Mexico South | 0.7 | 1 | — |
| central_america | Central America & Caribbean | 0.5 | 1 | — |
| colombia_venezuela | Colombia & Venezuela | 0.5 | 1 | Energy Exporter |
| andean | Andean States | 0.4 | 1 | — |
| southern_cone | Southern Cone | 0.8 | 1 | Agriculture |
| australia_east | Australia East | 0.9 | 1 | — |
| australia_west | Australia West | 0.6 | 1 | Energy Self-Reliance |
| saudi_arabia | Saudi Arabia | 1.0 | 1 | Energy Exporter |
| uae_gulf | UAE & Gulf States | 0.8 | 1 | Energy Exporter |
| iran | Iran | 0.5 | 1 | Strait of Hormuz |
| turkey | Turkey | 1.0 | 1 | Strategic Chokepoint |
| indonesia | Indonesia | 1.0 | 1 | Naval Chokepoint |
| thailand_vietnam | Thailand & Vietnam | 0.8 | 1 | — |
| philippines_malaysia | Philippines & Malaysia | 0.7 | 1 | — |
| pakistan_afghan | Pakistan & Afghanistan | 0.4 | 1 | — |
| nigeria | Nigeria | 0.5 | 1 | Energy Exporter |
| south_africa | South Africa | 0.4 | 1 | — |
| egypt | Egypt | 0.4 | 1 | Suez Canal |
| east_africa | East Africa | 0.4 | 1 | — |
| central_africa | Central Africa | 0.3 | 1 | — |
| west_africa | West Africa (ex-Nigeria) | 0.5 | 1 | — |
| north_africa | North Africa | 0.4 | 1 | — |
| levant | Israel & Levant | 0.5 | 1 | — |
| iraq_kuwait | Iraq & Kuwait | 0.3 | 1 | Energy Exporter |
| central_asia | Kazakhstan & Central Asia | 0.4 | 1 | — |
| taiwan | Taiwan | 0.7 | 1 | Tech Hub |

---

## 15. Adjacency Map

Each region can only be attacked or moved into from an adjacent region. The following lists each region's neighbors. Overseas/island adjacencies require a Naval Base unless otherwise noted.

### USA
| Region | Adjacent To |
|---|---|
| Pacific Coast North | Pacific Coast South, Mountain West, Canada West |
| Pacific Coast South | Pacific Coast North, California Central, Mountain West |
| California Central | Pacific Coast South, California South, Mountain West, Southwest |
| California South | California Central, Southwest |
| Mountain West | Pacific Coast North, Pacific Coast South, California Central, Southwest, Great Plains South, Great Plains North |
| Southwest | California South, Mountain West, Texas North, Mexico North |
| Texas North | Southwest, Texas South, Great Plains South, Mid-South |
| Texas South | Texas North, Deep South, Mexico North |
| Great Plains North | Mountain West, Great Plains South, Great Lakes, Canada East |
| Great Plains South | Mountain West, Great Plains North, Texas North, Mid-South, Midwest Industrial |
| Midwest Industrial | Great Lakes, Great Plains South, Mid-South, Appalachia, Pennsylvania |
| Great Lakes | Great Plains North, Midwest Industrial, New York State, Canada East |
| Mid-South | Great Plains South, Texas North, Deep South, Appalachia, Midwest Industrial |
| Deep South | Texas South, Mid-South, Southeast |
| Southeast | Deep South, Florida, Appalachia, Mid-Atlantic South |
| Florida | Southeast, Central America & Caribbean *(naval)* |
| Appalachia | Midwest Industrial, Mid-South, Southeast, Mid-Atlantic South, Appalachian Energy Belt |
| Mid-Atlantic South | Appalachia, Southeast, Mid-Atlantic North, Pennsylvania |
| Mid-Atlantic North | Mid-Atlantic South, Pennsylvania, New York City |
| Pennsylvania | Midwest Industrial, Mid-Atlantic South, Mid-Atlantic North, New York City |
| New York City | Mid-Atlantic North, New York State, New England South |
| New York State | Great Lakes, New York City, New England North, New England South |
| New England North | New York State, New England South, Canada East |
| New England South | New York City, New York State, New England North |
| Alaska | Canada West, Siberia & Far East *(naval)* |
| Hawaii | *(Island — requires Naval Base for access)* |
| Puerto Rico & Territories | Central America & Caribbean *(naval)* |
| Appalachian Energy Belt | Appalachia, Mid-Atlantic South |

### European Union
| Region | Adjacent To |
|---|---|
| Germany West & Ruhr | Germany North, Germany East & South, France North, Netherlands & Belgium |
| Germany East & South | Germany West & Ruhr, Germany North, Austria & Czech Rep., Poland, France North |
| Germany North | Germany West & Ruhr, Germany East & South, Netherlands & Belgium, Denmark & Finland, Sweden & Norway |
| France North | Germany West & Ruhr, Germany East & South, France South, Netherlands & Belgium, England South *(naval)*, Iberian North |
| France South | France North, Italy North, Iberian North |
| Italy North | France South, Austria & Czech Rep., Italy South |
| Italy South | Italy North, Portugal & Greece, North Africa *(naval)* |
| Iberian North | France North, France South, Iberian South |
| Iberian South | Iberian North, Portugal & Greece, North Africa *(naval)* |
| Netherlands & Belgium | Germany West & Ruhr, Germany North, France North, England South *(naval)* |
| Poland | Germany East & South, Austria & Czech Rep., Romania & Hungary, Baltic States, Western Russia |
| Sweden & Norway | Germany North, Denmark & Finland, Baltic States |
| Austria & Czech Rep. | Germany East & South, Italy North, Poland, Romania & Hungary |
| Denmark & Finland | Germany North, Sweden & Norway, Baltic States |
| Portugal & Greece | Iberian South, Italy South, Romania & Hungary, Turkey, Israel & Levant *(naval)* |
| Romania & Hungary | Austria & Czech Rep., Poland, Portugal & Greece, Baltic States, Western Russia |
| Baltic States | Poland, Sweden & Norway, Denmark & Finland, Romania & Hungary, Western Russia |
| Ireland | Scotland & Wales & NI, England South *(naval)* |

### United Kingdom
| Region | Adjacent To |
|---|---|
| England South (London) | England North & Midlands, France North *(naval)*, Netherlands & Belgium *(naval)*, Ireland *(naval)* |
| England North & Midlands | England South, Scotland & Wales & NI |
| Scotland & Wales & NI | England North & Midlands, Ireland *(naval)* |

### Russia
| Region | Adjacent To |
|---|---|
| Western Russia | Poland, Baltic States, Romania & Hungary, Siberia & Far East, Kazakhstan & Central Asia, Turkey |
| Siberia & Far East | Western Russia, Alaska *(naval)*, Heilongjiang, Inner Mongolia, Kazakhstan & Central Asia |

### China
| Region | Adjacent To |
|---|---|
| Beijing & Hebei | Liaoning & Jilin, Shandong, Inner Mongolia, Shanxi & Shaanxi |
| Shanghai & Jiangsu | Shandong, Zhejiang & Fujian, Henan & Anhui |
| Guangdong (Pearl River) | Zhejiang & Fujian, Guangxi, Hubei & Hunan, Taiwan *(naval)*, Thailand & Vietnam |
| Zhejiang & Fujian | Shanghai & Jiangsu, Guangdong, Taiwan *(naval)* |
| Shandong | Beijing & Hebei, Shanghai & Jiangsu, Henan & Anhui, Liaoning & Jilin |
| Henan & Anhui | Shandong, Shanghai & Jiangsu, Hubei & Hunan, Shanxi & Shaanxi |
| Hubei & Hunan | Henan & Anhui, Sichuan & Chongqing, Guangdong, Guangxi, Yunnan & Guizhou |
| Sichuan & Chongqing | Hubei & Hunan, Yunnan & Guizhou, Gansu & Qinghai, Tibet |
| Liaoning & Jilin | Beijing & Hebei, Shandong, Heilongjiang, Seoul Capital Region |
| Heilongjiang | Liaoning & Jilin, Inner Mongolia, Siberia & Far East |
| Shanxi & Shaanxi | Beijing & Hebei, Henan & Anhui, Inner Mongolia, Gansu & Qinghai |
| Yunnan & Guizhou | Hubei & Hunan, Sichuan & Chongqing, Guangxi, Thailand & Vietnam, East India |
| Guangxi | Guangdong, Hubei & Hunan, Yunnan & Guizhou, Thailand & Vietnam |
| Inner Mongolia | Beijing & Hebei, Heilongjiang, Shanxi & Shaanxi, Gansu & Qinghai, Siberia & Far East |
| Xinjiang | Tibet, Gansu & Qinghai, Kazakhstan & Central Asia, Pakistan & Afghanistan |
| Tibet | Xinjiang, Sichuan & Chongqing, Yunnan & Guizhou, Gansu & Qinghai, North India, East India, Pakistan & Afghanistan |
| Gansu & Qinghai | Shanxi & Shaanxi, Sichuan & Chongqing, Tibet, Xinjiang, Inner Mongolia |
| Hainan & South China Sea | Guangdong *(naval)*, Indonesia *(naval)*, Philippines & Malaysia *(naval)* |

### India
| Region | Adjacent To |
|---|---|
| North India | West India, East India, Tibet, Pakistan & Afghanistan |
| West India | North India, South India, Pakistan & Afghanistan |
| South India | West India, East India |
| East India | North India, South India, Tibet, Yunnan & Guizhou |

### Japan
| Region | Adjacent To |
|---|---|
| Kanto (Tokyo Metro) | Kansai, Chubu, Seoul Capital Region *(naval)* |
| Kansai (Osaka/Kyoto) | Kanto, Chubu, Hokkaido & Kyushu |
| Chubu (Nagoya) | Kanto, Kansai |
| Hokkaido & Kyushu | Kansai, Siberia & Far East *(naval)* |

### South Korea
| Region | Adjacent To |
|---|---|
| Seoul Capital Region | Southern Korea, Liaoning & Jilin *(naval)*, Kanto *(naval)* |
| Southern Korea | Seoul Capital Region, Kansai *(naval)* |

### Brazil
| Region | Adjacent To |
|---|---|
| Southeast Brazil | North & Northeast Brazil, Southern Cone, Andean States |
| North & Northeast Brazil | Southeast Brazil, Colombia & Venezuela, Andean States, Central America *(naval)* |

### Neutral Regions
| Region | Adjacent To |
|---|---|
| Canada West | Canada East, Pacific Coast North, Great Plains North, Alaska |
| Canada East | Canada West, Great Plains North, Great Lakes, New England North |
| Mexico North | Southwest, Texas South, Mexico South |
| Mexico South | Mexico North, Central America & Caribbean |
| Central America & Caribbean | Mexico South, Florida *(naval)*, Puerto Rico *(naval)*, Colombia & Venezuela, North & Northeast Brazil *(naval)* |
| Colombia & Venezuela | Central America & Caribbean, Andean States, North & Northeast Brazil |
| Andean States | Colombia & Venezuela, Southeast Brazil, North & Northeast Brazil, Southern Cone |
| Southern Cone | Andean States, Southeast Brazil |
| Australia East | Australia West, Indonesia *(naval)* |
| Australia West | Australia East, Indonesia *(naval)* |
| Saudi Arabia | UAE & Gulf States, Iran, Iraq & Kuwait, Egypt, Israel & Levant |
| UAE & Gulf States | Saudi Arabia, Iran |
| Iran | Turkey, Iraq & Kuwait, Saudi Arabia, UAE & Gulf States, Kazakhstan & Central Asia, Pakistan & Afghanistan |
| Turkey | Portugal & Greece, Romania & Hungary, Western Russia, Iran, Israel & Levant, Egypt |
| Indonesia | Australia East *(naval)*, Australia West *(naval)*, Hainan & South China Sea *(naval)*, Philippines & Malaysia, Thailand & Vietnam |
| Thailand & Vietnam | Yunnan & Guizhou, Guangxi, Guangdong, Indonesia, Philippines & Malaysia, East India |
| Philippines & Malaysia | Hainan & South China Sea, Indonesia, Thailand & Vietnam, Taiwan *(naval)* |
| Pakistan & Afghanistan | North India, West India, Tibet, Xinjiang, Iran, Kazakhstan & Central Asia |
| Nigeria | West Africa, Central Africa, North Africa |
| South Africa | Central Africa, East Africa |
| Egypt | North Africa, Israel & Levant, Saudi Arabia, Turkey |
| East Africa | North Africa, Central Africa, South Africa, Israel & Levant *(naval)* |
| Central Africa | West Africa, Nigeria, North Africa, East Africa, South Africa |
| West Africa (ex-Nigeria) | North Africa, Nigeria, Central Africa |
| North Africa | Iberian South *(naval)*, Italy South *(naval)*, Egypt, West Africa, Nigeria, Central Africa |
| Israel & Levant | Turkey, Iraq & Kuwait, Saudi Arabia, Egypt, Portugal & Greece *(naval)*, East Africa *(naval)* |
| Iraq & Kuwait | Turkey, Iran, Saudi Arabia, Israel & Levant |
| Kazakhstan & Central Asia | Western Russia, Siberia & Far East, Xinjiang, Inner Mongolia, Iran, Pakistan & Afghanistan |
| Taiwan | Zhejiang & Fujian *(naval)*, Guangdong *(naval)*, Kanto *(naval)*, Philippines & Malaysia *(naval)* |

> **Note:** *(naval)* indicates the connection requires a Naval Base or counts as a naval crossing. Without a Naval Base trait in an adjacent owned region, crossing naval routes costs +1 move.

---

## 16. TODOs & Open Questions

The following items are pending design decisions and must be resolved before the game is production-ready.

### High Priority
- [ ] **National Identity Bonuses** — Define bonuses for USA, EU, China, India, Japan, UK, Brazil, South Korea (Section 13)
- [ ] **Turn Yes/No Choices** — Define the full deck of yes/no event cards presented each turn (Section 8.5)
- [ ] **Population Stockpile Debuff Thresholds** — Define penalties at % thresholds of remaining stockpile (Section 7.6)
- [ ] **Tech Hub Trait** — Define mechanical bonus
- [ ] **Industry Trait** — Define mechanical bonus
- [ ] **Trade Hub Trait** — Define mechanical bonus
- [ ] **Agriculture Trait** — Define mechanical bonus

### Medium Priority
- [ ] **Economic Trade Mechanics** — How do Energy Exporter regions actually trade with allies? Define the GDP sharing mechanic
- [ ] **Turn Order Modifiers** — Which bonuses or events can affect turn order probability?
- [ ] **Resistance Event Types** — Define a list of Storyteller-triggered resistance events during occupation (Section 11.3)
- [ ] **Diplomacy Trade Deals** — Define the mechanics for GDP or resource sharing between player factions

### Low Priority / Design Polish
- [ ] **Neutral Faction Personalities** — Give each major neutral region (Canada, Turkey, Saudi Arabia, Taiwan, etc.) a personality brief for the Storyteller
- [ ] **Event Card Deck** — Design the full set of yes/no turn choices as a physical or digital card deck
- [ ] **Elimination Rules** — Clarify what happens to a fully eliminated player's regions (do they revert to neutral? Stay captured?)
- [ ] **Simultaneous Win Tiebreaker** — Flesh out tiebreaker rules beyond "higher GDP wins"
- [ ] **Map Visual** — Commission a proper visual board map based on the region definitions in Section 14 (reference: game-map.html prototype)

---

*End of Document — World Dominion v0.2*
