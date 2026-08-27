import { evaluateEnding } from './endingEvaluator';
import { arriveAtTarget, getDirectionCandidates } from '../features/map/mapLogic';
import { clamp, createGameLog, startNewGame as createGameState, withDerivedPhase } from './gameState';
import type { ChoiceApplyResult, Direction, DirectionCandidate, EncounterChoice, EncounterConditions, EncounterEffects, GameState, RecordTileData, RelationshipScore, TileMarkState } from './types';

const addUnique = <T,>(existing: T[], additions: T[] = []): T[] => Array.from(new Set([...existing, ...additions]));
const removeValues = (existing: string[], removals: string[] = []): string[] => existing.filter((value) => !removals.includes(value));
const hasAll = (existing: string[], required: string[] = []): boolean => required.every((value) => existing.includes(value));
const hasAny = (existing: string[], forbidden: string[] = []): boolean => forbidden.some((value) => existing.includes(value));

function appendLog(state: GameState, message: string) {
  return [createGameLog(message, `log-${state.run.actionCount}-${state.logs.length}`), ...state.logs].slice(0, 6);
}

function upsertRelationship(existing: RelationshipScore[], target: string, delta: number): RelationshipScore[] {
  return existing.some((entry) => entry.target === target)
    ? existing.map((entry) => entry.target === target ? { ...entry, value: entry.value + delta } : entry)
    : [...existing, { target, value: delta }];
}

function finish(state: GameState): GameState {
  return withDerivedPhase(state);
}

export function calculateObservationReliability(state: GameState): number {
  const warmthPenalty = state.player.warmth < 35 ? 0.25 : state.player.warmth < 55 ? 0.12 : 0;
  const fatiguePenalty = state.player.fatigue > 75 ? 0.3 : state.player.fatigue > 55 ? 0.15 : 0;
  const moralePenalty = state.player.morale < 35 ? 0.12 : 0;
  return clamp(1 - warmthPenalty - fatiguePenalty - moralePenalty, 0.35, 1);
}

function checkSurvival(state: GameState): GameState {
  let health = state.player.health;
  const reasons: string[] = [];
  if (state.player.warmth <= 0) { health -= 12; reasons.push('체온이 바닥나 몸이 굳어 간다.'); }
  if (state.player.food <= 0) { health -= 6; reasons.push('식량이 떨어져 힘이 빠진다.'); }
  if (state.player.fatigue >= state.player.maxFatigue) { health -= 8; reasons.push('피로가 한계에 닿았다.'); }
  health = clamp(health, 0, state.player.maxHealth);
  const player = { ...state.player, health, isAlive: health > 0 };
  const logs = reasons.length
    ? [...reasons.map((message, index) => createGameLog(message, `log-survival-${state.run.actionCount}-${index}`)), ...state.logs].slice(0, 6)
    : state.logs;
  return finish({ ...state, player, logs, deathReason: health > 0 ? state.deathReason : '알프스는 지도보다 먼저 당신의 몸을 무너뜨렸다.' });
}

function advanceAction(state: GameState, message: string): GameState {
  const actionCount = state.run.actionCount + 1;
  const dayIncrease = actionCount % 5 === 0 ? 1 : 0;
  return checkSurvival({
    ...state,
    run: { ...state.run, actionCount },
    logs: appendLog(state, message),
    feedbackMessage: null,
    player: {
      ...state.player,
      day: state.player.day + dayIncrease,
      warmth: clamp(state.player.warmth - 2, 0, state.player.maxWarmth),
      fatigue: clamp(state.player.fatigue + 2, 0, state.player.maxFatigue),
      food: dayIncrease ? Math.max(0, state.player.food - 1) : state.player.food,
    },
  });
}

function normalizeEffects(effects: EncounterEffects = {}): EncounterEffects {
  return {
    ...effects,
    health: (effects.health ?? 0) + (effects.healthDelta ?? 0),
    warmth: (effects.warmth ?? 0) + (effects.warmthDelta ?? 0),
    fatigue: (effects.fatigue ?? 0) + (effects.fatigueDelta ?? 0),
    food: (effects.food ?? 0) + (effects.foodDelta ?? 0),
    day: (effects.day ?? 0) + (effects.dayDelta ?? 0),
    sanity: (effects.sanity ?? 0) + (effects.sanityDelta ?? effects.moraleDelta ?? 0),
    addItems: [...(effects.addItems ?? []), ...(effects.addItem ? [effects.addItem] : [])],
    removeItems: [...(effects.removeItems ?? []), ...(effects.removeItem ? [effects.removeItem] : [])],
    addFlags: [...(effects.addFlags ?? []), ...(effects.addFlag ? [effects.addFlag] : [])],
    removeFlags: [...(effects.removeFlags ?? []), ...(effects.removeFlag ? [effects.removeFlag] : [])],
  };
}

