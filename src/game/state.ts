import initialState from '../../data/initialState.json';
import type { GameState } from './types';

export function createInitialState(): GameState {
  return structuredClone(initialState) as GameState;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
