import type { EncounterChoice } from '../game/types';

interface Props { choice: EncounterChoice; onChoose: (choice: EncounterChoice) => void }

export function ChoiceButton({ choice, onChoose }: Props) {
  return <button className="choice-button" onClick={() => onChoose(choice)}>{choice.text}</button>;
}
