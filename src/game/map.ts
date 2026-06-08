import type { Coordinate, Direction, GameState, MapTile, PlayerMapTile, TerrainType, TileState } from './types';

const MAP_SIZE = 7;
const TERRAIN: TerrainType[] = ['ridge', 'pass', 'forest', 'cliff', 'glacier', 'ravine'];

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return ((state >>> 0) / 4294967296);
  };
}

export function tileId(x: number, y: number): string {
  return `${x},${y}`;
}

export function parseTileId(id: string): Coordinate {
  const [x, y] = id.split(',').map(Number);
  return { x, y };
}

export function getNeighbors(tileIdValue: string, size = MAP_SIZE): Array<{ direction: Direction; id: string }> {
  const { x, y } = parseTileId(tileIdValue);
  const candidates: Array<{ direction: Direction; x: number; y: number }> = [
    { direction: 'north', x, y: y - 1 },
    { direction: 'south', x, y: y + 1 },
    { direction: 'east', x: x + 1, y },
    { direction: 'west', x: x - 1, y },
  ];
  return candidates.filter((tile) => tile.x >= 0 && tile.x < size && tile.y >= 0 && tile.y < size).map((tile) => ({ direction: tile.direction, id: tileId(tile.x, tile.y) }));
}

function terrainRisk(terrain: TerrainType, rng: () => number): number {
  const baseRisk: Record<TerrainType, number> = {
    camp: 1,
    pass: 3,
    ridge: 5,
    forest: 4,
    ravine: 7,
    glacier: 8,
    cliff: 9,
  };
  return Math.min(10, baseRisk[terrain] + Math.floor(rng() * 3));
}

function isPassable(terrain: TerrainType, risk: number): boolean {
  if (terrain === 'cliff') return false;
  if (terrain === 'glacier' && risk >= 10) return false;
  return true;
}

function chooseEncounter(terrain: TerrainType, risk: number, rng: () => number): string[] {
  if (terrain === 'camp') return [];
  if (terrain === 'pass' && rng() < 0.4) return ['ENC_MVP_PASS_MARKER'];
  if (risk >= 8 && rng() < 0.45) return ['ENC_MVP_AVALANCHE_SLOPE'];
  if ((terrain === 'forest' || terrain === 'ridge') && rng() < 0.35) return ['ENC_MVP_SUPPLY_CACHE'];
  return [];
}

export function generateSystemMap(seed: string, size = MAP_SIZE): MapTile[] {
  const rng = createRng(seed);
  const camp = tileId(Math.floor(size / 2), size - 1);
  const passColumn = Math.floor(size / 2) + (rng() > 0.5 ? 1 : -1);
  const tiles: MapTile[] = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const id = tileId(x, y);
      const onGuaranteedRoute = x === passColumn || (y === size - 1 && x >= Math.min(passColumn, Math.floor(size / 2)) && x <= Math.max(passColumn, Math.floor(size / 2)));
      const terrain = id === camp ? 'camp' : onGuaranteedRoute ? 'pass' : TERRAIN[Math.floor(rng() * TERRAIN.length)];
      const risk = terrainRisk(terrain, rng);
      const critical = y <= 1 || (onGuaranteedRoute && y <= 4) || risk >= 8;
      tiles.push({
        id,
        x,
        y,
        terrain,
        risk,
        passable: onGuaranteedRoute || isPassable(terrain, risk),
        critical,
        encounterIds: chooseEncounter(terrain, risk, rng),
      });
    }
  }

  return tiles;
}

export function createPlayerMap(systemMap: MapTile[], campPosition: string): PlayerMapTile[] {
  return systemMap.map((tile) => ({
    id: tile.id,
    x: tile.x,
    y: tile.y,
    state: tile.id === campPosition ? 'route_connected' : 'unknown',
    observedTerrain: tile.id === campPosition ? tile.terrain : undefined,
    observedRisk: tile.id === campPosition ? tile.risk : undefined,
    observedPassable: tile.id === campPosition ? tile.passable : undefined,
    notes: tile.id === campPosition ? ['한니발의 전진 야영지'] : [],
    hasEncounterHint: false,
  }));
}

export function getSystemTile(state: GameState, id: string): MapTile | undefined {
  return state.systemMap.find((tile) => tile.id === id);
}

export function getPlayerTile(state: GameState, id: string): PlayerMapTile | undefined {
  return state.playerMap.find((tile) => tile.id === id);
}

export function updatePlayerTile(state: GameState, id: string, patch: Partial<PlayerMapTile>): PlayerMapTile[] {
  return state.playerMap.map((tile) => tile.id === id ? { ...tile, ...patch } : tile);
}

export function revealTile(state: GameState, id: string, stateValue: TileState): PlayerMapTile[] {
  const systemTile = getSystemTile(state, id);
  if (!systemTile) return state.playerMap;
  const existing = getPlayerTile(state, id);
  const nextState = rankTileState(stateValue) > rankTileState(existing?.state ?? 'unknown') ? stateValue : existing?.state ?? stateValue;
  return updatePlayerTile(state, id, {
    state: nextState,
    observedTerrain: systemTile.terrain,
    observedRisk: systemTile.risk,
    observedPassable: systemTile.passable,
    hasEncounterHint: systemTile.encounterIds.length > 0,
  });
}

export function rankTileState(state: TileState): number {
  return { unknown: 0, observed: 1, scouted: 2, recorded: 3, route_connected: 4 }[state];
}

export function directionLabel(direction: Direction): string {
  return { north: '북쪽', south: '남쪽', east: '동쪽', west: '서쪽' }[direction];
}
