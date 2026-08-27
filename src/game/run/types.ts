import type { Ending } from '../state/types';

export interface RunState {
  id: string;
  seed: string;
  maxDays: number;
  actionCount: number;
  slot: number;
  ending: Ending | null;
}
