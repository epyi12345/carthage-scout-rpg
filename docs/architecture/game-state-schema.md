# GameState schema v3

`GameState` schema version 3 keeps the single-owner model and promotes the shared 30×30 exploration map to the authoritative runtime map.

| Concept | Owner |
| --- | --- |
| Phase | `phase` |
| Run identity, seed, time budget, action count, ending | `run` |
| Survival values, day, traits, statuses | `player` |
| Item IDs | `inventory.itemIds` |
| 30×30 seed, tiles, start/goal/current position, discovered path, visits, records, movement count and tutorial/map status | `map` |
| Current/resolved encounters, applied choices, chains, relationships, pendant state | `encounter` |
| Recent messages | `logs` |
| Persistent event flags | `flags` |

The runtime no longer stores `items`, `lastLog`, `log`, `playerState`, `currentDay`, root `day`, `playerPosition`, root `location`, root `hp`, or root `bodyTemp`. `src/game/types.ts` remains only as a compatibility export surface; definitions live in domain `types.ts` files.

## Legacy migration priority

The migration preserves the old loader's conflict behavior:

1. `playerState` wins over `player`; root survival/location aliases are fallback only.
2. `inventory` wins over `items`.
3. `log` wins over `lastLog`.
4. `seed` wins over `mapSeed`.

Aliases are accepted only from legacy input and are never emitted. Schema v2 and unversioned saves are migrated to the deterministic 30×30 map generated from the saved run seed. Current saves must have `schemaVersion: 3`. Future versions raise `UnsupportedSaveVersionError`; loading failure does not delete or overwrite the localStorage entry.

## Tutorial-to-map vertical slice

Resolving `TUT_COMPLETE` clears the encounter and derives the `direction` phase without regenerating the map. `selectMapDirection` validates a candidate derived from `GameState.map`, applies the existing action survival cost, moves to the selected node, marks its tile visited, and increments `moveCount` atomically. The first successful move opens `MAP_ENTRY_001`; resolving either choice records `map_entry_001_completed` and returns to direction selection.

## Choice application

`applyChoice` returns `ChoiceApplyResult`. Rejected choices return the original state and a reason without a success result. Successful choices apply effects once, append at most one choice log, record the choice ID, and reject subsequent application of that ID.
