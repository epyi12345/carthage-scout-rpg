import type { Coordinate, Direction, GameState, MapTile, Passability, PlayerMapTile, RiskBand, TerrainType, TileState } from './types';

export const MVP_MAP_SIZE = 7;

const TERRAIN_TYPES: TerrainType[] = ['ridge', 'cliff', 'snowfield', 'forest', 'cave', 'ravine', 'frozen_pass', 'abandoned_camp'];

const TERRAIN_BASE_RISK: Record<TerrainType, number> = {
  ridge: 5,
  cliff: 9,
  snowfield: 6,
  forest: 4,
  cave: 5,
  ravine: 8,
  frozen_pass: 3,
  abandoned_camp: 2,
};

const TERRAIN_PASSABILITY: Record<TerrainType, Passability> = {
  ridge: 'army_passable',
  cliff: 'blocked',
  snowfield: 'scout_only',
  forest: 'army_passable',
  cave: 'scout_only',
  ravine: 'blocked',
  frozen_pass: 'army_passable',
  abandoned_camp: 'army_passable',
};

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
    return (state >>> 0) / 4294967296;
  };
}

export function tileId(x: number, y: number): string {
  return `${x},${y}`;
}

export function parseTileId(id: string): Coordinate {
  const [x, y] = id.split(',').map(Number);
  return { x, y };
}

export function getNeighbors(tileIdValue: string, size = MVP_MAP_SIZE): Array<{ direction: Direction; id: string }> {
  const { x, y } = parseTileId(tileIdValue);
  const candidates: Array<{ direction: Direction; x: number; y: number }> = [
    { direction: 'north', x, y: y - 1 },
    { direction: 'south', x, y: y + 1 },
    { direction: 'east', x: x + 1, y },
    { direction: 'west', x: x - 1, y },
  ];
  return candidates.filter((tile) => tile.x >= 0 && tile.x < size && tile.y >= 0 && tile.y < size).map((tile) => ({ direction: tile.direction, id: tileId(tile.x, tile.y) }));
}

function riskBand(risk: number): RiskBand {
  if (risk <= 3) return 'low';
  if (risk <= 6) return 'medium';
  if (risk <= 8) return 'high';
  return 'lethal';
}

function riskBandLabel(risk: number): string {
  return { low: '낮은 위험', medium: '불안정한 지형', high: '위험한 지형', lethal: '치명적 위험' }[riskBand(risk)];
}

function passabilityHint(passability: Passability): string {
  if (passability === 'army_passable') return '대열이 지나갈 여지가 보인다';
  if (passability === 'scout_only') return '정찰병은 지나가도 군대는 불확실하다';
  return '길이 끊긴 듯하다';
}

function terrainHint(terrainType: TerrainType): string {
  const hints: Record<TerrainType, string> = {
    ridge: '능선의 윤곽',
    cliff: '끊어진 바위 그림자',
    snowfield: '넓은 설원',
    forest: '검은 숲의 선',
    cave: '바위 밑 어두운 틈',
    ravine: '깊게 팬 골짜기',
    frozen_pass: '얼어붙은 고개',
    abandoned_camp: '오래된 야영 흔적',
  };
  return hints[terrainType];
}

function chooseTerrain(rng: () => number): TerrainType {
  return TERRAIN_TYPES[Math.floor(rng() * TERRAIN_TYPES.length)];
}

function terrainRisk(terrainType: TerrainType, rng: () => number): number {
  return Math.min(10, TERRAIN_BASE_RISK[terrainType] + Math.floor(rng() * 3));
}

function chooseEncounter(terrainType: TerrainType, trueRiskLevel: number, passability: Passability, rng: () => number): string | null {
  if (terrainType === 'abandoned_camp') return 'ENC_MVP_SUPPLY_CACHE';
  if (terrainType === 'frozen_pass' && rng() < 0.45) return 'ENC_MVP_PASS_MARKER';
  if ((trueRiskLevel >= 8 || passability === 'blocked') && rng() < 0.5) return 'ENC_MVP_AVALANCHE_SLOPE';
  if ((terrainType === 'forest' || terrainType === 'cave') && rng() < 0.35) return 'ENC_MVP_SUPPLY_CACHE';
  return null;
}

