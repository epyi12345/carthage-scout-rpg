# Carthage MVP Main Title Intro Screen Definition v0.1

## Screen purpose

After the Heick Games launch splash, the main title intro establishes the cold Alpine reconnaissance mood before the player enters the MVP menu. The scene begins in fog and gradually clears, reinforcing that the scout is trying to reveal a survivable route for Hannibal's army.

## Asset names and paths

Use the actual repository assets exactly as named:

- Splash logo: `public/assets/logos/logo_ref_heick_games_full.png`
- Fog intro background: `public/assets/backgrounds/bg_main_alpine_scout_fog_intro.jpg`
- Clear title background: `public/assets/backgrounds/bg_main_alpine_scout_clear.jpg`

Runtime paths must remain Vite/GitHub Pages compatible:

- `${import.meta.env.BASE_URL}assets/logos/logo_ref_heick_games_full.png`
- `${import.meta.env.BASE_URL}assets/backgrounds/bg_main_alpine_scout_fog_intro.jpg`
- `${import.meta.env.BASE_URL}assets/backgrounds/bg_main_alpine_scout_clear.jpg`

## Launch sequence

1. User opens the GitHub Pages app.
2. Full-viewport dark Heick Games splash appears with `logo_ref_heick_games_full.png` centered.
3. Logo fades in, holds briefly, then the splash fades out.
4. Main title screen mounts.
5. `bg_main_alpine_scout_clear.jpg` is placed as the bottom background layer.
6. `bg_main_alpine_scout_fog_intro.jpg` is placed above the clear background.
7. The fog layer clears away over roughly 3.2 seconds.
8. When the reveal is complete, show `터치하여 시작`, Achievements, and Settings.
9. Achievements and Settings are clickable before the main menu opens.
10. Tapping the main background in the touch-to-start state fades in the main menu.
11. The main menu shows `새 게임` and shows `이어하기` only when save data exists.

## State model

- `introFogReveal`: fog reveal is active; background taps are ignored; utility buttons and touch prompt are hidden.
- `touchToStart`: reveal is complete; `터치하여 시작`, Achievements, and Settings are visible; background tap opens the menu.
- `mainMenuOpen`: main menu buttons are visible; touch prompt is reduced; background tap does nothing.

## Layer structure

From back to front:

1. Clear background layer.
2. Fog intro background layer.
3. Optional soft white fog overlay.
4. Dark lower gradient for readability.
5. Title/game UI layer.
6. Achievements and Settings utility buttons.
7. `터치하여 시작` prompt.
8. Main menu button group.
9. Modal layer for Achievements or Settings placeholders.

## Fog reveal behavior

- Use lightweight CSS only: opacity, transform, clip-path, mask-image, gradients, and transitions are allowed.
- The reveal should feel like white fog clearing away, not a hard cut.
- A separate fog mask image is not required for this MVP pass.
- If CSS mask support is unavailable, use the opacity/clip-path fallback animation.
- No canvas, WebGL, particles, or heavy animation systems.

## Button behavior

### Achievements

- Appears only after the fog reveal completes.
- Clickable in both `touchToStart` and `mainMenuOpen`.
- Opens a placeholder modal until the achievement system exists.
- Click handlers must stop propagation so the menu does not open accidentally.

### Settings

- Appears only after the fog reveal completes.
- Clickable in both `touchToStart` and `mainMenuOpen`.
- Uses the current MVP theme toggle if no full settings screen exists.
- Click handlers must stop propagation so the menu does not open accidentally.

### Main background

- During `introFogReveal`, background taps are ignored.
- During `touchToStart`, background tap opens the main menu.
- During `mainMenuOpen`, background tap does nothing.

## Mobile crop notes

- Full viewport, portrait-first layout.
- Use `background-size: cover`.
- Use background position around `68% center` so the scout silhouette remains near the lower-right or right-center area.
- Keep a dark bottom gradient strong enough for `터치하여 시작` and main menu buttons.
- Buttons must remain large enough for mobile touch.

## Accessibility / reduced motion notes

- Splash logo image must use alt text: `Heick Games logo`.
- Respect `prefers-reduced-motion` by shortening the splash and simplifying the fog reveal.
- Utility buttons and modal controls must be reachable as normal buttons.

## TODO / designer review

- Confirm final placement of the title text relative to the scout silhouette.
- Confirm whether `Achievements` and `Settings` labels should remain English or be localized.
- Confirm final fog reveal timing after visual review on mobile devices.
- Confirm whether the seed field remains on the public main menu or moves to a developer/settings area.
- Provide final modal art direction once achievement/settings systems are designed.

## Explicit exclusions

- No gameplay logic changes.
- No map generation changes.
- No encounter engine changes.
- No ending evaluator changes.
- No save/load structure changes beyond checking if Continue is available.
- No religious, cross, angel, sacred painting, or scripture-like visual elements.
