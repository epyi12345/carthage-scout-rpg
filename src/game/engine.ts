import { evaluateEnding } from './ending';
import { getNeighbors, getSystemTile, revealTile } from './map';
import { clamp, createInitialState } from './state';
import type { Direction, EncounterChoice, EncounterConditions, EncounterEffects, GameState, RelationshipScore, TileMarkState } from './types';

function addUnique<T>(existing: T[], additions: T[] = []): T[] {
  return Array.from(new Set([...existing, ...additions]));
}

function removeValues(existing: string[], removals: string[] = []): string[] {
  return existing.filter((value) => !removals.includes(value));
}

function hasAll(existing: string[], required: string[] = []): boolean {
  return required.every((value) => existing.includes(value));
}

function hasAny(existing: string[], forbidden: string[] = []): boolean {
  return forbidden.some((value) => existing.includes(value));
}

function upsertRelationship(existing: RelationshipScore[], target: string, delta: number): RelationshipScore[] {
  const found = existing.find((relationship) => relationship.target === target);
  if (!found) return [...existing, { target, value: delta }];
  return existing.map((relationship) => relationship.target === target ? { ...relationship, value: relationship.value + delta } : relationship);
}

function upsertChainState(state: GameState, chainId: string, step: number): GameState['chainStates'] {
  const found = state.chainStates.find((chainState) => chainState.chainId === chainId);
  if (!found) return [...state.chainStates, { chainId, step }];
  return state.chainStates.map((chainState) => chainState.chainId === chainId ? { ...chainState, step } : chainState);
}

function removeStatusEffects(existing: string[], removals: string[] = []): string[] {
  if (removals.includes('all')) return [];
  return removeValues(existing, removals);
}

function appendLog(state: GameState, message: string): string[] {
  return [message, ...state.lastLog].slice(0, 6);
}

function syncLegacyFields(state: GameState): GameState {
  const observedTiles = state.playerMap.filter((tile) => tile.state === 'observed').map((tile) => tile.id);
  const scoutedTiles = state.playerMap.filter((tile) => tile.state === 'scouted').map((tile) => tile.id);
  const recordedTiles = state.playerMap.filter((tile) => tile.state === 'recorded').map((tile) => tile.id);
  const connectedTiles = state.playerMap.filter((tile) => tile.state === 'route_connected').map((tile) => tile.id);
  return {
    ...state,
    day: state.player.day,
    hp: state.player.health,
    food: state.player.food,
    bodyTemp: state.player.warmth,
    location: state.player.position,
    observedTiles,
    scoutedTiles,
    recordedTiles,
    connectedTiles,
  };
}

function advanceAction(state: GameState, logMessage: string): GameState {
  const actionCount = state.actionCount + 1;
  const dayIncrease = actionCount > 0 && actionCount % 5 === 0 ? 1 : 0;
  const next: GameState = {
    ...state,
    actionCount,
    feedbackMessage: null,
    lastLog: appendLog(state, logMessage),
    player: {
      ...state.player,
      day: state.player.day + dayIncrease,
      warmth: clamp(state.player.warmth - 2, 0, state.player.maxWarmth),
      fatigue: clamp(state.player.fatigue + 2, 0, state.player.maxFatigue),
      food: dayIncrease ? Math.max(0, state.player.food - 1) : state.player.food,
    },
  };
  return checkSurvival(syncLegacyFields(next));
}

function checkSurvival(state: GameState): GameState {
  let health = state.player.health;
  const reasons: string[] = [];
  if (state.player.warmth <= 0) {
    health = clamp(health - 12, 0, state.player.maxHealth);
    reasons.push('체온이 바닥나 몸이 굳어 간다.');
  }
  if (state.player.food <= 0) {
    health = clamp(health - 6, 0, state.player.maxHealth);
    reasons.push('식량이 떨어져 힘이 빠진다.');
  }
  if (state.player.fatigue >= state.player.maxFatigue) {
    health = clamp(health - 8, 0, state.player.maxHealth);
    reasons.push('피로가 한계에 닿았다.');
  }
  const next = { ...state, player: { ...state.player, health }, lastLog: reasons.length ? [...reasons, ...state.lastLog].slice(0, 6) : state.lastLog };
  if (health <= 0) return syncLegacyFields({ ...next, isDead: true, deathReason: '알프스는 지도보다 먼저 당신의 몸을 무너뜨렸다.' });
  return syncLegacyFields(next);
}

