# Launch splash logo

The splash screen uses this generated runtime asset:

`logo_ref_heick_games_full.png`

The PR system used for this repository can reject binary files, so the PNG is intentionally **not committed directly**. Instead, the provided logo is stored as a text-safe Base64 source file at:

`scripts/assets/logo_ref_heick_games_full.png.base64`

Run this command to regenerate the PNG in this folder:

```sh
npm run prepare-logo
```

The `dev`, `build`, and `preview` scripts run that preparation step automatically before Vite starts. The app references the generated image with Vite's GitHub Pages base path:

`${import.meta.env.BASE_URL}assets/logos/logo_ref_heick_games_full.png`
