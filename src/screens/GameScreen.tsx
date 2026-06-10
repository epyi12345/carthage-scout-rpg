import { useState } from 'react';
import { BottomNav } from '../components/BottomNav';
import { ChoicePanel } from '../components/ChoicePanel';
import { DevPanel } from '../components/DevPanel';
import { EncounterView } from '../components/EncounterView';
import { InGameFrame } from '../components/InGameFrame';
import { InGamePlayScreen, type ChoiceViewModel } from '../features/ingame/InGamePlayScreen';
import { InventoryView } from '../components/InventoryView';
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
    else content = <ActionPanel state={state} neighbors={neighbors} onMove={(direction) => updateState(movePlayer(state, direction))} onObserve={(tileId) => updateState(observeTile(state, tileId))} onRecord={(tileId) => updateState(recordTile(state, tileId))} onRest={() => updateState(rest(state))} onReturn={() => setConfirmReturn(true)} onOpenInventory={() => setActiveTab('inventory')} onOpenSettings={() => setActiveTab('dev')} onOpenAchievements={() => setActiveTab('dev')} />;
  }

  const usesFullPlayFrame = activeTab === 'story' && !state.isDead && !state.ending && !encounter && !confirmReturn;
  if (usesFullPlayFrame) return <>{content}</>;

  return (
    <InGameFrame
      statusSlot={<TopStatusBar state={state} />}
      navigationSlot={<BottomNav activeTab={activeTab} onTabChange={setActiveTab} mapUnlocked />}
    >
      {content}
    </InGameFrame>
  );
}

function ActionPanel({ state, neighbors, onMove, onObserve, onRecord, onRest, onReturn, onOpenInventory, onOpenSettings, onOpenAchievements }: {
  state: GameState;
  neighbors: ReturnType<typeof getNeighbors>;
  onMove: (direction: ReturnType<typeof getNeighbors>[number]['direction']) => void;
  onObserve: (tileId: string) => void;
  onRecord: (tileId: string) => void;
  onRest: () => void;
  onReturn: () => void;
  onOpenInventory: () => void;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
}) {
  const recordableTiles = state.playerMap.filter((tile) => tile.state !== 'unknown' && tile.state !== 'recorded' && tile.state !== 'route_connected');
  const choices: ChoiceViewModel[] = [
    ...neighbors.map((neighbor) => ({ id: `move:${neighbor.direction}`, label: `${directionLabel(neighbor.direction)} 이동` })),
    ...neighbors.map((neighbor) => ({ id: `observe:${neighbor.id}`, label: `${neighbor.id} 관측` })),
    { id: `record:${state.player.position}`, label: `현재 위치 ${state.player.position} 기록` },
    ...recordableTiles.slice(0, 2).map((tile) => ({ id: `record:${tile.id}`, label: `${tile.id} 기록` })),
    { id: 'rest', label: '휴식한다' },
    { id: 'return', label: '야영지로 복귀한다' },
  ];

  const narrative = [
    '눈보라가 잠시 잦아든다.',
    `현재 위치는 ${state.player.position}이다. 체온 ${state.player.warmth}, 체력 ${state.player.health}, 피로 ${state.player.fatigue}.`,
    '멀리서 얼어붙은 절벽의 윤곽이 드러난다.',
    '길을 잘못 들면 다시 돌아오기 어려울 것이다.',
    ...(state.feedbackMessage ? [state.feedbackMessage] : []),
    ...state.lastLog.slice(-2),
  ];

  const handleChoiceSelect = (choiceId: string) => {
    if (choiceId.startsWith('move:')) {
      onMove(choiceId.replace('move:', '') as ReturnType<typeof getNeighbors>[number]['direction']);
      return;
    }
    if (choiceId.startsWith('observe:')) {
      onObserve(choiceId.replace('observe:', ''));
      return;
    }
    if (choiceId.startsWith('record:')) {
      onRecord(choiceId.replace('record:', ''));
      return;
    }
    if (choiceId === 'rest') onRest();
    if (choiceId === 'return') onReturn();
  };

  return (
    <InGamePlayScreen
      narrative={narrative}
      choices={choices}
      onChoiceSelect={handleChoiceSelect}
      onOpenInventory={onOpenInventory}
      onOpenSettings={onOpenSettings}
      onOpenAchievements={onOpenAchievements}
    />
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
