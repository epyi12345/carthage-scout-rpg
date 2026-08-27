import { generateMapTestState } from '../features/map/mapGenerator';
import type { GameLog, GamePhase, GameState, PlayerState } from './types';

export const CURRENT_SCHEMA_VERSION = 3;
export const DEFAULT_MAX_DAYS = 21;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createRunId(seed: string): string {
  return `${seed}-${Date.now().toString(36)}`;
}

export function createGameLog(message: string, id = `log-${Date.now().toString(36)}`): GameLog {
  return { id, message };
}

export function deriveGamePhase(state: Pick<GameState, 'player' | 'encounter' | 'run' | 'map'>): GamePhase {
  if (!state.player.isAlive) return 'dead';
  if (state.run.ending || state.player.hasReturned) return 'returned';
  if (state.encounter.currentId) return 'encounter';
  return state.map.tutorialComplete ? 'direction' : 'tutorial';
}

export function withDerivedPhase(state: GameState): GameState {
  const phase = deriveGamePhase(state);
  return phase === state.phase ? state : { ...state, phase };
}

export function startNewGame(seed = `mvp-${Date.now()}`): GameState {
  const normalizedSeed = seed.trim() || `mvp-${Date.now()}`;
  const map = generateMapTestState(normalizedSeed);
  const player: PlayerState = {
    health: 100,
    maxHealth: 100,
    food: 6,
    warmth: 82,
    maxWarmth: 100,
    fatigue: 0,
    maxFatigue: 100,
    morale: 72,
    maxMorale: 100,
    sanity: 72,
    maxSanity: 100,
    isAlive: true,
    hasReturned: false,
    day: 1,
    traits: [],
    statusEffects: [],
  };

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    phase: 'encounter',
    run: {
      id: createRunId(normalizedSeed),
      seed: normalizedSeed,
      maxDays: DEFAULT_MAX_DAYS,
      actionCount: 0,
      slot: 1,
      ending: null,
    },
    player,
    inventory: { itemIds: ['charcoal_stub', 'torn_operation_map'] },
    map,
    encounter: {
      currentId: 'START_001',
      resolvedIds: [],
      appliedChoiceIds: [],
      hasConsumedPendant: false,
      pendantTransformedInto: null,
      chainStates: [],
      relationships: [],
    },
    logs: [createGameLog('한니발의 야영지에서 정찰을 시작한다. 군대가 살아남을 길을 기록해야 한다.', 'log-start')],
    flags: [],
    deathReason: null,
    feedbackMessage: null,
  };
}

export function createInitialState(seed?: string): GameState {
  return startNewGame(seed);
}
