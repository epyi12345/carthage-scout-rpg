# Map assets

The current in-game base terrain map asset is:

`public/assets/maps/map_base_alpine_terrain_v0.png`

Runtime path used by Vite/GitHub Pages:

`${import.meta.env.BASE_URL}assets/maps/map_base_alpine_terrain_v0.png`

This image belongs to `BaseMapLayer`. System points, fog of war, player markers, route lines, and other gameplay overlays should remain separate layers above this base image.

Open the visual test page at `#/map-test` to confirm the image alignment inside the mobile parchment frame.
