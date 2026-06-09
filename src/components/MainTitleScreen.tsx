import { useEffect, useState } from 'react';

export interface MainTitleScreenProps {
  hasSave: boolean;
  onNewGame: (seed?: string) => void;
  onContinue: () => void;
  onToggleTheme: () => void;
  themeLabel: string;
}

type TitleIntroState = 'introFogReveal' | 'touchToStart' | 'mainMenuOpen';
type TitleModal = 'achievements' | 'settings' | null;

const FOG_INTRO_BACKGROUND_SRC = `${import.meta.env.BASE_URL}assets/backgrounds/bg_main_alpine_scout_fog_intro.jpg`;
const CLEAR_BACKGROUND_SRC = `${import.meta.env.BASE_URL}assets/backgrounds/bg_main_alpine_scout_clear.jpg`;

export function MainTitleScreen({ hasSave, onNewGame, onContinue, onToggleTheme, themeLabel }: MainTitleScreenProps) {
  const [seed, setSeed] = useState('hannibal-218');
  const [introState, setIntroState] = useState<TitleIntroState>('introFogReveal');
  const [modal, setModal] = useState<TitleModal>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealCompleteMs = reducedMotion ? 450 : 3200;
    const timer = window.setTimeout(() => setIntroState('touchToStart'), revealCompleteMs);
    return () => window.clearTimeout(timer);
  }, []);

  const revealComplete = introState !== 'introFogReveal';
  const mainMenuOpen = introState === 'mainMenuOpen';

  const handleScreenTap = () => {
    if (introState === 'touchToStart') setIntroState('mainMenuOpen');
  };

  return (
    <main
      className={`title-intro-screen title-state-${introState}`}
      style={{
        '--title-clear-background-image': `url(${CLEAR_BACKGROUND_SRC})`,
        '--title-fog-background-image': `url(${FOG_INTRO_BACKGROUND_SRC})`,
      }}
      onClick={handleScreenTap}
      aria-label="카르타고 정찰대 타이틀 화면"
    >
      <div className="title-bg-layer title-bg-clear" />
      <div className="title-bg-layer title-bg-fog" />
      <div className="title-soft-white-overlay" />
      <div className="title-bottom-gradient" />

      <section className="title-logo-layer" aria-labelledby="main-title">
        <p className="eyebrow title-kicker">Carthage Scout RPG</p>
        <h1 id="main-title">카르타고 정찰대</h1>
        <p className="title-subtitle">내가 지나갈 수 있는 길이 아니라, 군대가 살아남을 수 있는 길을 그려라.</p>
      </section>

      {revealComplete && (
        <div className="title-utility-actions" onClick={(event: { stopPropagation: () => void }) => event.stopPropagation()}>
          <button className="title-utility-button" onClick={() => setModal('achievements')}>Achievements</button>
          <button className="title-utility-button" onClick={() => setModal('settings')}>Settings</button>
        </div>
      )}

      {revealComplete && (
        <button
          className={`touch-to-start ${mainMenuOpen ? 'touch-to-start-muted' : ''}`}
          onClick={(event: { stopPropagation: () => void }) => {
            event.stopPropagation();
            if (!mainMenuOpen) setIntroState('mainMenuOpen');
          }}
        >
          터치하여 시작
        </button>
      )}

      <section
        className={`title-main-menu ${mainMenuOpen ? 'title-main-menu-open' : ''}`}
        aria-hidden={!mainMenuOpen}
        onClick={(event: { stopPropagation: () => void }) => event.stopPropagation()}
      >
        <label className="field seed-field">
          지도 시드
          <input value={seed} onChange={(event: { target: HTMLInputElement }) => setSeed(event.target.value)} placeholder="예: hannibal-218" />
        </label>
        <div className="title-actions">
          <button onClick={() => onNewGame(seed)}>새 게임</button>
          {hasSave && <button onClick={onContinue}>이어하기</button>}
        </div>
        <p className="version-label">MVP v0.1 · Mobile Web Prototype</p>
      </section>

      {modal && (
        <TitleModalView
          modal={modal}
          themeLabel={themeLabel}
          onToggleTheme={onToggleTheme}
          onClose={() => setModal(null)}
        />
      )}
    </main>
  );
}

function TitleModalView({ modal, themeLabel, onToggleTheme, onClose }: { modal: Exclude<TitleModal, null>; themeLabel: string; onToggleTheme: () => void; onClose: () => void }) {
  return (
    <section className="title-modal" role="dialog" aria-modal="true" aria-label={modal === 'achievements' ? 'Achievements' : 'Settings'} onClick={(event: { stopPropagation: () => void }) => event.stopPropagation()}>
      <div className="title-modal-panel">
        {modal === 'achievements' ? (
          <>
            <p className="eyebrow">Achievements</p>
            <h2>업적</h2>
            <p className="note">업적 시스템은 아직 준비 중입니다. 향후 펜던트 보존, 안전 경로 발견, 위험 지형 기록 같은 목표가 이곳에 표시됩니다.</p>
          </>
        ) : (
          <>
            <p className="eyebrow">Settings</p>
            <h2>설정</h2>
            <p className="note">현재 MVP에서는 화면 테마 전환만 지원합니다.</p>
            <button onClick={onToggleTheme}>설정: {themeLabel} 화면</button>
          </>
        )}
        <button className="secondary-action" onClick={onClose}>닫기</button>
      </div>
    </section>
  );
}
