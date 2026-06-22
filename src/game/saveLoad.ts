import { startNewGame, syncGameStateAliases } from './gameState';
import type { GameState } from './types';

const SAVE_KEY = 'carthage-scout-rpg:mvp-save';

function normalizeLoadedState(rawState: Partial<GameState>): GameState {
  const seed = rawState.seed ?? rawState.mapSeed ?? 'migrated-mvp';
  const base = startNewGame(seed);
  if (!rawState.systemMap || !rawState.playerMap || !rawState.playerState && !rawState.player) {
    return syncGameStateAliases({ ...base, flags: rawState.flags ?? base.flags, inventory: rawState.inventory ?? rawState.items ?? base.inventory });
  }
  return syncGameStateAliases({
    ...base,
    ...rawState,
    seed,
    mapSeed: seed,
    player: rawState.playerState ?? rawState.player ?? base.player,
    playerState: rawState.playerState ?? rawState.player ?? base.playerState,
    inventory: rawState.inventory ?? rawState.items ?? base.inventory,
    items: rawState.inventory ?? rawState.items ?? base.items,
    log: rawState.log ?? rawState.lastLog ?? base.log,
    lastLog: rawState.log ?? rawState.lastLog ?? base.lastLog,
  } as GameState);
}

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(syncGameStateAliases(state)));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return normalizeLoadedState(JSON.parse(raw) as Partial<GameState>);
  } catch {
    clearSave();
    return null;
  }
}

export function hasSave(): boolean {
  return Boolean(localStorage.getItem(SAVE_KEY));
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
