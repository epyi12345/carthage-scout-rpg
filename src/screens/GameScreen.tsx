import { useState } from 'react';
import { BottomNav } from '../components/BottomNav';
import { ChoicePanel } from '../components/ChoicePanel';
import { DevPanel } from '../components/DevPanel';
import { EncounterView } from '../components/EncounterView';
import { InGameFrame } from '../components/InGameFrame';
import { InventoryView } from '../components/InventoryView';
import { LogPanel } from '../components/LogPanel';
import { MapView } from '../components/MapView';
import { TopStatusBar } from '../components/TopStatusBar';
import { getEncounter } from '../game/encounter';
import { applyChoice, markRouteTile, movePlayer, newGame, observeTile, placePlayerMarker, recordTile, rest, returnToCamp } from '../game/engine';
import { directionLabel, getNeighbors } from '../game/map';
import { saveGame } from '../game/save';
import type { EncounterChoice, GameState, TabId } from '../game/types';
import { DeathScreen } from './DeathScreen';

interface Props { state: GameState; setState: (state: GameState) => void; onTitle: () => void }

export function GameScreen({ state, setState, onTitle }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('story');
  const [selectedTileId, setSelectedTileId] = useState(state.player.position);
  const [confirmReturn, setConfirmReturn] = useState(false);
  const encounter = getEncounter(state.currentEncounterId);
  const neighbors = getNeighbors(state.player.position, state.mapSize);

  const updateState = (next: GameState, shouldSave = true) => {
    setState(next);
    setSelectedTileId(next.player.position);
    setConfirmReturn(false);
    if (shouldSave) saveGame(next);
  };

  const choose = (choice: EncounterChoice) => updateState(applyChoice(state, choice));
  const restart = () => updateState(newGame(state.mapSeed));
  const mapActions = {
    onObserveTile: (tileId: string) => updateState(observeTile(state, tileId)),
    onRecordTile: (tileId: string) => updateState(recordTile(state, tileId)),
    onMarkRouteTile: (tileId: string) => updateState(markRouteTile(state, tileId)),
    onPlaceMarker: (x: number, y: number) => updateState(placePlayerMarker(state, x, y)),
  };

  let content = null;
  if (activeTab === 'map') content = <MapView state={state} selectedTileId={selectedTileId} onSelectTile={setSelectedTileId} {...mapActions} />;
  if (activeTab === 'inventory') content = <InventoryView state={state} />;
  if (activeTab === 'dev') content = <DevPanel state={state} onStateChange={updateState} />;
  if (activeTab === 'story') {
    if (state.isDead) content = <DeathScreen reason={state.deathReason} onRestart={restart} onTitle={onTitle} />;
    else if (state.ending) content = <EndingPanel state={state} onRestart={restart} onTitle={onTitle} />;
    else if (encounter) content = <EncounterView encounter={encounter} state={state} onChoose={choose} />;
    else if (confirmReturn) content = <ReturnConfirmation state={state} onCancel={() => setConfirmReturn(false)} onConfirm={() => updateState(returnToCamp(state))} />;
    else content = <ActionPanel state={state} neighbors={neighbors} selectedTileId={selectedTileId} onSelectTile={setSelectedTileId} onMove={(direction) => updateState(movePlayer(state, direction))} onObserve={(tileId) => updateState(observeTile(state, tileId))} onRecord={(tileId) => updateState(recordTile(state, tileId))} onRest={() => updateState(rest(state))} onReturn={() => setConfirmReturn(true)} {...mapActions} />;
  }

  return (
    <InGameFrame
      statusSlot={<TopStatusBar state={state} />}
      navigationSlot={<BottomNav activeTab={activeTab} onTabChange={setActiveTab} mapUnlocked />}
    >
      {content}
    </InGameFrame>
  );
}

