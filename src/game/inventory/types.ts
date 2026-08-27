export type ItemType = 'keepsake' | 'material' | 'tool' | 'map' | 'mystic_keepsake';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  isConsumable: boolean;
  isAchievementItem?: boolean;
  isMystic?: boolean;
}

export interface InventoryState {
  itemIds: string[];
}
