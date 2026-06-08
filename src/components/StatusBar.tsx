import type { GameState } from '../game/types';
import { StatusPanel } from './StatusPanel';

interface Props { state: GameState }

export function StatusBar({ state }: Props) {
  return <StatusPanel state={state} />;
}
