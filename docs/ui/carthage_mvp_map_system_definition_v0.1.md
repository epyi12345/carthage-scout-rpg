# Carthage MVP Map System Definition v0.1

## Base map concept

The MVP map is not a square tile-node board in the play-facing UI. It should feel like a parchment terrain map: the current fixed Alpine base map image, `public/assets/maps/map_base_alpine_terrain_v0.png`, sits at the bottom while algorithmically placed points of interest are scattered on top using the run seed.

The current lightweight implementation keeps the older 7x7 movement model available for the prototype engine, but the visible map panel presents a parchment-style terrain map with points, fog of war, and player markers.


## Current base terrain asset

- Asset: `public/assets/maps/map_base_alpine_terrain_v0.png`
- Runtime path: `${import.meta.env.BASE_URL}assets/maps/map_base_alpine_terrain_v0.png`
- Owner layer: `BaseMapLayer`
- Visual test route: `#/map-test` (also supports `?map-test` and `/map-test` where the host rewrites to the Vite app)

System points, fog of war, player markers, route lines, and debug overlays must remain separate layers above this base image. The map test page shows the resolved `mapSrc`, a visible load status (`Map image loaded` / `Map image failed to load`), and a direct `<img>` preview before any optional overlay toggles.

## System map vs player map

### SystemMap

`SystemMap` is hidden from the player and contains:

- `seed`
- `baseMapId`
- hidden `points`
- optional point relations and spacing metadata

The system map knows the true point placement, point type, encounter link, and density/spacing metadata.

### PlayerMap

`PlayerMap` is the player's imperfect map and contains:

- `revealedAreas`
- `discoveredPointIds`
- `visiblePointIds`
- manually `placedMarkers`
- optional `routeNotes`

The player map never receives every system point at once. It only exposes points inside revealed areas.

## Point types

Current point types:

- `major_region`: large named terrain region or route area.
- `fixed_encounter`: seeded fixed event/location that should persist for a run.
- `main_encounter`: important route/map-quality encounter point.
- `optional_resource`: supplies, shelter, traces, or optional information.
- `return_landmark`: return-relevant landmark for future use.

Encounter density is influenced by point spacing. The generator records nearest-neighbor relations and average spacing so later encounter systems can tune sparse/dense areas.

## Fog-of-war behavior

- The base map is covered by a black fog layer.
- Revealed areas punch transparent holes through the fog.
- Points within revealed areas become visible and are added to discovered point ids.
- The current implementation uses SVG masking, not canvas/WebGL.
- Future work may add irregular fog edges or a designer-provided fog texture.

## Player marker behavior

- The player can tap the parchment map and place a manual return marker.
- Markers are stored separately from system points as `PlayerMarker` records.
- Markers are not truth. They are the player's own navigation aids for returning and route planning.
- Marker categories currently include route, danger, resource, return, and question.

## UI component boundaries

Suggested/current components:

- `MapPanel` / `MapView`: overall panel and interaction shell.
- `BaseMapLayer`: fixed terrain image layer using `public/assets/maps/map_base_alpine_terrain_v0.png`.
- `FogOfWarLayer`: black fog overlay with revealed holes.
- `VisiblePointLayer`: discovered/visible seeded points.
- `PlayerMarkerLayer`: manually placed player markers.
- `MapHandle`: parchment scroll handle decoration.
- `MapLegend`: point and marker legend.
- `RecordPanel`: selected point and marker placement actions.

## Uncertain design questions for review

- Confirm whether `map_base_alpine_terrain_v0.png` is the final crop/aspect ratio for the in-game parchment frame.
- Should markers have multiple user-selectable types in MVP, or is a single return marker enough for the first playtest?
- How large should reveal radii be for movement, high-ground observation, and special encounters?
- Should discovered points remain visible after leaving the area, or should only markers and recorded points persist?
- How should point labels be localized and revealed: immediately, after close inspection, or only after recording?

## Explicit exclusions

- No square-grid map UI as the player-facing map.
- No canvas, WebGL, or heavy rendering system.
- No full replacement of the existing movement/encounter engine in this pass.
- No unrelated gameplay, combat, or ending-system changes.
