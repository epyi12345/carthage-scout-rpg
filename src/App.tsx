import { useEffect, useState } from 'react';
import { newGame } from './game/engine';
import { hasSave, loadGame, saveGame } from './game/save';
import type { GameState } from './game/types';
import { GameScreen } from './screens/GameScreen';
import { SplashScreen } from './components/SplashScreen';
import { TitleScreen } from './screens/TitleScreen';

type ThemeMode = 'dark' | 'light';

export function App() {
  const [screen, setScreen] = useState<'title' | 'game'>('title');
  const [state, setState] = useState<GameState>(() => loadGame() ?? newGame());
  const [saveExists, setSaveExists] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [showSplash, setShowSplash] = useState(true);

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

  const content = screen === 'title'
    ? <TitleScreen hasSave={saveExists} onNewGame={startNewGame} onContinue={continueGame} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} themeLabel={theme === 'dark' ? '밝은' : '어두운'} />
    : <GameScreen state={state} setState={setState} onTitle={() => setScreen('title')} />;

  return (
    <div className={`app-root theme-${theme}`}>
      <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
      {content}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
    </div>
  );
}
