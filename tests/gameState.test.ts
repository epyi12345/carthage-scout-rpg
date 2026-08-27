import { applyChoice, applyEffects, selectMapDirection } from '../src/game/encounterEngine';
import { getEncounter } from '../src/game/encounter';
import { generateMapTestState } from '../src/features/map/mapGenerator';
import { getDirectionCandidates } from '../src/features/map/mapLogic';
import { CURRENT_SCHEMA_VERSION, startNewGame } from '../src/game/gameState';
import { deserializeGameState, loadGameFromStorage, SAVE_KEY, saveGameToStorage, serializeGameState, UnsupportedSaveVersionError } from '../src/game/saveLoad';
import type { EncounterChoice, GameState } from '../src/game/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function equal<T>(actual: T, expected: T, message: string): void {
  assert(Object.is(actual, expected), `${message}: expected ${String(expected)}, got ${String(actual)}`);
}
function deepEqual(actual: unknown, expected: unknown, message: string): void {
  assert(JSON.stringify(actual) === JSON.stringify(expected), message);
}
function run(name: string, test: () => void): void {
  test();
  console.log(`✓ ${name}`);
}

const successChoice: EncounterChoice = {
  id: 'take-rope',
  text: '밧줄을 챙긴다',
  effects: { addItem: 'rope', health: -5 },
  logMessage: '밧줄을 챙겼다.',
  resultText: '밧줄을 배낭에 묶었다.',
  nextEncounterId: 'NEXT',
};

run('item additions and removals survive subsequent transitions', () => {
  const initial = startNewGame('inventory-test');
  const added = applyEffects(initial, { addItem: 'rope' });
  const transitioned = applyEffects(added, { health: -1 });
  assert(transitioned.inventory.itemIds.includes('rope'), 'added item was lost');
  const removed = applyEffects(transitioned, { removeItem: 'rope' });
  const afterRemoval = applyEffects(removed, { food: 1 });
  assert(!afterRemoval.inventory.itemIds.includes('rope'), 'removed item was restored');
});

run('new logs persist and a choice applies exactly once', () => {
  const initial = startNewGame('choice-once');
  const first = applyChoice(initial, successChoice, initial.encounter.currentId);
  assert(first.applied, 'first application should succeed');
  equal(first.state.player.health, initial.player.health - 5, 'health effect');
  equal(first.state.logs.filter((entry) => entry.message === successChoice.logMessage).length, 1, 'success log count');
  const duplicate = applyChoice(first.state, successChoice, initial.encounter.currentId);
  assert(!duplicate.applied, 'duplicate application should be rejected');
  equal(duplicate.state.player.health, first.state.player.health, 'duplicate changed health');
  equal(duplicate.state.logs.length, first.state.logs.length, 'duplicate added a log');
});

run('failed choices preserve the original state and expose no resultText', () => {
  const initial = startNewGame('condition-failure');
  const choice: EncounterChoice = { ...successChoice, id: 'requires-pendant', conditions: { requiredItems: ['pendant'] }, effects: { removeItem: 'rope', health: -50 } };
  const before = serializeGameState(initial);
  const result = applyChoice(initial, choice);
  assert(!result.applied, 'condition failure should be rejected');
  equal(serializeGameState(result.state), before, 'failed choice mutated state');
  assert(!('resultText' in result), 'failed choice exposed success result text');
});

function legacyFixture(): Record<string, unknown> {
  const state = startNewGame('legacy-fixture');
  return {
    runId: 'legacy-run', seed: 'legacy-fixture', maxDays: 21, actionCount: 3, slot: 2,
    player: { ...state.player, health: 80, day: 4 },
    playerState: { ...state.player, health: 65, day: 5 },
    inventory: ['authoritative-inventory'], items: ['stale-items-alias'],
    log: ['authoritative-log'], lastLog: ['stale-log-alias'],
    flags: ['legacy-flag'], mapSize: 7, currentEncounterId: 'START_001',
    resolvedEncounterIds: [], mapTools: 4, tutorialComplete: false, mapUnlocked: true,
  };
}

