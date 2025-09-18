# Attacking Orders Script

## Examining `game.get_all_possible_orders()`

The `game.get_all_possible_orders()` method returns a dictionary of the format:
`{location: [order1, order2, ...]}`
Where `location` is a string representing a province, and `order1, order2, ...` are strings representing possible orders for a unit in that location.

### Order Types and Formats (Movement Phase):

- **Hold (H)**: `UNIT H` (e.g., `A PAR H`)
- **Move (-)**: `UNIT - DESTINATION` (e.g., `A PAR - MAR`)
- **Move Via Convoy**: `UNIT - DESTINATION VIA` (e.g., `A TUN - NAP VIA`)

### Order Types and Formats (Retreat Phase):
- **Disband (D)**: `UNIT D` (e.g., `A PAR D`)
- **Retreat (R)**: `UNIT R DESTINATION` (e.g., `A PAR R MAR`)

### Order Types and Formats (Adjustment Phase):
- **Disband (D)**: `UNIT D` (e.g., `A PAR D`)
- **Build (B)**: `UNIT_TYPE LOCATION B` (e.g., `A MAR B` or `F BRE B`)
- **Waive**: `WAIVE`

An "attacking order" is identified as a **Move** order (`UNIT - DESTINATION`), a **Move Via Convoy** order (`UNIT - DESTINATION VIA`), or a **Build** order (`UNIT_TYPE LOCATION B`).

### Order Selection Logic in `diplomacy/local_random_attack_game.py`:

For each unit:
1. Prioritize **Move**, **Move Via Convoy**, or **Build** orders. One is randomly chosen if available.
2. If no such orders are available, fall back to a **Hold** order (`UNIT H`).
3. If neither of the above is available, a **Waive** order (`WAIVE`) is issued.


