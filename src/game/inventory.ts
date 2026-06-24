import items from '../../data/items.json';
import type { GameState, Item } from './types';

export const itemCatalog = items as Item[];

// 펜던트는 추후 미끼, 거래품, 우호 증표, 전용 인카운터 조건, 보존 업적에 사용된다.

export function getItem(itemId: string): Item | undefined {
  return itemCatalog.find((item) => item.id === itemId);
}

export function getInventoryItems(state: GameState): Item[] {
  return state.items.map(getItem).filter((item): item is Item => Boolean(item));
}

export function hasItem(state: GameState, itemId: string): boolean {
  return state.items.includes(itemId);
}