run('legacy aliases migrate using historical authority order', () => {
  const migrated = deserializeGameState(JSON.stringify(legacyFixture()));
  equal(migrated.schemaVersion, CURRENT_SCHEMA_VERSION, 'schema version');
  equal(migrated.player.health, 65, 'playerState should win over player');
  deepEqual(migrated.inventory.itemIds, ['authoritative-inventory'], 'inventory should win over items');
  equal(migrated.logs[0]?.message, 'authoritative-log', 'log should win over lastLog');
  const serialized = JSON.parse(serializeGameState(migrated)) as Record<string, unknown>;
  for (const legacy of ['items', 'lastLog', 'log', 'playerState', 'currentDay', 'day', 'playerPosition', 'location', 'hp', 'bodyTemp']) {
    assert(!(legacy in serialized), `legacy alias remained: ${legacy}`);
  }
});

run('current saves round-trip without changes', () => {
  const state = applyEffects(startNewGame('round-trip'), { addItem: 'rope', addFlag: 'mapped-pass' });
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
  saveGameToStorage(state, storage);
  assert(data.has(SAVE_KEY), 'save key changed');
  deepEqual(loadGameFromStorage(storage), state, 'save/load round trip changed state');
});

run('future schema versions are rejected without deleting storage', () => {
  const raw = JSON.stringify({ ...startNewGame('future'), schemaVersion: CURRENT_SCHEMA_VERSION + 1 });
  let rejected = false;
  try { deserializeGameState(raw); } catch (error) { rejected = error instanceof UnsupportedSaveVersionError; }
  assert(rejected, 'future version was not explicitly rejected');
});

run('the shared 30x30 generator is deterministic and its goal is grid-reachable', () => {
  const first = generateMapTestState('shared-map-seed');
  const second = generateMapTestState('shared-map-seed');
  deepEqual(first, second, 'same seed generated different maps');
  equal(first.size, 30, 'map size');
  equal(first.tiles.length, 900, 'tile count');
  const gridDistance = Math.abs(first.startPosition.x - first.goalPosition.x) + Math.abs(first.startPosition.y - first.goalPosition.y);
  assert(gridDistance > 0 && gridDistance <= 58, 'goal is not reachable through the 30x30 grid');
  assert(getDirectionCandidates(first).length >= 2, 'start position has no direction candidates');
});

function finishTutorial(seed: string): GameState {
  const initial = startNewGame(seed);
  const tutorialComplete = getEncounter('TUT_COMPLETE');
  assert(tutorialComplete, 'TUT_COMPLETE missing');
  const ready = { ...initial, encounter: { ...initial.encounter, currentId: tutorialComplete.id } };
  const result = applyChoice(ready, tutorialComplete.choices[0], tutorialComplete.id);
  assert(result.applied, 'tutorial completion was rejected');
  return result.state;
}

run('tutorial completion and skip-equivalent transition preserve the authoritative map', () => {
  const initial = startNewGame('tutorial-map');
  assert(selectMapDirection(initial, getDirectionCandidates(initial.map)[0]).moved === false, 'movement was allowed during tutorial');
  const beforeMap = initial.map;
  const completed = finishTutorial('tutorial-map');
  equal(completed.phase, 'direction', 'tutorial did not enter direction phase');
  assert(completed.map.unlocked, 'tutorial did not unlock the map');
  equal(completed.encounter.currentId, null, 'tutorial encounter was not cleared');
  deepEqual(completed.map.currentPosition, beforeMap.currentPosition, 'tutorial reset map position');
  deepEqual(completed.map.tiles, beforeMap.tiles, 'tutorial reset map tiles');
  const skipped = applyEffects(initial, { setTutorialComplete: true, nextEncounterId: null });
  equal(skipped.phase, 'direction', 'skip-equivalent did not enter direction phase');
  deepEqual(skipped.map.currentPosition, initial.map.currentPosition, 'skip-equivalent reset position');
});

