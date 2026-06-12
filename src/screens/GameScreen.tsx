import { useState } from 'react';
import { InGamePlayScreen } from '../features/ingame/InGamePlayScreen';
import { applyChoice } from '../game/encounterEngine';
import { getEncounter } from '../game/encounter';
import { saveGame } from '../game/saveLoad';
import type { EncounterChoice, GameState } from '../game/types';

interface Props { state: GameState; setState: (state: GameState) => void; onTitle: () => void }

interface PendingResult {
  encounterId: string;
  encounterTitle: string;
  text: string;
}

export function GameScreen({ state, setState }: Props) {
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);
  const encounter = getEncounter(state.currentEncounterId);

  const handleChoiceSelect = (choice: EncounterChoice) => {
    if (!encounter) return;
    const nextState = applyChoice(state, choice);
    setState(nextState);
    saveGame(nextState);
    if (choice.resultText) {
      setPendingResult({ encounterId: encounter.id, encounterTitle: encounter.title, text: choice.resultText });
    } else {
      setPendingResult(null);
    }
  };

  return (
    <InGamePlayScreen
      encounter={encounter}
      missingEncounterId={state.currentEncounterId}
      resultText={pendingResult?.text}
      resultEncounterId={pendingResult?.encounterId}
      resultEncounterTitle={pendingResult?.encounterTitle}
      onChoiceSelect={handleChoiceSelect}
      onContinueResult={() => setPendingResult(null)}
    />
  );
}
