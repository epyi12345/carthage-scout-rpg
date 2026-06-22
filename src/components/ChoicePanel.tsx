export interface ChoiceAction {
  id: string;
  label: string;
  detail?: string;
  variant?: 'default' | 'danger' | 'quiet';
  disabled?: boolean;
  onSelect: () => void;
}

interface Props {
  title: string;
  actions: ChoiceAction[];
  columns?: 1 | 2;
}

export function ChoicePanel({ title, actions, columns = 1 }: Props) {
  return (
    <section className="choice-panel" aria-label={title}>
      <div className="section-heading"><h2>{title}</h2></div>
      <div className={`choice-grid cols-${columns}`}>
        {actions.map((action) => (
          <button className={`choice-card ${action.variant ?? 'default'}`} key={action.id} disabled={action.disabled} onClick={action.onSelect}>
            <strong>{action.label}</strong>
            {action.detail && <span>{action.detail}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
