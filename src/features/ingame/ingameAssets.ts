const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const ingameUiAssets = {
  parchmentBackground: assetUrl('assets/backgrounds/ui_icon_13_parchment_background_full.png'),
  outerVignetteFrame: assetUrl('assets/ui/ui_icon_14_outer_vignette_frame.png'),

  gearIcon: assetUrl('assets/panel_cells/ui_icon_01_gear_like.png'),
  smallToggleHorizontal: assetUrl('assets/panel_cells/ui_icon_02_small_toggle_horizontal.png'),

  topDividerLeftSource: assetUrl('assets/panel_cells/ui_icon_10_divider_tall_left.png'),
  centerDividerLine: assetUrl('assets/ui/ui_icon_11_divider_center_line.png'),

  bottomDividerRightSource: assetUrl('assets/panel_cells/ui_icon_12_divider_tall_right.png'),
};
