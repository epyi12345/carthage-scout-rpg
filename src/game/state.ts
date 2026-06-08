import { createPlayerMap, generateSystemMap, tileId } from './map';
import type { GameState } from './types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function createInitialState(seed = `mvp-${Date.now()}`): GameState {
  const mapSize = 7;
  const systemMap = generateSystemMap(seed, mapSize);
  const campPosition = tileId(Math.floor(mapSize / 2), mapSize - 1);
  const playerMap = createPlayerMap(systemMap, campPosition);

  return {
    mapSeed: seed,
    mapSize,
    systemMap,
    playerMap,
    player: {
      health: 100,
      maxHealth: 100,
      food: 6,
      warmth: 82,
      maxWarmth: 100,
      fatigue: 0,
      maxFatigue: 100,
      day: 1,
      position: campPosition,
      campPosition,
    },
    actionCount: 0,
    currentEncounterId: null,
    resolvedEncounterIds: [],
    lastLog: ['한니발의 야영지에서 정찰을 시작한다. 군대가 살아남을 길을 기록해야 한다.'],
    ending: null,
    isDead: false,
    deathReason: null,
    flags: [],
    items: ['charcoal_stub', 'torn_operation_map'],
    hasConsumedPendant: false,
    pendantTransformedInto: null,
    traits: [],
    statusEffects: [],
    chainStates: [],
    relationships: [],
    markedTileTags: [],
    feedbackMessage: null,

    day: 1,
    slot: 1,
    hp: 100,
    maxHp: 100,
    sanity: 70,
    maxSanity: 100,
    bodyTemp: 82,
    maxBodyTemp: 100,
    food: 6,
    mapTools: 6,
    location: campPosition,
    tutorialComplete: false,
    mapUnlocked: true,
    recordedTiles: [campPosition],
    observedTiles: [],
    scoutedTiles: [],
    connectedTiles: [campPosition],
    startLocation: campPosition,
  };
}
