import { SPECIAL_HINTS, SPECIAL_TITLES } from './mapCopy';
import type { GridPoint, MapTestState, SpecialEncounterNode, SpecialEncounterType } from './mapTypes';

const MAP_SIZE = 30 as const;

type RegionName =
  | 'start_zone'
  | 'buffer_zone'
  | 'central_danger_zone'
  | 'west_tribe_zone'
  | 'east_mountain_zone'
  | 'roman_zone'
  | 'outer_rare_zone';

type RegionBounds = { xMin: number; xMax: number; yMin: number; yMax: number };

type NodePlan = { type: SpecialEncounterType; region: RegionName };

const REGIONS: Record<RegionName, RegionBounds> = {
  start_zone: { xMin: 10, xMax: 20, yMin: 25, yMax: 28 },
  buffer_zone: { xMin: 6, xMax: 23, yMin: 18, yMax: 24 },
  central_danger_zone: { xMin: 6, xMax: 23, yMin: 10, yMax: 20 },
  west_tribe_zone: { xMin: 1, xMax: 10, yMin: 8, yMax: 22 },
  east_mountain_zone: { xMin: 20, xMax: 28, yMin: 8, yMax: 22 },
  roman_zone: { xMin: 8, xMax: 22, yMin: 2, yMax: 6 },
  outer_rare_zone: { xMin: 1, xMax: 28, yMin: 1, yMax: 28 },
};

const NODE_PLANS: NodePlan[] = [
  { type: 'roman_trace', region: 'roman_zone' },
  { type: 'roman_trace', region: 'roman_zone' },
  { type: 'roman_trace', region: 'central_danger_zone' },
  { type: 'roman_trace', region: 'east_mountain_zone' },
  { type: 'village', region: 'west_tribe_zone' },
  { type: 'survivor', region: 'central_danger_zone' },
  { type: 'survivor', region: 'buffer_zone' },
  { type: 'resource', region: 'buffer_zone' },
  { type: 'resource', region: 'central_danger_zone' },
  { type: 'camp_trace', region: 'buffer_zone' },
  { type: 'camp_trace', region: 'central_danger_zone' },
  { type: 'cave', region: 'east_mountain_zone' },
  { type: 'cave', region: 'central_danger_zone' },
  { type: 'cliff', region: 'east_mountain_zone' },
  { type: 'wild_beast', region: 'central_danger_zone' },
  { type: 'wild_beast', region: 'outer_rare_zone' },
  { type: 'trap', region: 'central_danger_zone' },
  { type: 'ravine', region: 'central_danger_zone' },
  { type: 'snowstorm_zone', region: 'east_mountain_zone' },
  { type: 'high_ground', region: 'central_danger_zone' },
  { type: 'tree_view', region: 'east_mountain_zone' },
];

export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)];
}

export function distance(a: GridPoint, b: GridPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function randomPointInRegion(rng: () => number, region: RegionName): GridPoint {
  const bounds = REGIONS[region];
  if (region === 'outer_rare_zone') {
    const side = randomInt(rng, 0, 3);
    if (side === 0) return { x: randomInt(rng, 1, 4), y: randomInt(rng, 1, 28) };
    if (side === 1) return { x: randomInt(rng, 25, 28), y: randomInt(rng, 1, 28) };
    if (side === 2) return { x: randomInt(rng, 1, 28), y: randomInt(rng, 1, 4) };
    return { x: randomInt(rng, 1, 28), y: randomInt(rng, 25, 28) };
  }
  return {
    x: randomInt(rng, Math.max(1, bounds.xMin), Math.min(28, bounds.xMax)),
    y: randomInt(rng, Math.max(1, bounds.yMin), Math.min(28, bounds.yMax)),
  };
}

function isFarEnough(candidate: GridPoint, nodes: SpecialEncounterNode[], start: GridPoint, minDistance: number): boolean {
  if (distance(candidate, start) <= 3) return false;
  return nodes.every((node) => distance(candidate, node.center) >= minDistance);
}

function createNode(idIndex: number, type: SpecialEncounterType, region: RegionName, center: GridPoint, rng: () => number): SpecialEncounterNode {
  return {
    id: `${type}_${idIndex.toString().padStart(2, '0')}`,
    type,
    center,
    footprintSize: 3,
    detectionRadius: type === 'high_ground' || type === 'tree_view' ? 5 : 3,
    activationRadius: 1,
    region,
    title: pick(rng, SPECIAL_TITLES[type]),
    hint: pick(rng, SPECIAL_HINTS[type]),
    discovered: false,
    visited: false,
    recorded: false,
  };
}

function placeNode(idIndex: number, type: SpecialEncounterType, region: RegionName, nodes: SpecialEncounterNode[], start: GridPoint, rng: () => number): SpecialEncounterNode {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const center = randomPointInRegion(rng, region);
    if (isFarEnough(center, nodes, start, attempt < 50 ? 6 : 5)) return createNode(idIndex, type, region, center, rng);
  }

  for (let y = 2; y < MAP_SIZE - 2; y += 1) {
    for (let x = 2; x < MAP_SIZE - 2; x += 1) {
      const center = { x, y };
      if (isFarEnough(center, nodes, start, 5)) return createNode(idIndex, type, region, center, rng);
    }
  }

  return createNode(idIndex, type, region, randomPointInRegion(rng, region), rng);
}

export function createRandomMapTestSeed(): string {
  return `map-${Date.now().toString(36)}-${Math.floor(Math.random() * 9999).toString(36)}`;
}

export function generateMapTestState(seed: string): MapTestState {
  const normalizedSeed = seed.trim() || 'carthage-map-test';
  const rng = createRng(normalizedSeed);
  const playerPosition = randomPointInRegion(rng, 'start_zone');
  const specialNodes: SpecialEncounterNode[] = [];

  const romanCampCenter = randomPointInRegion(rng, 'roman_zone');
  const romanCamp = createNode(1, 'roman_camp', 'roman_zone', romanCampCenter, rng);
  romanCamp.id = 'roman_camp_01';
  specialNodes.push(romanCamp);

  NODE_PLANS.forEach((plan, index) => {
    specialNodes.push(placeNode(index + 2, plan.type, plan.region, specialNodes, playerPosition, rng));
  });

  return {
    seed: normalizedSeed,
    size: MAP_SIZE,
    playerPosition,
    romanCampId: romanCamp.id,
    specialNodes,
    discoveredPath: [playerPosition],
    visitedNodeIds: [],
    recordedNodeIds: [],
    travelQueue: [],
    travelStepIndex: 0,
  };
}

export function getFootprintCells(node: SpecialEncounterNode): GridPoint[] {
  const cells: GridPoint[] = [];
  for (let y = node.center.y - 1; y <= node.center.y + 1; y += 1) {
    for (let x = node.center.x - 1; x <= node.center.x + 1; x += 1) {
      if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) cells.push({ x, y });
    }
  }
  return cells;
}
