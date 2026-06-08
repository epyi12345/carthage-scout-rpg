import { useState } from 'react';
import { BottomNav } from '../components/BottomNav';
import { DevPanel } from '../components/DevPanel';
import { EncounterView } from '../components/EncounterView';
import { InventoryView } from '../components/InventoryView';
import { MapView } from '../components/MapView';
import { StatusBar } from '../components/StatusBar';
import { getEncounter } from '../game/encounter';
import { applyChoice, markRouteTile, movePlayer, newGame, observeTile, recordTile, rest, returnToCamp } from '../game/engine';
import { directionLabel, getNeighbors } from '../game/map';
import { saveGame } from '../game/save';
import type { EncounterChoice, GameState, TabId } from '../game/types';
import { DeathScreen } from './DeathScreen';

interface Props { state: GameState; setState: (state: GameState) => void; onTitle: () => void }

export function GameScreen({ state, setState, onTitle }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('story');
  const [selectedTileId, setSelectedTileId] = useState(state.player.position);
  const encounter = getEncounter(state.currentEncounterId);
  const neighbors = getNeighbors(state.player.position, state.mapSize);

  const updateState = (next: GameState, shouldSave = true) => {
    setState(next);
    setSelectedTileId(next.player.position);
    if (shouldSave) saveGame(next);
  };

  const choose = (choice: EncounterChoice) => updateState(applyChoice(state, choice));
  const restart = () => updateState(newGame(state.mapSeed));

  let content = null;
  if (activeTab === 'map') content = <MapView state={state} selectedTileId={selectedTileId} onSelectTile={setSelectedTileId} onObserveTile={(tileId) => updateState(observeTile(state, tileId))} onRecordTile={(tileId) => updateState(recordTile(state, tileId))} onMarkRouteTile={(tileId) => updateState(markRouteTile(state, tileId))} />;
  if (activeTab === 'inventory') content = <InventoryView state={state} />;
  if (activeTab === 'dev') content = <DevPanel state={state} onStateChange={updateState} />;
  if (activeTab === 'story') {
    if (state.isDead) content = <DeathScreen reason={state.deathReason} onRestart={restart} onTitle={onTitle} />;
    else if (state.ending) content = <EndingPanel state={state} onRestart={restart} onTitle={onTitle} />;
    else if (encounter) content = <EncounterView encounter={encounter} state={state} onChoose={choose} />;
    else content = <ActionPanel state={state} neighbors={neighbors} onMove={(direction) => updateState(movePlayer(state, direction))} onObserve={(tileId) => updateState(observeTile(state, tileId))} onRecord={(tileId) => updateState(recordTile(state, tileId))} onRest={() => updateState(rest(state))} onReturn={() => updateState(returnToCamp(state))} />;
  }

  return (
    <main className="phone-shell game-shell">
      <StatusBar state={state} />
      <div className="content-area">{content}</div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} mapUnlocked />
    </main>
  );
}

function ActionPanel({ state, neighbors, onMove, onObserve, onRecord, onRest, onReturn }: {
  state: GameState;
  neighbors: ReturnType<typeof getNeighbors>;
  onMove: (direction: ReturnType<typeof getNeighbors>[number]['direction']) => void;
  onObserve: (tileId: string) => void;
  onRecord: (tileId: string) => void;
  onRest: () => void;
  onReturn: () => void;
}) {
  const recordableTiles = state.playerMap.filter((tile) => tile.state !== 'unknown' && tile.state !== 'recorded' && tile.state !== 'route_connected');
  return (
    <section className="panel story-panel">
      <p className="eyebrow">MVP 정찰 루프</p>
      <h1>알프스 정찰</h1>
      <p>목표는 혼자 살아남는 길이 아니라 한니발의 군대가 살아남을 수 있는 길을 찾고 기록하는 것이다.</p>
      {state.feedbackMessage && <div className="feedback">{state.feedbackMessage}</div>}
      <div className="log-list">
        {state.lastLog.map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)}
      </div>
      <h2>이동</h2>
      <div className="choices two-col">
        {neighbors.map((neighbor) => <button key={neighbor.id} onClick={() => onMove(neighbor.direction)}>{directionLabel(neighbor.direction)} 이동 ({neighbor.id})</button>)}
      </div>
      <h2>관측</h2>
      <div className="choices two-col">
        {neighbors.map((neighbor) => <button key={neighbor.id} onClick={() => onObserve(neighbor.id)}>{neighbor.id} 관측</button>)}
      </div>
      <h2>기록</h2>
      <div className="choices two-col">
        <button onClick={() => onRecord(state.player.position)}>현재 타일 기록</button>
        {recordableTiles.slice(0, 4).map((tile) => <button key={tile.id} onClick={() => onRecord(tile.id)}>{tile.id} 기록</button>)}
      </div>
      <div className="choices">
        <button onClick={onRest}>휴식</button>
        <button className="primary-danger" onClick={onReturn}>야영지로 복귀하고 평가받기</button>
      </div>
    </section>
  );
}

function EndingPanel({ state, onRestart, onTitle }: { state: GameState; onRestart: () => void; onTitle: () => void }) {
  if (!state.ending) return null;
  return (
    <section className="panel end-panel">
      <p className="eyebrow">귀환 평가</p>
      <h1>{state.ending.title}</h1>
      <p>{state.ending.body}</p>
      <div className="score-card">
        <strong>총점 {state.ending.score.total}</strong>
        {state.ending.details.map((detail) => <span key={detail}>{detail}</span>)}
      </div>
      <div className="choices"><button onClick={onRestart}>같은 시드로 다시 시작</button><button onClick={onTitle}>타이틀로</button></div>
    </section>
  );
}