function markTile(state: GameState, tileId: string, tileState: TileMarkState): GameState {
  const resolvedTileId = tileId === 'current' ? state.player.position : tileId;
  let playerMap = state.playerMap;
  if (tileState === 'observed') playerMap = revealTile({ ...state, playerMap }, resolvedTileId, 'observed');
  if (tileState === 'scouted') playerMap = revealTile({ ...state, playerMap }, resolvedTileId, 'scouted');
  if (tileState === 'recorded') playerMap = revealTile({ ...state, playerMap }, resolvedTileId, 'recorded');
  if (tileState === 'connected') playerMap = revealTile({ ...state, playerMap }, resolvedTileId, 'route_connected');
  return syncLegacyFields({
    ...state,
    playerMap,
    markedTileTags: [
      ...state.markedTileTags.filter((tile) => !(tile.tileId === resolvedTileId && tile.state === tileState)),
      { tileId: resolvedTileId, state: tileState },
    ],
  });
}

export function areConditionsMet(state: GameState, conditions?: EncounterConditions): boolean {
  if (!conditions) return true;
  if (!hasAll(state.items, conditions.requiredItems)) return false;
  if (hasAny(state.items, conditions.forbiddenItems)) return false;
  if (!hasAll(state.flags, conditions.requiredFlags)) return false;
  if (hasAny(state.flags, conditions.forbiddenFlags)) return false;
  if (!hasAll(state.traits, conditions.requiredTraits)) return false;
  if (conditions.location && state.player.position !== conditions.location && state.location !== conditions.location) return false;
  return true;
}

export function getConditionFailureMessage(conditions?: EncounterConditions): string {
  if (conditions?.requiredItems?.includes('pendant')) return '피 묻은 펜던트가 필요하다.';
  if (conditions?.requiredItems?.length) return `필요 아이템: ${conditions.requiredItems.join(', ')}`;
  if (conditions?.requiredFlags?.length) return `필요 플래그: ${conditions.requiredFlags.join(', ')}`;
  if (conditions?.requiredTraits?.length) return `필요 특성: ${conditions.requiredTraits.join(', ')}`;
  return '아직 이 선택을 할 조건이 부족하다.';
}

export function applyEffects(state: GameState, effects: EncounterEffects = {}): GameState {
  let next: GameState = {
    ...state,
    feedbackMessage: null,
    flags: removeValues(addUnique(state.flags, effects.addFlags), effects.removeFlags),
    items: removeValues(addUnique(state.items, effects.addItems), effects.removeItems),
    traits: effects.addTrait ? addUnique(state.traits, [effects.addTrait]) : state.traits,
    statusEffects: removeStatusEffects(addUnique(state.statusEffects, effects.addStatus), effects.removeStatus),
    player: {
      ...state.player,
      health: clamp(state.player.health + (effects.health ?? effects.hp ?? 0), 0, state.player.maxHealth),
      warmth: clamp(state.player.warmth + (effects.warmth ?? effects.bodyTemp ?? 0), 0, state.player.maxWarmth),
      fatigue: clamp(state.player.fatigue + (effects.fatigue ?? 0), 0, state.player.maxFatigue),
      food: Math.max(0, state.player.food + (effects.food ?? 0)),
      day: Math.max(1, state.player.day + (effects.day ?? 0)),
    },
    sanity: clamp(state.sanity + (effects.sanity ?? 0), 0, state.maxSanity),
    mapTools: Math.max(0, state.mapTools + (effects.mapTools ?? 0)),
    slot: Math.max(1, state.slot + (effects.slot ?? 0)),
  };

  if (effects.consumePendant || effects.transformPendantInto) {
    next.items = removeValues(next.items, ['pendant']);
    next.hasConsumedPendant = true;
    // 펜던트는 끝까지 보존하면 업적 대상이지만,
    // 깊은 샘이나 위기 상황에서 소모해 강력한 보상을 얻을 수도 있다.
  }

  if (effects.transformPendantInto) {
    next.pendantTransformedInto = effects.transformPendantInto;
    next.items = addUnique(next.items, [effects.transformPendantInto]);
  }
  if (effects.addRelationship) next.relationships = upsertRelationship(next.relationships, effects.addRelationship.target, effects.addRelationship.value);
  if (effects.addChainState) next.chainStates = upsertChainState(next, effects.addChainState.chainId, effects.addChainState.step);

  const location = effects.setLocation ?? effects.location;
  if (location) next.player = { ...next.player, position: location };
  if (effects.isDead !== undefined) next.isDead = effects.isDead;
  if (effects.deathReason !== undefined) next.deathReason = effects.deathReason;
  if (effects.setTutorialComplete ?? effects.tutorialComplete) next.tutorialComplete = true;
  if ((effects.setMapUnlocked ?? effects.mapUnlocked) !== undefined) next.mapUnlocked = Boolean(effects.setMapUnlocked ?? effects.mapUnlocked);
  if (effects.nextEncounterId !== undefined) next.currentEncounterId = effects.nextEncounterId;
  if (effects.recordCurrentTile) next = markTile(next, next.player.position, 'recorded');
  if (effects.markTile) next = markTile(next, effects.markTile.tileId, effects.markTile.state);

  return checkSurvival(syncLegacyFields(next));
}

