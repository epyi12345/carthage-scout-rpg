const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const ingameUiAssets = {
  parchmentBackground: assetUrl('assets/backgrounds/ui_icon_13_parchment_background_full.png'),
  outerVignetteFrame: assetUrl('assets/ui/ui_icon_14_outer_vignette_frame.png'),
  topOrnamentSource: assetUrl('assets/panel_cells/ui_icon_10_divider_tall_left.png'),
};
