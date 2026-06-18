import { createParchmentPlayerMap, createPlayerMap, generateParchmentSystemMap, generateSystemMap, syncParchmentVisibilityForPosition, tileId } from './mapGenerator';
import type { GamePhase, GameState, PlayerState } from './types';

export const DEFAULT_MAX_DAYS = 21;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createRunId(seed: string): string {
  return `${seed}-${Date.now().toString(36)}`;
}

export function syncGameStateAliases(state: GameState): GameState {
  const parchmentReadyState = syncParchmentVisibilityForPosition(state);
  state = parchmentReadyState;
  const observedTiles = state.playerMap.filter((tile) => tile.playerKnowledgeState === 'observed').map((tile) => tile.id);
  const scoutedTiles = state.playerMap.filter((tile) => tile.playerKnowledgeState === 'scouted').map((tile) => tile.id);
  const recordedTiles = state.playerMap.filter((tile) => tile.playerKnowledgeState === 'recorded').map((tile) => tile.id);
  const connectedTiles = state.playerMap.filter((tile) => tile.playerKnowledgeState === 'route_connected').map((tile) => tile.id);
  const gamePhase: GamePhase = state.isDead || !state.player.isAlive ? 'dead' : state.ending || state.player.hasReturned ? 'returned' : state.currentEncounterId ? 'encounter' : 'exploring';
  const sourcePlayer = state.player ?? state.playerState;
  const playerState: PlayerState = {
    ...sourcePlayer,
    isAlive: !state.isDead && sourcePlayer.health > 0,
    hasReturned: Boolean(state.ending || sourcePlayer.hasReturned),
    day: sourcePlayer.day ?? state.currentDay,
    position: sourcePlayer.position ?? state.playerPosition,
  };

  return {
    ...state,
    seed: state.seed || state.mapSeed,
    mapSeed: state.seed || state.mapSeed,
    currentDay: playerState.day,
    playerPosition: playerState.position,
    player: playerState,
    playerState,
    inventory: state.inventory ?? state.items,
    items: state.inventory ?? state.items,
    log: state.log ?? state.lastLog,
    lastLog: state.log ?? state.lastLog,
    gamePhase,
    day: playerState.day,
    hp: playerState.health,
    food: playerState.food,
    bodyTemp: playerState.warmth,
    sanity: playerState.sanity,
    location: playerState.position,
    observedTiles,
    scoutedTiles,
    recordedTiles,
    connectedTiles,
  };
}

export function startNewGame(seed = `mvp-${Date.now()}`): GameState {
  const normalizedSeed = seed.trim() || `mvp-${Date.now()}`;
  const mapSize = 7;
  const systemMap = generateSystemMap(normalizedSeed, mapSize);
  const startTile = tileId(Math.floor(mapSize / 2), mapSize - 1);
  const playerMap = createPlayerMap(systemMap, startTile);
  const parchmentSystemMap = generateParchmentSystemMap(normalizedSeed);
  const parchmentPlayerMap = createParchmentPlayerMap(parchmentSystemMap, startTile, mapSize);
  const playerState: PlayerState = {
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
    position: startTile,
    campPosition: startTile,
  };
  const log = ['한니발의 야영지에서 정찰을 시작한다. 군대가 살아남을 길을 기록해야 한다.'];

  return syncGameStateAliases({
    runId: createRunId(normalizedSeed),
    seed: normalizedSeed,
    currentDay: 1,
    maxDays: DEFAULT_MAX_DAYS,
    playerPosition: startTile,
    playerState,
    inventory: ['charcoal_stub', 'torn_operation_map'],
    log,
    gamePhase: 'exploring',
    mapSeed: normalizedSeed,
    mapSize,
    systemMap,
    playerMap,
    parchmentSystemMap,
    parchmentPlayerMap,
    player: playerState,
    actionCount: 0,
    currentEncounterId: 'START_001',
    resolvedEncounterIds: [],
    lastLog: log,
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
    sanity: 72,
    maxSanity: 100,
    bodyTemp: 82,
    maxBodyTemp: 100,
    food: 6,
    mapTools: 6,
    location: startTile,
    tutorialComplete: false,
    mapUnlocked: true,
    recordedTiles: [startTile],
    observedTiles: [],
    scoutedTiles: [],
    connectedTiles: [startTile],
    startLocation: startTile,
  });
}

export function createInitialState(seed?: string): GameState {
  return startNewGame(seed);
}
