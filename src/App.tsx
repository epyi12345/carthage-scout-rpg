import { useEffect, useState } from 'react';
import { newGame } from './game/engine';
import { hasSave, loadGame, saveGame } from './game/save';
import type { GameState } from './game/types';
import { GameScreen } from './screens/GameScreen';
import { TitleScreen } from './screens/TitleScreen';

export function App() {
  const [screen, setScreen] = useState<'title' | 'game'>('title');
  const [state, setState] = useState<GameState>(() => loadGame() ?? newGame());
  const [saveExists, setSaveExists] = useState(false);

  useEffect(() => setSaveExists(hasSave()), [screen, state]);

  const startNewGame = (seed?: string) => {
    if (hasSave() && !window.confirm('기존 세이브를 덮어쓰고 새 게임을 시작할까요?')) return;
    const fresh = newGame(seed);
    setState(fresh);
    saveGame(fresh);
    setScreen('game');
  };

  const continueGame = () => {
    const saved = loadGame();
    if (saved) setState(saved);
    setScreen('game');
  };

  if (screen === 'title') return <TitleScreen hasSave={saveExists} onNewGame={startNewGame} onContinue={continueGame} />;
  return <GameScreen state={state} setState={setState} onTitle={() => setScreen('title')} />;
}
