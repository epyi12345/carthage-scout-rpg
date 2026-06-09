# Carthage MVP In-Game UI Screen Definition v0.1

This document defines the near-term play-facing screen structure for the mobile-first Carthage Scout RPG MVP. It is a design handoff scaffold, not a full implementation spec.

## 1. Main title screen

**Purpose**
- Introduce the dark Alpine survival tone after the Heick Games splash.
- Let the player start a new seeded reconnaissance run or continue an existing local save.

**Current implementation notes**
- Uses `public/assets/backgrounds/bg_main_alpine_scout_snowstorm.jpg`.
- The image must cover the viewport with `background-size: cover`.
- Mobile portrait positioning uses `background-position: 70% center` to keep the scout silhouette near the lower-right composition area.
- A dark overlay keeps the title, seed input, and buttons readable.

**Required UI**
- Game title.
- Short core fantasy tagline.
- New Game button.
- Continue button when local save exists.
- MVP/version label.

**TODO for designer**
- Confirm final Korean/English title lockup.
- Confirm whether the seed field stays visible on public MVP builds or moves behind developer/settings affordance.
- Confirm final button labels and hierarchy.

## 2. In-game text progress screen

**Purpose**
- Present the core loop: explore → observe → record → survive → decide whether to continue or return.

**Current implementation notes**
- Existing MVP gameplay remains in `GameScreen`.
- `InGameFrame` now provides a boundary for future HUD/content/navigation composition.

**Expected regions**
- Top status bar.
- Main text/event log panel.
- Action choices.
- Quick map/recording affordance.
- Return-to-camp button or confirmation state.

**TODO for designer**
- Decide if event text should be a card stack, terminal log, or parchment-like military report.
- Define danger color language for warmth, fatigue, hunger, and route risk.

## 3. Character portrait status popup

**Purpose**
- Show player condition without leaving the current exploration screen.

**Prepared component**
- `CharacterStatusPopup`

**Expected content**
- Character portrait area.
- Health, warmth, fatigue, food, morale/sanity.
- Injury/status effect list.
- Short survival warning copy.

**TODO for designer**
- Provide portrait direction or placeholder silhouette.
- Define how severe conditions are visually ranked.

## 4. Inventory popup

**Purpose**
- Inspect items while preserving the sense of being in the field.

**Prepared component**
- `InventoryPopup`

**Expected content**
- Item list.
- Keepsake/preserved item warnings.
- Future item use/consume actions.

**TODO for designer**
- Define item grouping: supplies, tools, keepsakes, mystic/unknown.
- Define warnings for consuming the pendant or other achievement-relevant items.

## 5. Map scroll-up popup

**Purpose**
- Let the player pull up the route map as a field tool rather than switch to a completely separate app-like screen.

**Prepared component**
- `MapDrawer`

**Expected behavior**
- Opens from the bottom as a scroll/drawer.
- Shows map grid, selected tile details, and recording tools.
- Can be dismissed back to text progress.

**TODO for designer**
- Decide if the map should feel like leather/parchment, charcoal marks, or military slate.
- Define open/close motion limits; keep reduced-motion support.

## 6. Map UI with fog

**Purpose**
- Communicate the player map rule: observation is not recording.

**Expected states**
- Unknown: no terrain/risk details.
- Observed: partial hints, unreliable if cold/tired/rushed.
- Scouted: visited or closely inspected.
- Recorded: manually written and trusted for scoring.
- Route connected: marked as possible Hannibal route.

**TODO for designer**
- Define fog visuals that do not rely on heavy canvas rendering.
- Define icons or glyphs for partial terrain hints and risk uncertainty.

## 7. Map UI clear/no-fog version

**Purpose**
- Support developer/debug views and possible end-of-run reveal screens.

**Expected content**
- True terrain.
- True risk.
- Passability.
- Critical information tiles.
- Encounter markers if debug mode is enabled.

**TODO for designer**
- Decide whether the player ever sees a fully clear map in normal play.
- Define end-of-run comparison view: player recording vs. system truth.

## Explicit exclusions for this pass

- No full gameplay UI replacement.
- No map generation changes.
- No encounter engine changes.
- No ending evaluator changes.
- No religious, sacred, cross, angel, or scripture-like visual language.