function markTile(state: GameState, tileId: string, tileState: TileMarkState): GameState {
  const resolvedId = tileId === 'current' ? `${state.map.currentPosition.x},${state.map.currentPosition.y}` : tileId;
  return finish({
    ...state,
    map: {
      ...state.map,
      tiles: state.map.tiles.map((tile) => tile.id === resolvedId ? {
        ...tile,
        observed: true,
        scouted: tile.scouted || tileState === 'scouted' || tileState === 'recorded' || tileState === 'connected' || tileState === 'route_connected',
        recorded: tile.recorded || tileState === 'recorded' || tileState === 'connected' || tileState === 'route_connected',
        routeMarked: tile.routeMarked || tileState === 'connected' || tileState === 'route_connected',
      } : tile),
    },
  });
}

export function areConditionsMet(state: GameState, conditions?: EncounterConditions): boolean {
  if (!conditions) return true;
  return hasAll(state.inventory.itemIds, conditions.requiredItems)
    && !hasAny(state.inventory.itemIds, conditions.forbiddenItems)
    && hasAll(state.flags, conditions.requiredFlags)
    && !hasAny(state.flags, conditions.forbiddenFlags)
    && hasAll(state.player.traits, conditions.requiredTraits)
    && (!conditions.location || conditions.location === `${state.map.currentPosition.x},${state.map.currentPosition.y}`);
}

export function getConditionFailureMessage(conditions?: EncounterConditions): string {
  if (conditions?.requiredItems?.includes('pendant')) return '피 묻은 펜던트가 필요하다.';
  if (conditions?.requiredItems?.length) return `필요 아이템: ${conditions.requiredItems.join(', ')}`;
  if (conditions?.requiredFlags?.length) return `필요 플래그: ${conditions.requiredFlags.join(', ')}`;
  if (conditions?.requiredTraits?.length) return `필요 특성: ${conditions.requiredTraits.join(', ')}`;
  return '아직 이 선택을 할 조건이 부족하다.';
}

