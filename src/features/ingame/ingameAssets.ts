const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const ingameUiAssets = {
  parchmentBackground: assetUrl('assets/backgrounds/ui_icon_13_parchment_background_full.png'),
  outerVignetteFrame: assetUrl('assets/ui/ui_icon_14_outer_vignette_frame.png'),

  gearIcon: assetUrl('assets/panel_cells/ui_icon_01_gear_like.png'),
  smallToggleHorizontal: assetUrl('assets/panel_cells/ui_icon_02_small_toggle_horizontal.png'),
  heartLike: assetUrl('assets/panel_cells/ui_icon_03_heart_like.png'),
  scrollPortrait: assetUrl('assets/panel_cells/ui_icon_05_scroll_portrait.png'),
  capsuleFrameWide: assetUrl('assets/panel_cells/ui_icon_06_capsule_frame_wide.png'),

  topDividerLeftSource: assetUrl('assets/panel_cells/ui_icon_10_divider_tall_left.png'),
  centerDividerLine: assetUrl('assets/ui/ui_icon_11_divider_center_line.png'),

  mapPullHandleBar: assetUrl('assets/ui/ui_icon_15_map_pull_handle_bar_exact.png'),
  bottomDividerRightSource: assetUrl('assets/panel_cells/ui_icon_12_divider_tall_right.png'),
};