function buildViableRoute(seed: string, size: number): Set<string> {
  const rng = createRng(`${seed}:route`);
  let x = Math.floor(size / 2);
  let y = size - 1;
  const route = new Set<string>([tileId(x, y)]);

  while (y > 0) {
    const roll = rng();
    if (roll < 0.62) y -= 1;
    else if (roll < 0.81 && x > 1) x -= 1;
    else if (x < size - 2) x += 1;
    else y -= 1;
    route.add(tileId(x, y));
  }

  // Objective area: route must touch at least two top-row/near-top candidate tiles.
  route.add(tileId(x, 0));
  route.add(tileId(Math.max(0, Math.min(size - 1, x + (rng() > 0.5 ? 1 : -1))), 0));
  return route;
}

function makeTile(id: string, x: number, y: number, terrainType: TerrainType, trueRiskLevel: number, passability: Passability, hasCriticalInfo: boolean, encounterId: string | null): MapTile {
  const passable = passability !== 'blocked';
  return {
    id,
    x,
    y,
    terrainType,
    trueRiskLevel,
    passability,
    hasCriticalInfo,
    encounterId,
    returnCost: trueRiskLevel + (passability === 'army_passable' ? 0 : passability === 'scout_only' ? 3 : 8),
    returnSignal: passability === 'blocked' ? 'dead_end' : trueRiskLevel >= 8 ? 'confusing' : trueRiskLevel >= 6 ? 'exposed' : 'safe',
    playerKnowledgeState: 'unknown',
    playerRecordedRisk: undefined,
    playerNotes: [],
    isRouteMarked: false,
    terrain: terrainType,
    risk: trueRiskLevel,
    passable,
    critical: hasCriticalInfo,
    encounterIds: encounterId ? [encounterId] : [],
  };
}

export function generateSystemMap(seed: string, size = MVP_MAP_SIZE): MapTile[] {
  const rng = createRng(seed);
  const viableRoute = buildViableRoute(seed, size);
  const start = tileId(Math.floor(size / 2), size - 1);
  const tiles: MapTile[] = [];
  let resourceCount = 0;
  let riskZoneCount = 0;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const id = tileId(x, y);
      const onRoute = viableRoute.has(id);
      const isStart = id === start;
      const terrainType: TerrainType = isStart ? 'abandoned_camp' : onRoute ? (rng() < 0.72 ? 'frozen_pass' : 'ridge') : chooseTerrain(rng);
      const baseRisk = isStart ? 1 : onRoute ? Math.max(2, terrainRisk(terrainType, rng) - 2) : terrainRisk(terrainType, rng);
      const trueRiskLevel = Math.min(10, baseRisk + (y <= 1 && !onRoute ? 1 : 0));
      const passability = isStart || onRoute ? 'army_passable' : TERRAIN_PASSABILITY[terrainType];
      const hasCriticalInfo = y <= 1 || onRoute || trueRiskLevel >= 8 || passability === 'blocked';
      const encounterId = isStart ? null : chooseEncounter(terrainType, trueRiskLevel, passability, rng);
      if (terrainType === 'abandoned_camp' || terrainType === 'cave' || encounterId === 'ENC_MVP_SUPPLY_CACHE') resourceCount += 1;
      if (trueRiskLevel >= 7 || passability === 'blocked') riskZoneCount += 1;
      tiles.push(makeTile(id, x, y, terrainType, trueRiskLevel, passability, hasCriticalInfo, encounterId));
    }
  }

  // Guarantees for map identity: risk zones, resource/info zones, and return-relevant route data.
  if (resourceCount === 0) {
    const index = Math.floor(rng() * tiles.length);
    tiles[index] = makeTile(tiles[index].id, tiles[index].x, tiles[index].y, 'abandoned_camp', 2, 'army_passable', true, 'ENC_MVP_SUPPLY_CACHE');
  }
  if (riskZoneCount < 5) {
    for (const tile of tiles.filter((candidate) => !viableRoute.has(candidate.id)).slice(0, 5 - riskZoneCount)) {
      const index = tiles.findIndex((candidate) => candidate.id === tile.id);
      tiles[index] = makeTile(tile.id, tile.x, tile.y, 'cliff', 10, 'blocked', true, 'ENC_MVP_AVALANCHE_SLOPE');
    }
  }

  return tiles;
}