function ActionPanel({ state, neighbors, selectedTileId, onSelectTile, onMove, onObserve, onRecord, onRest, onReturn, onObserveTile, onRecordTile, onMarkRouteTile, onPlaceMarker }: {
  state: GameState;
  neighbors: ReturnType<typeof getNeighbors>;
  selectedTileId: string;
  onSelectTile: (tileId: string) => void;
  onMove: (direction: ReturnType<typeof getNeighbors>[number]['direction']) => void;
  onObserve: (tileId: string) => void;
  onRecord: (tileId: string) => void;
  onRest: () => void;
  onReturn: () => void;
  onObserveTile: (tileId: string) => void;
  onRecordTile: (tileId: string) => void;
  onMarkRouteTile: (tileId: string) => void;
  onPlaceMarker: (x: number, y: number) => void;
}) {
  const recordableTiles = state.playerMap.filter((tile) => tile.state !== 'unknown' && tile.state !== 'recorded' && tile.state !== 'route_connected');
  return (
    <>
      <MapView state={state} selectedTileId={selectedTileId} onSelectTile={onSelectTile} onObserveTile={onObserveTile} onRecordTile={onRecordTile} onMarkRouteTile={onMarkRouteTile} onPlaceMarker={onPlaceMarker} />
      <section className="panel story-panel action-panel">
        <p className="eyebrow">MVP 정찰 루프</p>
        <h1>알프스 정찰</h1>
        <p>혼자 지나갈 길이 아니라 한니발의 군대가 살아남을 수 있는 길을 관측하고 기록하라.</p>
        <LogPanel entries={state.lastLog} feedback={state.feedbackMessage} />
        <ChoicePanel title="이동" columns={2} actions={neighbors.map((neighbor) => ({ id: `move-${neighbor.id}`, label: `${directionLabel(neighbor.direction)} 이동`, detail: neighbor.id, onSelect: () => onMove(neighbor.direction) }))} />
        <ChoicePanel title="관측" columns={2} actions={neighbors.map((neighbor) => ({ id: `observe-${neighbor.id}`, label: `${neighbor.id} 관측`, detail: '임시 단서 확인', onSelect: () => onObserve(neighbor.id) }))} />
        <ChoicePanel title="빠른 기록" columns={2} actions={[{ id: 'record-current', label: '현재 타일 기록', detail: state.player.position, onSelect: () => onRecord(state.player.position) }, ...recordableTiles.slice(0, 3).map((tile) => ({ id: `record-${tile.id}`, label: `${tile.id} 기록`, detail: tile.playerKnowledgeState, onSelect: () => onRecord(tile.id) }))]} />
        <ChoicePanel title="생존 / 복귀" actions={[{ id: 'rest', label: '휴식', detail: '식량을 쓰고 체온/피로 회복', onSelect: onRest }, { id: 'return', label: '야영지로 복귀', detail: '현재 지도 품질로 평가받기', variant: 'danger', onSelect: onReturn }]} />
      </section>
    </>
  );
}

function ReturnConfirmation({ state, onCancel, onConfirm }: { state: GameState; onCancel: () => void; onConfirm: () => void }) {
  const recordedTiles = state.playerMap.filter((tile) => tile.playerKnowledgeState === 'recorded' || tile.playerKnowledgeState === 'route_connected').length;
  const routeTiles = state.playerMap.filter((tile) => tile.playerKnowledgeState === 'route_connected').length;
  return (
    <section className="panel end-panel return-confirmation">
      <p className="eyebrow">복귀 확인</p>
      <h1>이 지도 그대로 돌아갈까?</h1>
      <p>복귀는 허용된다. 하지만 기록되지 않은 관측과 불확실한 경로는 한니발군 평가에 거의 반영되지 않는다.</p>
      <div className="score-card">
        <span>현재 위치: {state.player.position}</span>
        <span>기록 타일: {recordedTiles}</span>
        <span>경로 후보: {routeTiles}</span>
        <span>체력/체온/피로: {state.player.health}/{state.player.warmth}/{state.player.fatigue}</span>
      </div>
      <ChoicePanel title="복귀 결정" actions={[{ id: 'cancel', label: '계속 정찰한다', onSelect: onCancel }, { id: 'confirm', label: '복귀하고 평가받기', variant: 'danger', onSelect: onConfirm }]} />
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
      <ChoicePanel title="다음" actions={[{ id: 'restart', label: '같은 시드로 다시 시작', onSelect: onRestart }, { id: 'title', label: '타이틀로', onSelect: onTitle }]} />
    </section>
  );
}
