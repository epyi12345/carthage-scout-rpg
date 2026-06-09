import { useState } from 'react';

interface Props { hasSave: boolean; onNewGame: (seed?: string) => void; onContinue: () => void; onToggleTheme: () => void; themeLabel: string }

const TITLE_BACKGROUND_SRC = `${import.meta.env.BASE_URL}assets/backgrounds/bg_main_alpine_scout_snowstorm.jpg`;

export function TitleScreen({ hasSave, onNewGame, onContinue, onToggleTheme, themeLabel }: Props) {
  const [seed, setSeed] = useState('hannibal-218');
  return (
    <main
      className="title-screen title-main-screen"
      style={{ '--title-background-image': `url(${TITLE_BACKGROUND_SRC})` }}
    >
      <section className="title-main-panel" aria-labelledby="main-title">
        <p className="eyebrow title-kicker">Carthage Scout RPG</p>
        <h1 id="main-title">카르타고 정찰대</h1>
        <p className="title-subtitle">내가 지나갈 수 있는 길이 아니라, 군대가 살아남을 수 있는 길을 그려라.</p>
        <label className="field seed-field">
          지도 시드
          <input value={seed} onChange={(event: { target: HTMLInputElement }) => setSeed(event.target.value)} placeholder="예: hannibal-218" />
        </label>
        <div className="title-actions">
          <button onClick={() => onNewGame(seed)}>새 정찰 시작</button>
          <button onClick={onContinue} disabled={!hasSave}>이어하기</button>
          <button className="secondary-action" onClick={onToggleTheme}>설정: {themeLabel} 화면</button>
        </div>
        <p className="version-label">MVP v0.1 · Mobile Web Prototype</p>
      </section>
    </main>
  );
}
