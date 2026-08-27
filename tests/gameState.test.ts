import { applyChoice, applyEffects } from '../src/game/encounterEngine';
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
    flags: ['legacy-flag'], mapSize: state.map.size, systemMap: state.map.systemTiles,
    playerMap: state.map.playerTiles, parchmentSystemMap: state.map.parchmentSystem,
    parchmentPlayerMap: state.map.parchmentPlayer, currentEncounterId: 'START_001',
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
