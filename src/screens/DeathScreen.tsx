interface Props { reason: string | null; onRestart: () => void; onTitle: () => void }

export function DeathScreen({ reason, onRestart, onTitle }: Props) {
  return (
    <section className="panel end-panel">
      <p className="eyebrow">{reason}</p>
      <h1>눈 속의 따뜻함</h1>
      <p>당신은 눈을 감았다.<br />바람 소리는 멀어지고,<br />몸의 고통도 더는 느껴지지 않았다.</p>
      <p>한니발은 길을 기다렸지만,<br />그 길은 끝내 도착하지 않았다.</p>
      <div className="choices"><button onClick={onRestart}>다시 시작</button><button onClick={onTitle}>타이틀로</button></div>
    </section>
  );
}
