import { useState } from 'react';

interface Props { hasSave: boolean; onNewGame: (seed?: string) => void; onContinue: () => void }

export function TitleScreen({ hasSave, onNewGame, onContinue }: Props) {
  const [seed, setSeed] = useState('hannibal-218');
  return (
    <main className="phone-shell title-screen">
      <section className="hero-card">
        <p className="eyebrow">Carthage Scout RPG MVP</p>
        <h1>카르타고 정찰대</h1>
        <p>내가 지나갈 수 있는 길이 아니라, 군대가 살아남을 수 있는 길을 그려라.</p>
        <label className="field seed-field">
          지도 시드
          <input value={seed} onChange={(event: { target: HTMLInputElement }) => setSeed(event.target.value)} placeholder="예: hannibal-218" />
        </label>
        <div className="title-actions">
          <button onClick={() => onNewGame(seed)}>새 정찰 시작</button>
          <button onClick={onContinue} disabled={!hasSave}>이어하기</button>
        </div>
      </section>
    </main>
  );
}