export function applyEffects(state: GameState, rawEffects: EncounterEffects = {}): GameState {
  const effects = normalizeEffects(rawEffects);
  const sanityDelta = effects.sanity ?? 0;
  let next: GameState = {
    ...state,
    flags: removeValues(addUnique(state.flags, effects.addFlags), effects.removeFlags),
    inventory: { itemIds: removeValues(addUnique(state.inventory.itemIds, effects.addItems), effects.removeItems) },
    run: { ...state.run, slot: Math.max(1, state.run.slot + (effects.slot ?? 0)) },
    map: { ...state.map, mapTools: Math.max(0, state.map.mapTools + (effects.mapTools ?? 0)) },
    player: {
      ...state.player,
      health: clamp(state.player.health + (effects.health ?? effects.hp ?? 0), 0, state.player.maxHealth),
      warmth: clamp(state.player.warmth + (effects.warmth ?? effects.bodyTemp ?? 0), 0, state.player.maxWarmth),
      fatigue: clamp(state.player.fatigue + (effects.fatigue ?? 0), 0, state.player.maxFatigue),
      food: Math.max(0, state.player.food + (effects.food ?? 0)),
      morale: clamp(state.player.morale + sanityDelta, 0, state.player.maxMorale),
      sanity: clamp(state.player.sanity + sanityDelta, 0, state.player.maxSanity),
      day: Math.max(1, state.player.day + (effects.day ?? 0)),
      traits: effects.addTrait ? addUnique(state.player.traits, [effects.addTrait]) : state.player.traits,
      statusEffects: (effects.removeStatus ?? []).includes('all') ? [] : removeValues(addUnique(state.player.statusEffects, effects.addStatus), effects.removeStatus),
    },
    feedbackMessage: null,
  };

  if (effects.consumePendant || effects.transformPendantInto) {
    next = { ...next, inventory: { itemIds: removeValues(next.inventory.itemIds, ['pendant']) }, encounter: { ...next.encounter, hasConsumedPendant: true } };
  }
  if (effects.transformPendantInto) {
    next = { ...next, inventory: { itemIds: addUnique(next.inventory.itemIds, [effects.transformPendantInto]) }, encounter: { ...next.encounter, pendantTransformedInto: effects.transformPendantInto } };
  }
  if (effects.addRelationship) next = { ...next, encounter: { ...next.encounter, relationships: upsertRelationship(next.encounter.relationships, effects.addRelationship.target, effects.addRelationship.value) } };
  if (effects.addChainState) {
    const found = next.encounter.chainStates.some((entry) => entry.chainId === effects.addChainState?.chainId);
    const chainStates = found
      ? next.encounter.chainStates.map((entry) => entry.chainId === effects.addChainState?.chainId ? { ...entry, step: effects.addChainState!.step } : entry)
      : [...next.encounter.chainStates, effects.addChainState];
    next = { ...next, encounter: { ...next.encounter, chainStates } };
  }
  const location = effects.setLocation ?? effects.location;
  if (location && /^\d+,\d+$/.test(location)) {
    const [x, y] = location.split(',').map(Number);
    next = { ...next, map: { ...next.map, currentPosition: { x, y } } };
  }
  if (effects.isDead !== undefined) next = { ...next, player: { ...next.player, isAlive: !effects.isDead } };
  if (effects.deathReason !== undefined) next = { ...next, deathReason: effects.deathReason };
  if (effects.setTutorialComplete ?? effects.tutorialComplete) next = { ...next, map: { ...next.map, tutorialComplete: true, unlocked: true } };
  if ((effects.setMapUnlocked ?? effects.mapUnlocked) !== undefined) next = { ...next, map: { ...next.map, unlocked: Boolean(effects.setMapUnlocked ?? effects.mapUnlocked) } };
  if (effects.nextEncounterId !== undefined) next = { ...next, encounter: { ...next.encounter, currentId: effects.nextEncounterId } };
  if (effects.recordCurrentTile) next = markTile(next, 'current', 'recorded');
  if (effects.markTile) next = markTile(next, effects.markTile.tileId, effects.markTile.state);
  if (effects.revealTile) next = markTile(next, effects.revealTile.tileId, effects.revealTile.state === 'unknown' ? 'observed' : effects.revealTile.state);
  for (const mutation of [effects.markRisk, effects.corruptMapInfo]) {
    if (!mutation) continue;
    const marked = markTile(next, mutation.tileId, 'recorded');
    const tileId = mutation.tileId === 'current' ? `${marked.map.currentPosition.x},${marked.map.currentPosition.y}` : mutation.tileId;
    const note = mutation.note;
    const recordedRisk = 'risk' in mutation ? mutation.risk : mutation.recordedRisk;
    next = { ...marked, map: { ...marked.map, tiles: marked.map.tiles.map((tile) => tile.id === tileId ? { ...tile, recordedRisk, notes: note ? Array.from(new Set([...tile.notes, note])) : tile.notes } : tile) } };
  }
  return checkSurvival(finish(next));
}

export function applyChoice(state: GameState, choice: EncounterChoice, sourceEncounterId = state.encounter.currentId): ChoiceApplyResult {
  const encounterId = sourceEncounterId;
  const applicationId = `${encounterId ?? "none"}:${choice.id}`;
  if (state.encounter.appliedChoiceIds.includes(applicationId)) return { applied: false, state, reason: '이미 처리한 선택이다.' };
  const disabledReason = choice.disabledReason ?? choice.disabledMessage;
  if (choice.disabled || disabledReason) return { applied: false, state, reason: disabledReason ?? '아직 선택할 수 없다.' };
  if (!areConditionsMet(state, choice.conditions)) return { applied: false, state, reason: getConditionFailureMessage(choice.conditions) };

  let next = applyEffects(state, {
    ...(choice.effects ?? {}),
    ...(choice.consequences ?? {}),
    nextEncounterId: choice.nextEncounterId ?? choice.effects?.nextEncounterId ?? choice.consequences?.nextEncounterId ?? null,
  });
  const logs = choice.logMessage ? appendLog(next, choice.logMessage) : next.logs;
  next = finish({
    ...next,
    logs,
    encounter: {
      ...next.encounter,
      resolvedIds: encounterId ? addUnique(next.encounter.resolvedIds, [encounterId]) : next.encounter.resolvedIds,
      appliedChoiceIds: [...next.encounter.appliedChoiceIds, applicationId],
    },
  });
  return { applied: true, state: next, resultText: choice.resultText ?? '' };
}

export type MapMoveResult = { moved: true; state: GameState } | { moved: false; state: GameState; reason: string };

