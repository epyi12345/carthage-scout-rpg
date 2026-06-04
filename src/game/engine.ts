import { clamp, createInitialState } from './state';
import type { ChoiceEffects, EncounterChoice, GameState } from './types';

function addUnique(existing: string[], additions: string[] = []): string[] {
  return Array.from(new Set([...existing, ...additions]));
}

export function applyEffects(state: GameState, effects: ChoiceEffects): GameState {
  const next: GameState = {
    ...state,
    feedbackMessage: null,
    hp: clamp(state.hp + (effects.hp ?? 0), 0, state.maxHp),
    sanity: clamp(state.sanity + (effects.sanity ?? 0), 0, state.maxSanity),
    bodyTemp: clamp(state.bodyTemp + (effects.bodyTemp ?? 0), 0, state.maxBodyTemp),
    food: Math.max(0, state.food + (effects.food ?? 0)),
    mapTools: Math.max(0, state.mapTools + (effects.mapTools ?? 0)),
    slot: state.slot + (effects.slot ?? 0),
    flags: addUnique(state.flags, effects.addFlags),
    items: addUnique(state.items, effects.addItems),
  };

  if (effects.location) next.location = effects.location;
  if (effects.isDead !== undefined) next.isDead = effects.isDead;
  if (effects.deathReason !== undefined) next.deathReason = effects.deathReason;
  if (effects.tutorialComplete !== undefined) next.tutorialComplete = effects.tutorialComplete;
  if (effects.mapUnlocked !== undefined) next.mapUnlocked = effects.mapUnlocked;
  if (effects.nextEncounterId) next.currentEncounterId = effects.nextEncounterId;
  if (effects.recordCurrentTile) next.recordedTiles = addUnique(next.recordedTiles, [next.location]);

  return next;
}

export function applyChoice(state: GameState, choice: EncounterChoice): GameState {
  if (choice.disabledMessage) {
    return { ...state, feedbackMessage: choice.disabledMessage };
  }
  return applyEffects(state, choice.effects);
}

export function newGame(): GameState {
  return createInitialState();
}

export function patchState(state: GameState, patch: Partial<GameState>): GameState {
  return { ...state, ...patch };
}
