import type { Coordinate, Direction, MapTile, Passability, PlayerMapTile, RiskBand, TerrainType } from './types';

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
  if (terrainType === 'abandoned_camp') return 'enc_abandoned_supplies_001';
  if (terrainType === 'frozen_pass' && rng() < 0.45) return rng() < 0.5 ? 'enc_frozen_ravine_001' : 'enc_distant_smoke_001';
  if ((trueRiskLevel >= 8 || passability === 'blocked') && rng() < 0.5) return rng() < 0.5 ? 'enc_rockfall_001' : 'enc_collapsed_path_001';
  if ((terrainType === 'forest' || terrainType === 'cave') && rng() < 0.35) return terrainType === 'cave' ? 'enc_cave_shelter_001' : 'enc_animal_tracks_001';
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
      if (terrainType === 'abandoned_camp' || terrainType === 'cave' || encounterId === 'enc_abandoned_supplies_001') resourceCount += 1;
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
      tiles[index] = makeTile(tile.id, tile.x, tile.y, 'cliff', 10, 'blocked', true, 'enc_rockfall_001');
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

export function directionLabel(direction: Direction): string {
  return { north: '북쪽', south: '남쪽', east: '동쪽', west: '서쪽' }[direction];
}

export const PARCHMENT_BASE_MAP_ID = 'map_base_alpine_parchment_v0_1';

const PARCHMENT_MAJOR_REGIONS = [
  { id: 'region_western_ridge', x: 23, y: 28, label: '서쪽 능선' },
  { id: 'region_black_forest', x: 34, y: 58, label: '검은 숲' },
  { id: 'region_frozen_pass', x: 61, y: 36, label: '얼어붙은 고개' },
  { id: 'region_northern_objective', x: 54, y: 11, label: '북쪽 통과 후보지' },
];

function pointDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function makePoint(id: string, type: import('./types').MapPointType, x: number, y: number, label: string, encounterId: string | null = null, spacingWeight = 1): import('./types').MapPoint {
  return { id, type, x, y, label, encounterId, internalRef: id, discovered: false, visible: false, influenceRadius: type === 'major_region' ? 13 : 9, spacingWeight };
}

function scatterPoint(rng: () => number, existing: Array<{ x: number; y: number }>, bounds: { minX: number; maxX: number; minY: number; maxY: number }, minDistance: number): { x: number; y: number } {
  let best = { x: bounds.minX + rng() * (bounds.maxX - bounds.minX), y: bounds.minY + rng() * (bounds.maxY - bounds.minY) };
  let bestDistance = 0;
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const candidate = { x: bounds.minX + rng() * (bounds.maxX - bounds.minX), y: bounds.minY + rng() * (bounds.maxY - bounds.minY) };
    const nearest = existing.length ? Math.min(...existing.map((point) => pointDistance(point, candidate))) : minDistance;
    if (nearest >= minDistance) return candidate;
    if (nearest > bestDistance) {
      best = candidate;
      bestDistance = nearest;
    }
  }
  return best;
}

