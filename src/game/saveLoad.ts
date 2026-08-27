import { CURRENT_SCHEMA_VERSION, createGameLog, startNewGame, withDerivedPhase } from './gameState';
import type { GameState, PlayerState } from './types';

export const SAVE_KEY = 'carthage-scout-rpg:mvp-save';

export class UnsupportedSaveVersionError extends Error {}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

type LegacySave = Record<string, unknown>;
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const strings = (value: unknown): string[] | null => Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : null;

function legacyPlayer(raw: LegacySave, base: PlayerState): PlayerState {
  // Historical load code preferred playerState over player; keep that conflict priority in migration only.
  const source = isRecord(raw.playerState) ? raw.playerState : isRecord(raw.player) ? raw.player : {};
  const number = (key: string, fallback: number) => typeof source[key] === 'number' ? source[key] as number : fallback;
  const rootNumber = (key: string, fallback: number) => typeof raw[key] === 'number' ? raw[key] as number : fallback;
  const position = typeof source.position === 'string' ? source.position : typeof raw.playerPosition === 'string' ? raw.playerPosition : typeof raw.location === 'string' ? raw.location : base.position;
  const health = number('health', rootNumber('hp', base.health));
  return {
    ...base,
    health,
    maxHealth: number('maxHealth', rootNumber('maxHp', base.maxHealth)),
    food: number('food', rootNumber('food', base.food)),
    warmth: number('warmth', rootNumber('bodyTemp', base.warmth)),
    maxWarmth: number('maxWarmth', rootNumber('maxBodyTemp', base.maxWarmth)),
    fatigue: number('fatigue', base.fatigue),
    maxFatigue: number('maxFatigue', base.maxFatigue),
    morale: number('morale', base.morale),
    maxMorale: number('maxMorale', base.maxMorale),
    sanity: number('sanity', rootNumber('sanity', base.sanity)),
    maxSanity: number('maxSanity', rootNumber('maxSanity', base.maxSanity)),
    isAlive: typeof source.isAlive === 'boolean' ? source.isAlive : raw.isDead !== true && health > 0,
    hasReturned: typeof source.hasReturned === 'boolean' ? source.hasReturned : Boolean(raw.ending),
    day: number('day', rootNumber('currentDay', rootNumber('day', base.day))),
    position,
    campPosition: typeof source.campPosition === 'string' ? source.campPosition : typeof raw.startLocation === 'string' ? raw.startLocation : base.campPosition,
    traits: strings(raw.traits) as PlayerState['traits'] ?? base.traits,
    statusEffects: strings(raw.statusEffects) ?? base.statusEffects,
  };
}

