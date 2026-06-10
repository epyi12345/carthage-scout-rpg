const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const ingameUiAssets = {
  parchmentBackground: assetUrl('assets/ui/ui_icon_09_scroll_blank.png'),
  topOrnament: assetUrl('assets/ui/panel_cells/ui_icon_panel_r01_c02.png'),
  topDivider: assetUrl('assets/ui/ui_icon_11_divider_center_line.png'),
  mapPullHandle: assetUrl('assets/ui/ui_icon_02_small_toggle_horizontal.png'),
  bottomOrnament: assetUrl('assets/ui/panel_cells/ui_icon_panel_r08_c02.png'),
};