function buildPointRelations(points: import('./types').MapPoint[]): import('./types').MapPointRelation[] {
  return points.flatMap((point) => {
    const nearest = points
      .filter((candidate) => candidate.id !== point.id)
      .map((candidate) => ({ point: candidate, distance: pointDistance(point, candidate) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);
    return nearest.map(({ point: target, distance }) => ({
      fromPointId: point.id,
      toPointId: target.id,
      distance: Number(distance.toFixed(2)),
      densityHint: distance < 15 ? 'dense' : distance > 29 ? 'sparse' : 'normal',
    }));
  });
}

export function generateParchmentSystemMap(seed: string): import('./types').SystemMap {
  const rng = createRng(`${seed}:parchment-points`);
  const points: import('./types').MapPoint[] = [
    makePoint('camp_start', 'fixed_encounter', 50, 90, '카르타고 야영지', null, 2),
    ...PARCHMENT_MAJOR_REGIONS.map((region) => makePoint(region.id, 'major_region', region.x, region.y, region.label, null, 1.4)),
  ];

  const mainEncounters = ['enc_highground_observation_001', 'enc_collapsed_path_001', 'enc_frozen_ravine_001', 'enc_distant_smoke_001'];
  for (const encounterId of mainEncounters) {
    const position = scatterPoint(rng, points, { minX: 18, maxX: 82, minY: 14, maxY: 78 }, 17);
    points.push(makePoint(`main_${encounterId}`, 'main_encounter', Number(position.x.toFixed(2)), Number(position.y.toFixed(2)), '주요 단서', encounterId, 1.8));
  }

  const fixedEncounters = ['enc_dead_scout_001', 'enc_return_route_hazard_001'];
  for (const encounterId of fixedEncounters) {
    const position = scatterPoint(rng, points, { minX: 16, maxX: 84, minY: 18, maxY: 82 }, 15);
    points.push(makePoint(`fixed_${encounterId}`, 'fixed_encounter', Number(position.x.toFixed(2)), Number(position.y.toFixed(2)), '고정 사건', encounterId, 1.5));
  }

  const optionalCount = 5 + Math.floor(rng() * 3);
  const optionalEncounters = ['enc_abandoned_supplies_001', 'enc_cave_shelter_001', 'enc_animal_tracks_001', 'enc_mountain_tribe_traces_001'];
  for (let index = 0; index < optionalCount; index += 1) {
    const position = scatterPoint(rng, points, { minX: 12, maxX: 88, minY: 12, maxY: 86 }, 12);
    const encounterId = optionalEncounters[index % optionalEncounters.length];
    points.push(makePoint(`optional_${index + 1}`, 'optional_resource', Number(position.x.toFixed(2)), Number(position.y.toFixed(2)), index % 2 === 0 ? '자원 흔적' : '선택 단서', encounterId, 1));
  }

  const relations = buildPointRelations(points);
  const relationDistances = relations.map((relation) => relation.distance);
  const averagePointDistance = relationDistances.reduce((sum, distance) => sum + distance, 0) / Math.max(1, relationDistances.length);
  const encounterDensity = Number((points.filter((point) => point.encounterId).length / Math.max(1, averagePointDistance)).toFixed(3));

  return {
    seed,
    baseMapId: PARCHMENT_BASE_MAP_ID,
    points,
    pointRelations: relations,
    spacingMetadata: {
      minPointDistance: Number(Math.min(...relationDistances).toFixed(2)),
      averagePointDistance: Number(averagePointDistance.toFixed(2)),
      encounterDensity,
    },
  };
}

export function tileToParchmentPosition(tileIdValue: string, size = MVP_MAP_SIZE): { x: number; y: number } {
  const { x, y } = parseTileId(tileIdValue);
  return {
    x: Number((((x + 0.5) / size) * 100).toFixed(2)),
    y: Number((((y + 0.5) / size) * 100).toFixed(2)),
  };
}

export function revealParchmentArea(systemMap: import('./types').SystemMap, playerMap: import('./types').PlayerMap, x: number, y: number, radius = 15, source: import('./types').RevealedArea['source'] = 'movement'): import('./types').PlayerMap {
  const areaId = `${source}-${Math.round(x * 10)}-${Math.round(y * 10)}-${Math.round(radius * 10)}`;
  const revealedAreas = playerMap.revealedAreas.some((area) => area.id === areaId) ? playerMap.revealedAreas : [...playerMap.revealedAreas, { id: areaId, x, y, radius, source }];
  const visiblePointIds = systemMap.points.filter((point) => revealedAreas.some((area) => pointDistance(point, area) <= area.radius + point.influenceRadius * 0.3)).map((point) => point.id);
  const discoveredPointIds = Array.from(new Set([...playerMap.discoveredPointIds, ...visiblePointIds]));
  return { ...playerMap, revealedAreas, visiblePointIds, discoveredPointIds };
}

export function createParchmentPlayerMap(systemMap: import('./types').SystemMap, startTileId: string, size = MVP_MAP_SIZE): import('./types').PlayerMap {
  const start = tileToParchmentPosition(startTileId, size);
  return revealParchmentArea(systemMap, { revealedAreas: [], discoveredPointIds: [], visiblePointIds: [], placedMarkers: [], routeNotes: ['출발 지점 주변만 확실히 드러나 있다.'] }, start.x, start.y, 17, 'start');
}

export function placePlayerMarkerOnMap(playerMap: import('./types').PlayerMap, x: number, y: number, type: import('./types').PlayerMarkerType = 'return', note?: string): import('./types').PlayerMap {
  const marker = { id: `marker-${Date.now().toString(36)}-${Math.round(x)}-${Math.round(y)}`, x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), type, note };
  return { ...playerMap, placedMarkers: [...playerMap.placedMarkers, marker].slice(-20) };
}
