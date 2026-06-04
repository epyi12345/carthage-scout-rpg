interface Props { hasSave: boolean; onNewGame: () => void; onContinue: () => void }

export function TitleScreen({ hasSave, onNewGame, onContinue }: Props) {
  return (
    <main className="phone-shell title-screen">
      <section className="hero-card">
        <p className="eyebrow">Carthage Scout RPG</p>
        <h1>카르타고 정찰대</h1>
        <p>내가 지나갈 수 있는 길이 아니라, 군대가 살아남을 수 있는 길을 그려라.</p>
        <div className="title-actions">
          <button onClick={onNewGame}>새 게임</button>
          <button onClick={onContinue} disabled={!hasSave}>이어하기</button>
        </div>
      </section>
    </main>
  );
}