function migrateLegacySave(raw: LegacySave): GameState {
  const seed = typeof raw.seed === 'string' ? raw.seed : typeof raw.mapSeed === 'string' ? raw.mapSeed : 'migrated-mvp';
  const base = startNewGame(seed);
  const player = legacyPlayer(raw, base.player);
  // Historical save loading made inventory authoritative over items, and log authoritative over lastLog.
  const itemIds = strings(raw.inventory) ?? strings(raw.items) ?? base.inventory.itemIds;
  const messages = strings(raw.log) ?? strings(raw.lastLog) ?? base.logs.map((entry) => entry.message);
  const systemTiles = Array.isArray(raw.systemMap) ? raw.systemMap as GameState['map']['systemTiles'] : base.map.systemTiles;
  const playerTiles = Array.isArray(raw.playerMap) ? raw.playerMap as GameState['map']['playerTiles'] : base.map.playerTiles;
  const parchmentSystem = isRecord(raw.parchmentSystemMap) ? raw.parchmentSystemMap as unknown as GameState['map']['parchmentSystem'] : base.map.parchmentSystem;
  const parchmentPlayer = isRecord(raw.parchmentPlayerMap) ? raw.parchmentPlayerMap as unknown as GameState['map']['parchmentPlayer'] : base.map.parchmentPlayer;
  const ending = isRecord(raw.ending) ? raw.ending as unknown as GameState['run']['ending'] : null;
  const currentId = typeof raw.currentEncounterId === 'string' || raw.currentEncounterId === null ? raw.currentEncounterId as string | null : base.encounter.currentId;

  return withDerivedPhase({
    ...base,
    player,
    inventory: { itemIds },
    logs: messages.map((message, index) => createGameLog(message, `legacy-log-${index}`)),
    flags: strings(raw.flags) ?? base.flags,
    deathReason: typeof raw.deathReason === 'string' ? raw.deathReason : null,
    feedbackMessage: typeof raw.feedbackMessage === 'string' ? raw.feedbackMessage : null,
    run: {
      ...base.run,
      id: typeof raw.runId === 'string' ? raw.runId : base.run.id,
      seed,
      maxDays: typeof raw.maxDays === 'number' ? raw.maxDays : base.run.maxDays,
      actionCount: typeof raw.actionCount === 'number' ? raw.actionCount : base.run.actionCount,
      slot: typeof raw.slot === 'number' ? raw.slot : base.run.slot,
      ending,
    },
    map: {
      ...base.map,
      size: typeof raw.mapSize === 'number' ? raw.mapSize : base.map.size,
      systemTiles,
      playerTiles,
      parchmentSystem,
      parchmentPlayer,
      mapTools: typeof raw.mapTools === 'number' ? raw.mapTools : base.map.mapTools,
      tutorialComplete: typeof raw.tutorialComplete === 'boolean' ? raw.tutorialComplete : base.map.tutorialComplete,
      unlocked: typeof raw.mapUnlocked === 'boolean' ? raw.mapUnlocked : base.map.unlocked,
      markedTileTags: Array.isArray(raw.markedTileTags) ? raw.markedTileTags as GameState['map']['markedTileTags'] : base.map.markedTileTags,
    },
    encounter: {
      ...base.encounter,
      currentId,
      resolvedIds: strings(raw.resolvedEncounterIds) ?? base.encounter.resolvedIds,
      hasConsumedPendant: raw.hasConsumedPendant === true,
      pendantTransformedInto: typeof raw.pendantTransformedInto === 'string' ? raw.pendantTransformedInto : null,
      chainStates: Array.isArray(raw.chainStates) ? raw.chainStates as GameState['encounter']['chainStates'] : [],
      relationships: Array.isArray(raw.relationships) ? raw.relationships as GameState['encounter']['relationships'] : [],
    },
  });
}

export function isGameState(value: unknown): value is GameState {
  if (!isRecord(value) || value.schemaVersion !== CURRENT_SCHEMA_VERSION) return false;
  return typeof value.phase === 'string'
    && isRecord(value.run)
    && isRecord(value.player)
    && isRecord(value.inventory)
    && Array.isArray(value.inventory.itemIds)
    && isRecord(value.map)
    && isRecord(value.encounter)
    && Array.isArray(value.logs)
    && Array.isArray(value.flags);
}

export function deserializeGameState(rawText: string): GameState {
  const parsed: unknown = JSON.parse(rawText);
  if (!isRecord(parsed)) throw new Error('저장 데이터가 객체가 아니다.');
  const version = parsed.schemaVersion;
  if (typeof version === 'number' && version > CURRENT_SCHEMA_VERSION) throw new UnsupportedSaveVersionError(`지원하지 않는 저장 버전: ${version}`);
  const migrated = version === CURRENT_SCHEMA_VERSION ? parsed : migrateLegacySave(parsed);
  if (!isGameState(migrated)) throw new Error('저장 데이터 검증에 실패했다.');
  return withDerivedPhase(migrated);
}

export function serializeGameState(state: GameState): string {
  if (!isGameState(state)) throw new Error('현재 게임 상태가 유효하지 않다.');
  return JSON.stringify(state);
}

export function saveGameToStorage(state: GameState, storage: StorageLike): void {
  storage.setItem(SAVE_KEY, serializeGameState(state));
}

export function loadGameFromStorage(storage: StorageLike): GameState | null {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return null;
  return deserializeGameState(raw);
}

export function saveGame(state: GameState): void { saveGameToStorage(state, localStorage); }
export function loadGame(): GameState | null {
  try { return loadGameFromStorage(localStorage); }
  catch (error) { console.error('저장 데이터를 불러오지 못했습니다.', error); return null; }
}
export function hasSave(): boolean { return Boolean(localStorage.getItem(SAVE_KEY)); }
export function clearSave(): void { localStorage.removeItem(SAVE_KEY); }