export function selectMapDirection(state: GameState, candidate: DirectionCandidate): MapMoveResult {
  if (state.phase !== 'direction' || !state.map.tutorialComplete) return { moved: false, state, reason: '아직 실제 지도로 이동할 단계가 아니다.' };
  if (state.encounter.currentId) return { moved: false, state, reason: '현재 인카운터를 먼저 해결해야 한다.' };
  const valid = getDirectionCandidates(state.map).find((entry) => entry.nodeId === candidate.nodeId && entry.bearing === candidate.bearing);
  if (!valid) return { moved: false, state, reason: '현재 위치에서 선택할 수 없는 방향이다.' };
  const target = state.map.specialNodes.find((node) => node.id === valid.nodeId);
  if (!target) return { moved: false, state, reason: '연결된 목적지를 찾을 수 없다.' };

  const movedMap = arriveAtTarget({ ...state.map, currentTargetId: target.id, currentHeading: valid.bearing });
  let next = advanceAction({ ...state, map: { ...movedMap, moveCount: state.map.moveCount + 1 } }, `${valid.bearing} 방향으로 이동했다.`);
  if (state.map.moveCount === 0 && !state.flags.includes('map_entry_001_completed') && !state.encounter.resolvedIds.includes('MAP_ENTRY_001')) {
    next = finish({ ...next, encounter: { ...next.encounter, currentId: 'MAP_ENTRY_001' } });
  }
  return { moved: true, state: next };
}

/** Legacy cardinal movement API; gameplay now uses selectMapDirection with a validated candidate. */
export function movePlayer(state: GameState, direction: Direction): GameState {
  const bearing = { north: 'N', south: 'S', east: 'E', west: 'W' }[direction];
  const candidate = getDirectionCandidates(state.map).find((entry) => entry.bearing === bearing);
  if (!candidate) return state;
  const result = selectMapDirection(state, candidate);
  return result.moved ? result.state : state;
}

export function observeTile(state: GameState, tileId: string): GameState {
  if (!state.map.tiles.some((tile) => tile.id === tileId)) return state;
  return advanceAction(markTile(state, tileId, 'observed'), `${tileId} 지형을 관측했다.`);
}

export function recordTile(state: GameState, tileId: string, data: RecordTileData = {}): GameState {
  const tile = state.map.tiles.find((entry) => entry.id === tileId);
  if (!tile?.observed) return state;
  const marked = markTile(state, tileId, data.markAsRoute ? 'route_connected' : 'recorded');
  return advanceAction({ ...marked, map: { ...marked.map, mapTools: Math.max(0, marked.map.mapTools - 1) } }, `${tileId} 타일을 군대용 지도에 기록했다.`);
}

export function markRouteTile(state: GameState, tileId: string): GameState {
  const tile = state.map.tiles.find((entry) => entry.id === tileId);
  if (!tile?.recorded) return state;
  return advanceAction(markTile(state, tileId, 'route_connected'), `${tileId} 타일을 한니발군 경로 후보로 연결했다.`);
}

export function rest(state: GameState): GameState {
  return advanceAction({ ...state, player: { ...state.player, health: clamp(state.player.health + 8, 0, state.player.maxHealth), warmth: clamp(state.player.warmth + 16, 0, state.player.maxWarmth), fatigue: clamp(state.player.fatigue - 28, 0, state.player.maxFatigue), food: Math.max(0, state.player.food - 1) } }, '눈을 피해 쉬며 체온과 기력을 추슬렀다.');
}

export function placePlayerMarker(state: GameState, x: number, y: number): GameState {
  return finish({ ...state, logs: appendLog(state, `지도에 귀환 표식을 남겼다. (${Math.round(x)}, ${Math.round(y)})`) });
}

export function returnToCamp(state: GameState): GameState {
  const distance = Math.abs(state.map.currentPosition.x - state.map.startPosition.x) + Math.abs(state.map.currentPosition.y - state.map.startPosition.y);
  let returned = checkSurvival({ ...state, map: { ...state.map, currentPosition: state.map.startPosition }, player: { ...state.player, hasReturned: true, health: clamp(state.player.health - distance * 3, 0, state.player.maxHealth), warmth: clamp(state.player.warmth - distance * 4, 0, state.player.maxWarmth), fatigue: clamp(state.player.fatigue + distance * 5, 0, state.player.maxFatigue) }, encounter: { ...state.encounter, currentId: null }, logs: appendLog(state, '한니발의 야영지로 복귀해 지도를 제출했다.') });
  returned = { ...returned, run: { ...returned.run, ending: evaluateEnding(returned) } };
  return finish(returned);
}

export function startNewGame(seed?: string): GameState { return createGameState(seed?.trim() || undefined); }
export function newGame(seed?: string): GameState { return startNewGame(seed); }
export function patchState(state: GameState, patch: Partial<GameState>): GameState { return finish({ ...state, ...patch }); }
export const move = movePlayer;
export const observe = observeTile;
export const markRoute = markRouteTile;
export const resolveEncounter = applyChoice;
