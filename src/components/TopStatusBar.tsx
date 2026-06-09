import { StatusPanel } from './StatusPanel';
import type { GameState } from '../game/types';

interface Props { state: GameState }

export function TopStatusBar({ state }: Props) {
  // TODO(ui-v0.2): Replace the MVP StatusPanel once the final compact top HUD layout is approved.
  return <StatusPanel state={state} />;
}
