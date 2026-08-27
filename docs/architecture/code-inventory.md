# MVP code inventory

## Scope and method

This inventory records the first cleanup pass only. It does not change game rules, encounter copy, map generation, or UI layout.

The runtime set was traced from `src/main.tsx` through static TypeScript/TSX imports, including imported CSS and JSON. A file being outside that graph does **not** automatically make it safe to delete: inventory UI and domain helpers are retained where the next state/inventory pass is expected to reuse them.

Categories:

- **active-runtime** — loaded by the normal app or its in-game route.
- **active-but-refactor** — runtime-critical or intentionally retained for the state/inventory consolidation pass.
- **dev-only** — loaded only by an explicit diagnostic route/tool.
- **duplicate** — redundant implementation whose authority lives elsewhere.
- **unused-draft** — prototype/content work not imported by the current application.
- **delete-candidate** — disconnected code or repository bootstrap material; delete only in a focused follow-up.

## Active runtime

| Area | Files | Notes |
| --- | --- | --- |
| Entry and shell | `src/main.tsx`, `src/App.tsx`, `src/styles.css` | Application entry, title/game routing, shared legacy styles. |
| Title and splash | `src/screens/TitleScreen.tsx`, `src/components/MainTitleScreen.tsx`, `src/components/SplashScreen.tsx` | Current launch flow. |
| In-game presentation | `src/features/ingame/InGamePlayScreen.tsx`, `InGamePlayScreen.css`, `ingameAssets.ts` | Current encounter UI and map reveal interaction. |
| Current map UI | `src/features/map/MapPanel.tsx`, `MapPanel.css`, `mapGenerator.ts`, `mapLogic.ts`, `mapTypes.ts`, `mapCopy.ts`, `useMapRun.ts` | Shared by in-game UI and map test. This is the authority for the directional node prototype. |
| Options and typing | `src/features/options/OptionsOverlay.tsx`, `OptionsOverlay.css`, `uiSettings.ts`, `src/features/typing/useTypewriterText.ts` | Current in-game controls. |
| Achievement popup | `src/components/AchievementAlbumPopup.tsx`, `AchievementAlbumPopup.css` | Opened from the current in-game header. |
| Runtime content | `src/content/encounters/mvp.json`, `tutorial.json`, `samples-v0.2.json` | The only encounter JSON imported by the game catalog. |

## Active but refactor

| Files | Reason retained |
| --- | --- |
| `src/screens/GameScreen.tsx` | Owns encounter choice application and result display; must be addressed with authoritative `GameState`. |
| `src/game/gameState.ts`, `src/game/types.ts` | Current state creation and compatibility type exports; schema v2 ownership is documented separately. |
| `src/game/encounterEngine.ts`, `src/game/encounter.ts`, `src/game/endingEvaluator.ts` | Current game commands, catalog, and ending evaluation. |
| `src/game/mapGenerator.ts` | Current 7×7/parchment state generator used by `GameState`; retain until the 30×30 integration is proven. |
| `src/game/saveLoad.ts` | Current localStorage boundary with schema v2 validation and legacy migration. |
| `src/game/inventory.ts`, `src/components/InventoryView.tsx`, `src/components/InventoryPopup.tsx` | Intentionally retained for the encounter-linked inventory rewrite. Do not delete in general cleanup. |
| `src/game/traits.ts`, `src/content/items.json`, `src/content/traits.json` | Retained catalogs/helpers for the state and inventory follow-up even though the current screen does not import them. |

The one-line wrapper modules `game/engine.ts`, `game/map.ts`, `game/save.ts`, `game/state.ts`, and `game/ending.ts` had no external package API. Active imports now target their implementation modules directly, and the wrappers were removed.

## Dev only

| Files | Entry |
| --- | --- |
| `src/features/mapTest/MapTestPage.tsx`, `MapTestPage.css` | Explicit `#/map-test` route. It imports generator, logic, and types from `src/features/map`. |
| `src/components/DevPanel.tsx`, `src/components/MapLayerTest.tsx` | Disconnected developer components. Retained as candidates for a future `src/devtools` move. |

## Duplicate

The requested `src/features/mapTest/mapTestTypes.ts`, `mapTestGenerator.ts`, `mapTestLogic.ts`, and `mapTestCopy.ts` are absent from this checkout. No deletion was necessary. `MapTestPage` already imports exclusively from `src/features/map`, so no duplicate map-test domain implementation remains.

