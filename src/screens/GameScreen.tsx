import { useRef, useState } from 'react';
import { InGamePlayScreen } from '../features/ingame/InGamePlayScreen';
import { applyChoice, selectMapDirection } from '../game/encounterEngine';
import { getEncounter } from '../game/encounter';
import { saveGame } from '../game/saveLoad';
import type { DirectionCandidate, EncounterChoice, GameState } from '../game/types';

interface Props { state: GameState; setState: (state: GameState) => void; onTitle: () => void }

interface PendingResult {
  encounterId: string;
  encounterTitle: string;
  text: string;
}

export function GameScreen({ state, setState }: Props) {
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);
  const commandPendingRef = useRef(false);
  const encounter = getEncounter(state.encounter.currentId);

  const handleChoiceSelect = (choice: EncounterChoice) => {
    if (!encounter || commandPendingRef.current) return;
    commandPendingRef.current = true;
    const result = applyChoice(state, choice, encounter.id);
    if (!result.applied) {
      setState({ ...result.state, feedbackMessage: result.reason });
      setPendingResult(null);
      queueMicrotask(() => { commandPendingRef.current = false; });
      return;
    }
    setState(result.state);
    saveGame(result.state);
    setPendingResult(result.resultText ? { encounterId: encounter.id, encounterTitle: encounter.title, text: result.resultText } : null);
    queueMicrotask(() => { commandPendingRef.current = false; });
  };

  const handleMapDirection = (candidate: DirectionCandidate) => {
    if (commandPendingRef.current) return;
    commandPendingRef.current = true;
    const result = selectMapDirection(state, candidate);
    if (result.moved) {
      setState(result.state);
      saveGame(result.state);
    } else {
      setState({ ...result.state, feedbackMessage: result.reason });
    }
    queueMicrotask(() => { commandPendingRef.current = false; });
  };

  return (
    <InGamePlayScreen
      encounter={encounter}
      missingEncounterId={state.encounter.currentId}
      resultText={pendingResult?.text}
      resultEncounterId={pendingResult?.encounterId}
      resultEncounterTitle={pendingResult?.encounterTitle}
      onChoiceSelect={handleChoiceSelect}
      onContinueResult={() => setPendingResult(null)}
      mapState={state.map}
      onSelectMapDirection={handleMapDirection}
      mapMovePending={commandPendingRef.current}
    />
  );
}
