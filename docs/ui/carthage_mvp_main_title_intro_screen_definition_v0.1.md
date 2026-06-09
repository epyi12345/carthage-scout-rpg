# Carthage MVP Main Title Intro Screen Definition v0.1

## Screen purpose

The main title intro appears after the Heick Games splash. Its job is to establish a cold Alpine survival mood before the player enters the MVP menu. The player should see fog clearing from the scouting scene, then receive a simple invitation to begin.

## Asset names and paths

Required designer-provided images:

- `public/assets/backgrounds/bg_main_alpine_scout_fog_intro.jpg`
- `public/assets/backgrounds/bg_main_alpine_scout_clear.jpg`

Runtime paths must remain Vite/GitHub Pages compatible:

- `${import.meta.env.BASE_URL}assets/backgrounds/bg_main_alpine_scout_fog_intro.jpg`
- `${import.meta.env.BASE_URL}assets/backgrounds/bg_main_alpine_scout_clear.jpg`

If either asset is temporarily missing, the CSS fallback gradients keep the title screen buildable and readable.

## Sequence

1. Existing Heick Games splash screen fades out.
2. Main title screen mounts.
3. Clear background is placed as the bottom visual layer.
4. Fog intro background is placed above the clear background.
5. Fog intro layer animates away over roughly 3.2 seconds.
6. When the reveal is complete, show:
   - `터치하여 시작`
   - Achievements button
   - Settings button
7. Achievements and Settings are clickable before the main menu opens.
8. Tapping the main background while in the touch-to-start state fades in the main menu.
9. Main menu shows New Game and Continue when a save exists.

## State model

The title screen should make these states clear in code:

- `introFogReveal`: fog reveal is still running; utility buttons are hidden.
- `touchToStart`: reveal is complete; utility buttons and `터치하여 시작` are visible.
- `mainMenuOpen`: player tapped the background/prompt; touch prompt is muted and main menu buttons are visible.

## Layer structure

From back to front:

1. Clear background layer.
2. Fog intro background layer.
3. Optional soft white/mist overlay.
4. Dark lower gradient for readability.
5. Title text/game logo layer.
6. Achievements and Settings utility buttons.
7. `터치하여 시작` prompt.
8. Main menu button group.
9. Modal layer for Achievements or Settings placeholders.

## Button behavior

### Achievements

- Visible only after fog reveal completes.
- Clickable in both `touchToStart` and `mainMenuOpen` states.
- Opens a placeholder modal until the achievement system exists.
- Click must stop propagation so it does not open the main menu.

### Settings

- Visible only after fog reveal completes.
- Clickable in both `touchToStart` and `mainMenuOpen` states.
- Uses the existing theme toggle as the only current MVP setting.
- Click must stop propagation so it does not open the main menu.

### Main background

- During `touchToStart`, tapping the main background opens the main menu.
- During `introFogReveal`, tapping does nothing.
- During `mainMenuOpen`, tapping the background does not auto-start a game.

## Mobile crop notes

- Full viewport, portrait-first layout.
- Use `background-size: cover`.
- Use background position around `68% center` so the scout silhouette remains near the lower-right or right-center composition area.
- Keep the bottom gradient strong enough for `터치하여 시작` and menu buttons.
- Buttons must remain large enough for mobile touch.

## Animation notes

- Prefer CSS-only opacity, clip-path, mask-image, transform, and gradient overlays.
- No canvas, WebGL, or particle system.
- Reveal should feel like white fog clearing rather than a hard cut.
- If CSS mask support is unavailable, use the clip-path/opacity fallback.
- Respect `prefers-reduced-motion` by shortening the animation.

## TODO / designer review

- Confirm final placement of the title text relative to the scout silhouette.
- Confirm if button labels should stay English (`Achievements`, `Settings`) or be localized.
- Confirm final fog timing after real assets are added.
- Confirm whether the seed field remains in the public main menu or moves to a developer/settings panel.
- Provide final visual direction for achievement/settings modals.

## Explicit exclusions

- No gameplay logic changes.
- No map generation changes.
- No encounter engine changes.
- No ending evaluator changes.
- No save/load structure changes beyond checking if Continue is available.
- No religious, cross, angel, sacred painting, or scripture-like visual elements.
