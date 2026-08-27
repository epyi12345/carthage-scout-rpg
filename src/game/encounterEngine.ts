import { evaluateEnding } from './endingEvaluator';
import { getNeighbors, getSystemTile, placePlayerMarkerOnMap, revealTile, syncParchmentVisibilityForPosition, updatePlayerTile } from './mapGenerator';
import { clamp, createGameLog, startNewGame as createGameState, withDerivedPhase } from './gameState';
import type { ChoiceApplyResult, Direction, EncounterChoice, EncounterConditions, EncounterEffects, GameState, RecordTileData, RelationshipScore, TileMarkState } from './types';

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
  return withDerivedPhase(syncParchmentVisibilityForPosition(state));
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
  const resolvedId = tileId === 'current' ? state.player.position : tileId;
  const knowledge = tileState === 'connected' ? 'route_connected' : tileState;
  const playerTiles = revealTile(state, resolvedId, knowledge);
  return finish({
    ...state,
    map: {
      ...state.map,
      playerTiles,
      markedTileTags: [
        ...state.map.markedTileTags.filter((tag) => !(tag.tileId === resolvedId && tag.state === tileState)),
        { tileId: resolvedId, state: tileState },
      ],
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
    && (!conditions.location || conditions.location === state.player.position);
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
  if (location) next = { ...next, player: { ...next.player, position: location } };
  if (effects.isDead !== undefined) next = { ...next, player: { ...next.player, isAlive: !effects.isDead } };
  if (effects.deathReason !== undefined) next = { ...next, deathReason: effects.deathReason };
  if (effects.setTutorialComplete ?? effects.tutorialComplete) next = { ...next, map: { ...next.map, tutorialComplete: true } };
  if ((effects.setMapUnlocked ?? effects.mapUnlocked) !== undefined) next = { ...next, map: { ...next.map, unlocked: Boolean(effects.setMapUnlocked ?? effects.mapUnlocked) } };
  if (effects.nextEncounterId !== undefined) next = { ...next, encounter: { ...next.encounter, currentId: effects.nextEncounterId } };
  if (effects.recordCurrentTile) next = markTile(next, next.player.position, 'recorded');
  if (effects.markTile) next = markTile(next, effects.markTile.tileId, effects.markTile.state);
  if (effects.revealTile) next = { ...next, map: { ...next.map, playerTiles: revealTile(next, effects.revealTile.tileId === 'current' ? next.player.position : effects.revealTile.tileId, effects.revealTile.state) } };
  for (const mutation of [effects.markRisk, effects.corruptMapInfo]) {
    if (!mutation) continue;
    const tileId = mutation.tileId === 'current' ? next.player.position : mutation.tileId;
    const tile = next.map.playerTiles.find((entry) => entry.id === tileId);
    const note = 'note' in mutation ? mutation.note : undefined;
    const risk = 'risk' in mutation ? mutation.risk : mutation.recordedRisk;
    const notes = Array.from(new Set([...(tile?.playerNotes ?? []), ...(note ? [note] : [])]));
    next = { ...next, map: { ...next.map, playerTiles: updatePlayerTile(next, tileId, { playerKnowledgeState: 'recorded', state: 'recorded', playerRecordedRisk: risk, playerNotes: notes, notes }) } };
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

export function movePlayer(state: GameState, direction: Direction): GameState {
  const target = getNeighbors(state.player.position, state.map.size).find((neighbor) => neighbor.direction === direction);
  if (!target) return { ...state, feedbackMessage: '그 방향으로는 이동할 수 없다.' };
  const tile = getSystemTile(state, target.id);
  if (!tile?.passable) return { ...state, feedbackMessage: '정찰병 혼자도 지나가기 어려운 지형이다.' };
  let next = advanceAction({ ...state, player: { ...state.player, position: target.id } }, `${direction} 방향으로 이동했다.`);
  next = finish({ ...next, map: { ...next.map, playerTiles: revealTile(next, target.id, 'scouted') } });
  const encounterId = tile.encounterIds.find((id) => !next.encounter.resolvedIds.includes(id));
  return encounterId ? finish({ ...next, encounter: { ...next.encounter, currentId: encounterId }, logs: appendLog(next, '이 지형에서 처리해야 할 사건을 만났다.') }) : next;
}

export function observeTile(state: GameState, tileId: string): GameState {
  if (!getNeighbors(state.player.position, state.map.size).some((neighbor) => neighbor.id === tileId)) return { ...state, feedbackMessage: '인접한 타일만 관측할 수 있다.' };
  let playerTiles = revealTile(state, tileId, 'observed');
  const reliability = calculateObservationReliability(state);
  const observed = playerTiles.find((tile) => tile.id === tileId);
  if (reliability < 0.7 && observed?.observedHint) {
    playerTiles = updatePlayerTile({ ...state, map: { ...state.map, playerTiles } }, tileId, {
      observedHint: { ...observed.observedHint, riskBand: 'medium', passabilityHint: '추위와 피로 때문에 확신할 수 없다' },
      playerNotes: [...observed.playerNotes, '관측 신뢰도 낮음'],
      notes: [...observed.notes, '관측 신뢰도 낮음'],
    });
  }
  return advanceAction({ ...state, map: { ...state.map, playerTiles } }, reliability < 0.7 ? `${tileId} 지형을 관측했지만 추위와 피로로 판단이 흐릿하다.` : `${tileId} 지형을 관측했다.`);
}

export function recordTile(state: GameState, tileId: string, data: RecordTileData = {}): GameState {
  const tile = state.map.playerTiles.find((entry) => entry.id === tileId);
  if (!tile || tile.playerKnowledgeState === 'unknown') return { ...state, feedbackMessage: '먼저 관측하거나 정찰한 타일만 기록할 수 있다.' };
  const playerTiles = tile.playerKnowledgeState === 'observed'
    ? updatePlayerTile(state, tileId, { playerKnowledgeState: 'recorded', state: 'recorded', playerRecordedRisk: data.recordedRisk, playerNotes: [...tile.playerNotes, ...(data.note ? [data.note] : [])], notes: [...tile.notes, ...(data.note ? [data.note] : [])] })
    : revealTile(state, tileId, data.markAsRoute ? 'route_connected' : 'recorded');
  return advanceAction({ ...state, map: { ...state.map, playerTiles, mapTools: Math.max(0, state.map.mapTools - 1) } }, `${tileId} 타일을 군대용 지도에 기록했다.`);
}

export function markRouteTile(state: GameState, tileId: string): GameState {
  const tile = state.map.playerTiles.find((entry) => entry.id === tileId);
  if (!tile || tile.playerKnowledgeState !== 'recorded') return { ...state, feedbackMessage: '기록된 타일만 경로 후보로 연결할 수 있다.' };
  if (tile.confirmedPassability === undefined) return { ...state, feedbackMessage: '관측만 기록한 타일은 아직 경로 후보로 연결할 만큼 신뢰할 수 없다.' };
  if (tile.confirmedPassability === 'blocked') return { ...state, feedbackMessage: '군대 경로로 연결하기에는 길이 끊겨 있다.' };
  return advanceAction({ ...state, map: { ...state.map, playerTiles: revealTile(state, tileId, 'route_connected') } }, `${tileId} 타일을 한니발군 경로 후보로 연결했다.`);
}

export function rest(state: GameState): GameState {
  return advanceAction({ ...state, player: { ...state.player, health: clamp(state.player.health + 8, 0, state.player.maxHealth), warmth: clamp(state.player.warmth + 16, 0, state.player.maxWarmth), fatigue: clamp(state.player.fatigue - 28, 0, state.player.maxFatigue), food: Math.max(0, state.player.food - 1) } }, '눈을 피해 쉬며 체온과 기력을 추슬렀다.');
}

export function placePlayerMarker(state: GameState, x: number, y: number): GameState {
  const parchmentPlayer = placePlayerMarkerOnMap(state.map.parchmentPlayer, x, y, 'return', '수동 귀환 표식');
  return finish({ ...state, map: { ...state.map, parchmentPlayer }, logs: appendLog(state, `지도에 귀환 표식을 남겼다. (${Math.round(x)}, ${Math.round(y)})`) });
}

export function returnToCamp(state: GameState): GameState {
  const current = getSystemTile(state, state.player.position) ?? { x: 0, y: 0 };
  const camp = getSystemTile(state, state.player.campPosition) ?? { x: 3, y: 6 };
  const distance = Math.abs(current.x - camp.x) + Math.abs(current.y - camp.y);
  let returned = checkSurvival({ ...state, player: { ...state.player, position: state.player.campPosition, hasReturned: true, health: clamp(state.player.health - distance * 3, 0, state.player.maxHealth), warmth: clamp(state.player.warmth - distance * 4, 0, state.player.maxWarmth), fatigue: clamp(state.player.fatigue + distance * 5, 0, state.player.maxFatigue) }, encounter: { ...state.encounter, currentId: null }, logs: appendLog(state, '한니발의 야영지로 복귀해 지도를 제출했다.') });
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
