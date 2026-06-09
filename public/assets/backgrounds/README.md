# Background assets

Place the main title background here before release:

`bg_main_alpine_scout_snowstorm.jpg`

The title screen references it with:

`${import.meta.env.BASE_URL}assets/backgrounds/bg_main_alpine_scout_snowstorm.jpg`

If the JPG is missing during development, the CSS fallback gradient still keeps the title screen readable.
