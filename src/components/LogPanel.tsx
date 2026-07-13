interface Props {
  entries: string[];
  feedback?: string | null;
  title?: string;
}

export function LogPanel({ entries, feedback, title = '정찰 기록' }: Props) {
  return (
    <section className="log-panel" aria-label={title}>
      <div className="section-heading">
        <h2>{title}</h2>
        <span>{entries.length} entries</span>
      </div>
      {feedback && <div className="feedback">{feedback}</div>}
      <div className="log-list compact-log">
        {entries.length === 0 ? <p className="muted">아직 기록이 없다.</p> : entries.map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)}
      </div>
    </section>
  );
}
