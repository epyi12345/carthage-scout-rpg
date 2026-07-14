import { useState } from 'react';
import { generateMapTestState } from './mapGenerator';
import { getDirectionCandidates } from './mapLogic';
import type { MapRunState } from './mapTypes';

export function createMapRun(seed: string): MapRunState {
  return generateMapTestState(seed);
}

export function useMapRun(initialSeed: string) {
  const [mapState, setMapState] = useState<MapRunState>(() => createMapRun(initialSeed));
  const candidates = mapState.currentTargetId ? [] : getDirectionCandidates(mapState);

  return { mapState, setMapState, candidates };
}
