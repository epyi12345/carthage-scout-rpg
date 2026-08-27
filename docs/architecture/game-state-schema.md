# GameState schema v2

`GameState` schema version 2 removes runtime aliases and gives each mutable concept one owner.

| Concept | Owner |
| --- | --- |
| Phase | `phase` |
| Run identity, seed, time budget, action count, ending | `run` |
| Survival values, day, current/camp position, traits, statuses | `player` |
| Item IDs | `inventory.itemIds` |
| 7×7 and parchment map state, tools, tutorial/map status | `map` |
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

Aliases are accepted only from unversioned legacy input and are never emitted. Current saves must have `schemaVersion: 2`. Future versions raise `UnsupportedSaveVersionError`; loading failure does not delete or overwrite the localStorage entry.

## Choice application

`applyChoice` returns `ChoiceApplyResult`. Rejected choices return the original state and a reason without a success result. Successful choices apply effects once, append at most one choice log, record the choice ID, and reject subsequent application of that ID.