run('a valid first move is atomic, costs once, visits its destination, and opens MAP_ENTRY_001', () => {
  const ready = finishTutorial('first-map-move');
  const candidate = getDirectionCandidates(ready.map)[0];
  const target = ready.map.specialNodes.find((node) => node.id === candidate.nodeId);
  assert(target, 'candidate target missing');
  const result = selectMapDirection(ready, candidate);
  assert(result.moved, 'valid move was rejected');
  deepEqual(result.state.map.currentPosition, target.center, 'position did not move to target');
  equal(result.state.run.actionCount, ready.run.actionCount + 1, 'action cost applied incorrectly');
  equal(result.state.player.warmth, ready.player.warmth - 2, 'warmth cost applied incorrectly');
  equal(result.state.player.fatigue, ready.player.fatigue + 2, 'fatigue cost applied incorrectly');
  equal(result.state.map.moveCount, 1, 'move count');
  assert(result.state.map.tiles.find((tile) => tile.position.x === target.center.x && tile.position.y === target.center.y)?.visited, 'destination was not visited');
  equal(result.state.encounter.currentId, 'MAP_ENTRY_001', 'map entry encounter did not open');
  assert(!selectMapDirection(result.state, getDirectionCandidates(result.state.map)[0]).moved, 'movement was allowed during encounter');
  const invalid = selectMapDirection(ready, { ...candidate, nodeId: 'missing-node' });
  assert(!invalid.moved, 'invalid move succeeded');
  assert(invalid.state === ready, 'invalid move changed state');
});

run('both MAP_ENTRY_001 choices resolve once and return to direction selection', () => {
  const encounter = getEncounter('MAP_ENTRY_001');
  assert(encounter, 'MAP_ENTRY_001 missing from active catalog');
  for (const choice of encounter.choices) {
    const ready = finishTutorial(`map-entry-${choice.id}`);
    const moved = selectMapDirection(ready, getDirectionCandidates(ready.map)[0]);
    assert(moved.moved, 'first move failed');
    const resolved = applyChoice(moved.state, choice, encounter.id);
    assert(resolved.applied, `${choice.id} did not resolve`);
    equal(resolved.state.phase, 'direction', `${choice.id} did not return to direction selection`);
    assert(resolved.state.flags.includes('map_entry_001_completed'), `${choice.id} did not set completion flag`);
    equal(resolved.state.logs.filter((entry) => entry.message === choice.logMessage).length, 1, `${choice.id} log count`);
    const duplicate = applyChoice(resolved.state, choice, encounter.id);
    assert(!duplicate.applied, `${choice.id} applied twice`);
    const secondMove = selectMapDirection(resolved.state, getDirectionCandidates(resolved.state.map)[0]);
    assert(secondMove.moved, 'next direction was blocked');
    equal(secondMove.state.encounter.currentId, null, 'MAP_ENTRY_001 occurred again');
  }
});

run('map progression round-trips at tutorial, encounter, and resolved checkpoints', () => {
  const checkpoints: GameState[] = [];
  const tutorialDone = finishTutorial('map-save');
  checkpoints.push(tutorialDone);
  const moved = selectMapDirection(tutorialDone, getDirectionCandidates(tutorialDone.map)[0]);
  assert(moved.moved, 'checkpoint move failed');
  checkpoints.push(moved.state);
  const encounter = getEncounter('MAP_ENTRY_001');
  assert(encounter, 'MAP_ENTRY_001 missing');
  const resolved = applyChoice(moved.state, encounter.choices[0], encounter.id);
  assert(resolved.applied, 'checkpoint encounter failed');
  checkpoints.push(resolved.state);
  for (const checkpoint of checkpoints) deepEqual(deserializeGameState(serializeGameState(checkpoint)), checkpoint, 'map checkpoint did not round-trip');
});