export function applyChoice(state: GameState, choice: EncounterChoice): GameState {
  if (choice.disabled || choice.disabledMessage || choice.disabledReason) return { ...state, feedbackMessage: choice.disabledReason ?? choice.disabledMessage ?? '아직 선택할 수 없다.' };
  if (!areConditionsMet(state, choice.conditions)) return { ...state, feedbackMessage: getConditionFailureMessage(choice.conditions) };
  const next = applyEffects(state, { ...(choice.effects ?? {}), nextEncounterId: choice.nextEncounterId ?? choice.effects?.nextEncounterId ?? null });
  return syncLegacyFields({ ...next, resolvedEncounterIds: state.currentEncounterId ? addUnique(next.resolvedEncounterIds, [state.currentEncounterId]) : next.resolvedEncounterIds });
}

export function movePlayer(state: GameState, direction: Direction): GameState {
  const target = getNeighbors(state.player.position, state.mapSize).find((neighbor) => neighbor.direction === direction);
  if (!target) return { ...state, feedbackMessage: '그 방향으로는 이동할 수 없다.' };
  const systemTile = getSystemTile(state, target.id);
  if (!systemTile || !systemTile.passable) return { ...state, feedbackMessage: '정찰병 혼자도 지나가기 어려운 지형이다.' };
  let next = advanceAction({ ...state, player: { ...state.player, position: target.id } }, `${direction} 방향으로 이동했다.`);
  next = syncLegacyFields({ ...next, playerMap: revealTile(next, target.id, 'scouted') });
  const encounterId = systemTile.encounterIds.find((id) => !next.resolvedEncounterIds.includes(id));
  if (encounterId) next = { ...next, currentEncounterId: encounterId, lastLog: appendLog(next, '이 지형에서 처리해야 할 사건을 만났다.') };
  return next;
}

export function observeTile(state: GameState, tileId: string): GameState {
  if (!getNeighbors(state.player.position, state.mapSize).some((neighbor) => neighbor.id === tileId)) return { ...state, feedbackMessage: '인접한 타일만 관측할 수 있다.' };
  const next = advanceAction({ ...state, playerMap: revealTile(state, tileId, 'observed') }, `${tileId} 지형을 관측했다.`);
  return syncLegacyFields(next);
}

export function recordTile(state: GameState, tileId: string): GameState {
  const playerTile = state.playerMap.find((tile) => tile.id === tileId);
  if (!playerTile || playerTile.state === 'unknown') return { ...state, feedbackMessage: '먼저 관측하거나 정찰한 타일만 기록할 수 있다.' };
  const routeState = getSystemTile(state, tileId)?.passable && playerTile.observedRisk !== undefined && playerTile.observedRisk <= 5 ? 'route_connected' : 'recorded';
  const next = advanceAction({ ...state, playerMap: revealTile(state, tileId, routeState), mapTools: Math.max(0, state.mapTools - 1) }, `${tileId} 타일을 군대용 지도에 기록했다.`);
  return syncLegacyFields(next);
}

export function rest(state: GameState): GameState {
  const next = advanceAction({
    ...state,
    player: {
      ...state.player,
      health: clamp(state.player.health + 8, 0, state.player.maxHealth),
      warmth: clamp(state.player.warmth + 16, 0, state.player.maxWarmth),
      fatigue: clamp(state.player.fatigue - 28, 0, state.player.maxFatigue),
      food: Math.max(0, state.player.food - 1),
    },
  }, '눈을 피해 쉬며 체온과 기력을 추슬렀다.');
  return syncLegacyFields(next);
}

export function returnToCamp(state: GameState): GameState {
  const { x, y } = getSystemTile(state, state.player.position) ?? { x: 0, y: 0 };
  const camp = getSystemTile(state, state.player.campPosition) ?? { x: 3, y: 6 };
  const distance = Math.abs(x - camp.x) + Math.abs(y - camp.y);
  const travelDamage = distance * 3;
  const returned = checkSurvival(syncLegacyFields({
    ...state,
    player: {
      ...state.player,
      position: state.player.campPosition,
      health: clamp(state.player.health - travelDamage, 0, state.player.maxHealth),
      warmth: clamp(state.player.warmth - distance * 4, 0, state.player.maxWarmth),
      fatigue: clamp(state.player.fatigue + distance * 5, 0, state.player.maxFatigue),
    },
    currentEncounterId: null,
    lastLog: appendLog(state, '한니발의 야영지로 복귀해 지도를 제출했다.'),
  }));
  return syncLegacyFields({ ...returned, ending: evaluateEnding(returned) });
}

export function newGame(seed?: string): GameState {
  return createInitialState(seed?.trim() || undefined);
}

export function patchState(state: GameState, patch: Partial<GameState>): GameState {
  return syncLegacyFields({ ...state, ...patch });
}
