import { InGamePlayScreen } from '../features/ingame/InGamePlayScreen';
import type { GameState } from '../game/types';

interface Props { state: GameState; setState: (state: GameState) => void; onTitle: () => void }

export function GameScreen(_props: Props) {
  return <InGamePlayScreen />;
}
