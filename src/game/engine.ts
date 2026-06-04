import { clamp, createInitialState } from './state';
import type { EncounterChoice, EncounterConditions, EncounterEffects, GameState, RelationshipScore, TileMarkState } from './types';

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

function resolveTileId(state: GameState, tileId: string): string {
  return tileId === 'current' ? state.location : tileId;
}

function markTile(state: GameState, tileId: string, tileState: TileMarkState): GameState {
  const resolvedTileId = resolveTileId(state, tileId);
  const next = { ...state };
  next.markedTileTags = [
    ...state.markedTileTags.filter((tile) => !(tile.tileId === resolvedTileId && tile.state === tileState)),
    { tileId: resolvedTileId, state: tileState },
  ];
  if (tileState === 'observed') next.observedTiles = addUnique(state.observedTiles, [resolvedTileId]);
  if (tileState === 'scouted') next.scoutedTiles = addUnique(state.scoutedTiles, [resolvedTileId]);
  if (tileState === 'recorded') next.recordedTiles = addUnique(state.recordedTiles, [resolvedTileId]);
  if (tileState === 'connected') next.connectedTiles = addUnique(state.connectedTiles, [resolvedTileId]);
  return next;
}

function removeStatusEffects(existing: string[], removals: string[] = []): string[] {
  if (removals.includes('all')) return [];
  return removeValues(existing, removals);
}

export function areConditionsMet(state: GameState, conditions?: EncounterConditions): boolean {
  if (!conditions) return true;
  if (!hasAll(state.items, conditions.requiredItems)) return false;
  if (hasAny(state.items, conditions.forbiddenItems)) return false;
  if (!hasAll(state.flags, conditions.requiredFlags)) return false;
  if (hasAny(state.flags, conditions.forbiddenFlags)) return false;
  if (!hasAll(state.traits, conditions.requiredTraits)) return false;
  if (conditions.location && state.location !== conditions.location) return false;
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
    day: Math.max(1, state.day + (effects.day ?? 0)),
    hp: clamp(state.hp + (effects.hp ?? 0), 0, state.maxHp),
    sanity: clamp(state.sanity + (effects.sanity ?? 0), 0, state.maxSanity),
    bodyTemp: clamp(state.bodyTemp + (effects.bodyTemp ?? 0), 0, state.maxBodyTemp),
    food: Math.max(0, state.food + (effects.food ?? 0)),
    mapTools: Math.max(0, state.mapTools + (effects.mapTools ?? 0)),
    slot: Math.max(1, state.slot + (effects.slot ?? 0)),
    flags: removeValues(addUnique(state.flags, effects.addFlags), effects.removeFlags),
    items: removeValues(addUnique(state.items, effects.addItems), effects.removeItems),
    traits: effects.addTrait ? addUnique(state.traits, [effects.addTrait]) : state.traits,
    statusEffects: removeStatusEffects(addUnique(state.statusEffects, effects.addStatus), effects.removeStatus),
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

  if (effects.addRelationship) {
    next.relationships = upsertRelationship(next.relationships, effects.addRelationship.target, effects.addRelationship.value);
  }

  if (effects.addChainState) {
    next.chainStates = upsertChainState(next, effects.addChainState.chainId, effects.addChainState.step);
  }

  const location = effects.setLocation ?? effects.location;
  const mapUnlocked = effects.setMapUnlocked ?? effects.mapUnlocked;
  const tutorialComplete = effects.setTutorialComplete ?? effects.tutorialComplete;

  if (location) next.location = location;
  if (effects.isDead !== undefined) next.isDead = effects.isDead;
  if (effects.deathReason !== undefined) next.deathReason = effects.deathReason;
  if (tutorialComplete !== undefined) next.tutorialComplete = tutorialComplete;
  if (mapUnlocked !== undefined) next.mapUnlocked = mapUnlocked;
  if (effects.nextEncounterId) next.currentEncounterId = effects.nextEncounterId;
  if (effects.recordCurrentTile) next = markTile(next, next.location, 'recorded');
  if (effects.markTile) next = markTile(next, effects.markTile.tileId, effects.markTile.state);

  return next;
}

export function applyChoice(state: GameState, choice: EncounterChoice): GameState {
  if (choice.disabled || choice.disabledMessage || choice.disabledReason) {
    return { ...state, feedbackMessage: choice.disabledReason ?? choice.disabledMessage ?? '아직 선택할 수 없다.' };
  }
  if (!areConditionsMet(state, choice.conditions)) {
    return { ...state, feedbackMessage: getConditionFailureMessage(choice.conditions) };
  }
  return applyEffects(state, { ...(choice.effects ?? {}), nextEncounterId: choice.nextEncounterId ?? choice.effects?.nextEncounterId });
}

export function newGame(): GameState {
  return createInitialState();
}

export function patchState(state: GameState, patch: Partial<GameState>): GameState {
  return { ...state, ...patch };
}
