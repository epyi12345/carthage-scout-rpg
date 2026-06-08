import type { Encounter, EncounterChoice, GameState } from '../game/types';
import { ChoiceButton } from './ChoiceButton';

interface Props { encounter: Encounter; state: GameState; onChoose: (choice: EncounterChoice) => void }

export function EncounterView({ encounter, state, onChoose }: Props) {
  return (
    <section className="panel story-panel">
      <p className="eyebrow">{encounter.id}</p>
      <h1>{encounter.title}</h1>
      <div className="story-body">{encounter.body.split('\n').map((line, index) => line ? <p key={index}>{line}</p> : <br key={index} />)}</div>
      {state.feedbackMessage && <div className="feedback">{state.feedbackMessage}</div>}
      <div className="choices">
        {encounter.choices.map((choice) => <ChoiceButton key={choice.id} choice={choice} onChoose={onChoose} />)}
      </div>
    </section>
  );
}
