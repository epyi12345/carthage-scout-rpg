import { createInitialState } from './state';
import type { GameState } from './types';

const SAVE_KEY = 'carthage-scout-rpg:tutorial-save';

function normalizeLoadedState(rawState: Partial<GameState>): GameState {
  return { ...createInitialState(), ...rawState } as GameState;
}

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
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
