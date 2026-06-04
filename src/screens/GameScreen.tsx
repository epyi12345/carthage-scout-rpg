import { useState } from 'react';
import { BottomNav } from '../components/BottomNav';
import { DevPanel } from '../components/DevPanel';
import { EncounterView } from '../components/EncounterView';
import { InventoryView } from '../components/InventoryView';
import { MapView } from '../components/MapView';
import { StatusBar } from '../components/StatusBar';
import { getEncounter } from '../game/encounter';
import { applyChoice, newGame } from '../game/engine';
import { saveGame } from '../game/save';
import type { EncounterChoice, GameState, TabId } from '../game/types';
import { DeathScreen } from './DeathScreen';
import { TutorialCompleteScreen } from './TutorialCompleteScreen';

interface Props { state: GameState; setState: (state: GameState) => void; onTitle: () => void }

export function GameScreen({ state, setState, onTitle }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('story');
  const encounter = getEncounter(state.currentEncounterId);

  const updateState = (next: GameState, shouldSave = true) => {
    setState(next);
    if (shouldSave) saveGame(next);
  };

  const choose = (choice: EncounterChoice) => updateState(applyChoice(state, choice));
  const restart = () => updateState(newGame());

  let content = null;
  if (activeTab === 'map') content = <MapView state={state} />;
  if (activeTab === 'inventory') content = <InventoryView state={state} />;
  if (activeTab === 'dev') content = <DevPanel state={state} onStateChange={updateState} />;
  if (activeTab === 'story') {
    if (state.isDead) content = <DeathScreen reason={state.deathReason} onRestart={restart} onTitle={onTitle} />;
    else if (state.tutorialComplete) content = <TutorialCompleteScreen onState={() => setActiveTab('inventory')} onMap={() => setActiveTab('map')} onTitle={onTitle} />;
    else content = encounter ? <EncounterView encounter={encounter} state={state} onChoose={choose} /> : <section className="panel"><h1>인카운터 없음</h1></section>;
  }

  return (
    <main className="phone-shell game-shell">
      <StatusBar state={state} />
      <div className="content-area">{content}</div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} mapUnlocked={state.mapUnlocked} />
    </main>
  );
}