export function createPlayerMap(systemMap: MapTile[], startTileId: string): PlayerMapTile[] {
  return systemMap.map((tile) => {
    const isStart = tile.id === startTileId;
    return {
      id: tile.id,
      x: tile.x,
      y: tile.y,
      playerKnowledgeState: isStart ? 'route_connected' : 'unknown',
      playerRecordedRisk: isStart ? tile.trueRiskLevel : undefined,
      playerNotes: isStart ? ['출발 지점. 한니발의 야영지로 돌아오는 기준점.'] : [],
      isRouteMarked: isStart,
      observedHint: isStart ? { terrainHint: terrainHint(tile.terrainType), riskBand: riskBand(tile.trueRiskLevel), passabilityHint: passabilityHint(tile.passability) } : undefined,
      confirmedTerrainType: isStart ? tile.terrainType : undefined,
      confirmedRiskLevel: isStart ? tile.trueRiskLevel : undefined,
      confirmedPassability: isStart ? tile.passability : undefined,
      hasEncounterHint: false,
      state: isStart ? 'route_connected' : 'unknown',
      observedTerrain: isStart ? tile.terrainType : undefined,
      observedRisk: isStart ? tile.trueRiskLevel : undefined,
      observedPassable: isStart ? tile.passability !== 'blocked' : undefined,
      notes: isStart ? ['출발 지점. 한니발의 야영지로 돌아오는 기준점.'] : [],
    };
  });
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
  const nextState = rankTileState(stateValue) > rankTileState(existing?.playerKnowledgeState ?? existing?.state ?? 'unknown') ? stateValue : existing?.playerKnowledgeState ?? existing?.state ?? stateValue;
  const observedHint = { terrainHint: terrainHint(systemTile.terrainType), riskBand: riskBand(systemTile.trueRiskLevel), passabilityHint: passabilityHint(systemTile.passability) };
  const confirmed = stateValue === 'scouted' || stateValue === 'recorded' || stateValue === 'route_connected';
  const recorded = stateValue === 'recorded' || stateValue === 'route_connected';
  const notes = addNote(existing?.playerNotes ?? existing?.notes ?? [], recorded ? `기록: ${systemTile.terrainType}, 위험 ${systemTile.trueRiskLevel}, ${systemTile.passability}` : observedHint.terrainHint);

  return updatePlayerTile(state, id, {
    playerKnowledgeState: nextState,
    observedHint,
    confirmedTerrainType: confirmed ? systemTile.terrainType : existing?.confirmedTerrainType,
    confirmedRiskLevel: confirmed ? systemTile.trueRiskLevel : existing?.confirmedRiskLevel,
    confirmedPassability: confirmed ? systemTile.passability : existing?.confirmedPassability,
    playerRecordedRisk: recorded ? systemTile.trueRiskLevel : existing?.playerRecordedRisk,
    playerNotes: notes,
    isRouteMarked: stateValue === 'route_connected' || existing?.isRouteMarked === true,
    hasEncounterHint: systemTile.encounterId !== null,
    state: nextState,
    observedTerrain: confirmed ? systemTile.terrainType : existing?.observedTerrain,
    observedRisk: confirmed ? systemTile.trueRiskLevel : existing?.observedRisk,
    observedPassable: confirmed ? systemTile.passability !== 'blocked' : existing?.observedPassable,
    notes,
  });
}

function addNote(notes: string[], note: string): string[] {
  return Array.from(new Set([...notes, note])).slice(-5);
}

export function rankTileState(state: TileState): number {
  return { unknown: 0, observed: 1, scouted: 2, recorded: 3, route_connected: 4 }[state];
}

export function directionLabel(direction: Direction): string {
  return { north: '북쪽', south: '남쪽', east: '동쪽', west: '서쪽' }[direction];
}