Three map models still coexist and are **not** silently merged in this cleanup:

1. `src/game/mapGenerator.ts` — 7×7 system/player and parchment state used by `GameState`.
2. `src/features/map/*` — directional 30×30-point/node prototype used by the map UI.
3. Legacy visual components (`MapView`, layers, record panel) — disconnected renderers listed below.

Selecting one authoritative map model is a gameplay/state migration and is intentionally deferred.

## Unused drafts

| Files | Disposition |
| --- | --- |
| `docs/drafts/data/encounters/legacy-mvp.json` | Unused root MVP encounter draft; differs from the runtime catalog. |
| `docs/drafts/data/encounters.json`, `perks.json` | Empty placeholders moved out of executable data. |
| `docs/drafts/data/endings.json`, `initialState.json`, `status-effects.json`, `tiles.json` | Data drafts with no static runtime import. |
| `prototype/**` | Earlier standalone JavaScript prototype; not referenced by Vite or `src/main.tsx`. |
| `SETUP_NOTES.md` | Repository bootstrap instructions, not application documentation. |
| `scripts/bootstrap-github.sh`, `scripts/bootstrap-github.ps1`, `scripts/issues/**`, `scripts/issues.tsv` | One-time GitHub issue/milestone bootstrap tooling. |
| `src/screens/DeathScreen.tsx`, `src/screens/TutorialCompleteScreen.tsx` | Screens outside the current import graph. |

Draft JSON is preserved under `docs/drafts/data` so `src/content` remains the single executable content root without deleting design material.

## Delete candidates

These files are outside the `src/main.tsx` import graph. They are documented rather than removed because some contain UI ideas relevant to the map/state rewrite:

- Legacy map UI: `BaseMapLayer.tsx`, `FogOfWarLayer.tsx`, `MapDrawer.tsx`, `MapHandle.tsx`, `MapLegend.tsx`, `MapView.tsx`, `PlayerMarkerLayer.tsx`, `RecordPanel.tsx`, `VisiblePointLayer.tsx`.
- Disconnected gameplay UI: `BottomNav.tsx`, `CharacterStatusPopup.tsx`, `ChoiceButton.tsx`, `ChoicePanel.tsx`, `EncounterView.tsx`, `InGameFrame.tsx`, `LogPanel.tsx`, `StatusBar.tsx`, `StatusPanel.tsx`, `TopStatusBar.tsx`.
- Bootstrap remains: `prototype/`, `SETUP_NOTES.md`, and `scripts/bootstrap-github.*`/`scripts/issues/`. Static-import and repository-reference checks found no connection to the Vite build; removal should be a separate repository-hygiene change.

## Content authority

Executable JSON now lives only under `src/content`:

```text
src/content/
  encounters/
    mvp.json
    samples-v0.2.json
    tutorial.json
  items.json
  traits.json
```

`src/game/encounter.ts`, `inventory.ts`, and `traits.ts` import from this root. Encounter text and balance values were moved byte-for-byte. Unused JSON was moved to `docs/drafts/data` and is not an executable catalog.

## Shared stylesheet classification

`src/styles.css` is active because `src/main.tsx` imports it. It currently combines:

- **Active shared foundation:** root reset/theme, buttons, title/game shell defaults, splash, and generic typography.
- **Active-but-refactor selectors:** generic encounter, map drawer, inventory, status, and dev selectors that overlap component responsibilities.
- **Legacy candidates:** selectors used only by the disconnected components listed above.

No broad CSS deletion or visual relocation is performed in this pass. Follow-up candidates are:

- move inventory/status selectors beside the retained inventory UI during its rewrite;
- move dev selectors into a future `devtools` folder;
- remove legacy map selectors only after the 30×30 map UI replaces the old component family;
- keep truly shared reset/theme/token rules in `src/styles.css`.

## Reproducible toolchain

Runtime and build packages are exact versions in `package.json`; TypeScript is fixed at 5.9.3. React’s official type packages replace the permissive local JSX shim. CI uses `npm ci`, making `package-lock.json` the install authority.

## Follow-up boundaries

This cleanup deliberately does **not**:

- connect the directional 30×30 prototype to authoritative `GameState.map`;
- choose or regenerate a map model;
- change encounter conditions/results;
- implement item quantity, durability, or item-specific actions;
- change the in-game/footer/map-reveal design.
