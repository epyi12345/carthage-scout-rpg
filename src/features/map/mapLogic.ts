import { BEARING_LABELS, TRAVEL_COPY } from './mapCopy';
import { createRng, distance } from './mapGenerator';
import type { Bearing, DirectionCandidate, GridPoint, MapTestState, SpecialEncounterNode, TravelEncounter, TravelEncounterType } from './mapTypes';

const BEARING_ORDER: Bearing[] = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
const TRAVEL_TYPES: TravelEncounterType[] = ['snow', 'wild_beast', 'falling_rocks', 'lost_path', 'supply_loss', 'return_warning', 'viewpoint', 'camp_trace'];

function angleToBearing(dx: number, dy: number): Bearing {
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const normalized = (angle + 360 + 22.5) % 360;
  const index = Math.floor(normalized / 45) % 8;
  return BEARING_ORDER[index];
}

function bearingDistance(a: Bearing, b: Bearing): number {
  const ai = BEARING_ORDER.indexOf(a);
  const bi = BEARING_ORDER.indexOf(b);
  const raw = Math.abs(ai - bi);
  return Math.min(raw, BEARING_ORDER.length - raw);
}

export function pointToPercent(point: GridPoint): { x: number; y: number } {
  return { x: (point.x / 29) * 100, y: (point.y / 29) * 100 };
}

export function getBearing(from: GridPoint, to: GridPoint): Bearing {
  return angleToBearing(to.x - from.x, to.y - from.y);
}

function toCandidate(state: MapTestState, node: SpecialEncounterNode): DirectionCandidate {
  const bearing = getBearing(state.playerPosition, node.center);
  return {
    nodeId: node.id,
    bearing,
    distance: Number(distance(state.playerPosition, node.center).toFixed(1)),
    label: `${BEARING_LABELS[bearing]}, ${node.hint}`,
    hint: node.hint,
  };
}

function uniqueByBearing(candidates: DirectionCandidate[]): DirectionCandidate[] {
  const byBearing = new Map<Bearing, DirectionCandidate>();
  candidates.forEach((candidate) => {
    const existing = byBearing.get(candidate.bearing);
    if (!existing || candidate.distance < existing.distance) byBearing.set(candidate.bearing, candidate);
  });
  return [...byBearing.values()].sort((a, b) => a.distance - b.distance);
}

export function getDirectionCandidates(state: MapTestState): DirectionCandidate[] {
  const unvisited = state.specialNodes
    .filter((node) => !node.visited)
    .map((node) => toCandidate(state, node))
    .sort((a, b) => a.distance - b.distance);

  const selected: DirectionCandidate[] = [];
  if (state.currentHeading) {
    const headingCandidate = unvisited
      .slice()
      .sort((a, b) => bearingDistance(a.bearing, state.currentHeading!) - bearingDistance(b.bearing, state.currentHeading!) || a.distance - b.distance)[0];
    if (headingCandidate) selected.push(headingCandidate);
  }

  uniqueByBearing(unvisited).forEach((candidate) => {
    if (selected.length >= 3) return;
    if (!selected.some((item) => item.nodeId === candidate.nodeId || item.bearing === candidate.bearing)) selected.push(candidate);
  });

  if (selected.length < 2) {
    state.specialNodes
      .map((node) => toCandidate(state, node))
      .sort((a, b) => a.distance - b.distance)
      .forEach((candidate) => {
        if (selected.length >= 3) return;
        if (!selected.some((item) => item.nodeId === candidate.nodeId)) selected.push(candidate);
      });
  }

  return selected.slice(0, Math.max(2, Math.min(3, selected.length)));
}

export function getTravelEncounterCount(distanceValue: number): number {
  if (distanceValue <= 3) return distanceValue < 2 ? 0 : 1;
  if (distanceValue <= 6) return 1;
  if (distanceValue <= 9) return 2;
  return 3;
}

export function createTravelQueue(seed: string, from: GridPoint, target: SpecialEncounterNode, distanceValue: number): TravelEncounter[] {
  const count = getTravelEncounterCount(distanceValue);
  const rng = createRng(`${seed}:${from.x},${from.y}->${target.id}`);
  const queue: TravelEncounter[] = [];
  for (let index = 0; index < count; index += 1) {
    const type = TRAVEL_TYPES[Math.floor(rng() * TRAVEL_TYPES.length)];
    const copy = TRAVEL_COPY[type];
    queue.push({
      id: `travel_${target.id}_${index + 1}`,
      type,
      title: copy.title,
      body: copy.body,
      canTriggerDirectionChoice: type === 'viewpoint' || type === 'camp_trace',
    });
  }
  return queue;
}

export function selectDirectionCandidate(state: MapTestState, candidate: DirectionCandidate): MapTestState {
  const target = state.specialNodes.find((node) => node.id === candidate.nodeId);
  if (!target) return state;
  const travelQueue = createTravelQueue(state.seed, state.playerPosition, target, candidate.distance);
  const nextState = {
    ...state,
    currentHeading: candidate.bearing,
    currentTargetId: candidate.nodeId,
    travelQueue,
    travelStepIndex: 0,
  };
  return travelQueue.length === 0 ? arriveAtTarget(nextState) : nextState;
}

export function arriveAtTarget(state: MapTestState): MapTestState {
  const target = state.specialNodes.find((node) => node.id === state.currentTargetId);
  if (!target) return state;
  const specialNodes = state.specialNodes.map((node) => node.id === target.id ? { ...node, discovered: true, visited: true } : node);
  return {
    ...state,
    playerPosition: target.center,
    specialNodes,
    discoveredPath: [...state.discoveredPath, target.center],
    visitedNodeIds: state.visitedNodeIds.includes(target.id) ? state.visitedNodeIds : [...state.visitedNodeIds, target.id],
    currentTargetId: undefined,
    travelQueue: [],
    travelStepIndex: 0,
  };
}

export function advanceTravel(state: MapTestState): MapTestState {
  if (!state.currentTargetId) return state;
  if (state.travelQueue.length === 0 || state.travelStepIndex >= state.travelQueue.length - 1) return arriveAtTarget(state);
  return { ...state, travelStepIndex: state.travelStepIndex + 1 };
}

export function cancelTravel(state: MapTestState): MapTestState {
  return { ...state, currentTargetId: undefined, travelQueue: [], travelStepIndex: 0 };
}

export function recordCurrentNode(state: MapTestState): MapTestState {
  const currentNode = state.specialNodes.find((node) => node.visited && node.center.x === state.playerPosition.x && node.center.y === state.playerPosition.y);
  if (!currentNode) return state;
  const specialNodes = state.specialNodes.map((node) => node.id === currentNode.id ? { ...node, recorded: true } : node);
  return {
    ...state,
    specialNodes,
    recordedNodeIds: state.recordedNodeIds.includes(currentNode.id) ? state.recordedNodeIds : [...state.recordedNodeIds, currentNode.id],
  };
}

export function getCurrentNode(state: MapTestState): SpecialEncounterNode | undefined {
  return state.specialNodes.find((node) => node.visited && node.center.x === state.playerPosition.x && node.center.y === state.playerPosition.y);
}
