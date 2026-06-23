import { useEffect, useState } from 'react';
import { newGame } from './game/engine';
import { hasSave, loadGame, saveGame } from './game/save';
import type { GameState } from './game/types';
import { GameScreen } from './screens/GameScreen';
import { MapTestPage } from './features/mapTest/MapTestPage';
import { SplashScreen } from './components/SplashScreen';
import { TitleScreen } from './screens/TitleScreen';

type ThemeMode = 'dark' | 'light';

function isMapTestRoute(): boolean {
  return window.location.hash === '#/map-test' || window.location.pathname.endsWith('/map-test') || new URLSearchParams(window.location.search).has('map-test');
}

export function App() {
  const [screen, setScreen] = useState<'title' | 'game'>('title');
  const [state, setState] = useState<GameState>(() => loadGame() ?? newGame());
  const [saveExists, setSaveExists] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [showSplash, setShowSplash] = useState(true);
  const [isMapTestPage, setIsMapTestPage] = useState(() => isMapTestRoute());

  useEffect(() => setSaveExists(hasSave()), [screen, state]);
  useEffect(() => {
    const syncRoute = () => setIsMapTestPage(isMapTestRoute());
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

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

  const content = isMapTestPage
    ? <MapTestPage />
    : screen === 'title'
      ? <TitleScreen hasSave={saveExists} onNewGame={startNewGame} onContinue={continueGame} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} themeLabel={theme === 'dark' ? '밝은' : '어두운'} />
      : <GameScreen state={state} setState={setState} onTitle={() => setScreen('title')} />;

  return (
    <div className={`app-root theme-${theme}`}>
      {content}
      {showSplash && !isMapTestPage && <SplashScreen onComplete={() => setShowSplash(false)} />}
    </div>
  );
}
