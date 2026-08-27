import type { Encounter, EncounterChoice, GameState } from '../game/types';
import { ChoicePanel } from './ChoicePanel';
import { LogPanel } from './LogPanel';

interface Props { encounter: Encounter; state: GameState; onChoose: (choice: EncounterChoice) => void }

export function EncounterView({ encounter, state, onChoose }: Props) {
  return (
    <section className="panel story-panel encounter-layout">
      <p className="eyebrow">{encounter.category} · {encounter.id}</p>
      <h1>{encounter.title}</h1>
      <div className="story-body">{(encounter.description ?? encounter.body).split('\n').map((line, index) => line ? <p key={index}>{line}</p> : <br key={index} />)}</div>
      {encounter.description && <p className="muted encounter-body">{encounter.body}</p>}
      <LogPanel entries={state.logs.map((entry) => entry.message).slice(0, 3)} feedback={state.feedbackMessage} title="최근 정찰 기록" />
      <ChoicePanel
        title="대응 선택"
        actions={encounter.choices.map((choice) => ({
          id: choice.id,
          label: choice.text,
          detail: choice.logMessage,
          disabled: choice.disabled,
          onSelect: () => onChoose(choice),
        }))}
      />
    </section>
  );
}
