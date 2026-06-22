import { useState } from 'react';
import { generateMapTestState, createRandomMapTestSeed, getFootprintCells } from './mapTestGenerator';
import {
  advanceTravel,
  cancelTravel,
  getCurrentNode,
  getDirectionCandidates,
  pointToPercent,
  recordCurrentNode,
  selectDirectionCandidate,
} from './mapTestLogic';
import type { DirectionCandidate, MapTestState, SpecialEncounterNode } from './mapTestTypes';
import './MapTestPage.css';

function nodeClassName(node: SpecialEncounterNode, isCurrentTarget: boolean): string {
  return [
    'map-test-node',
    `map-test-node-${node.type}`,
    node.visited ? 'visited' : '',
    node.recorded ? 'recorded' : '',
    isCurrentTarget ? 'current-target' : '',
  ].filter(Boolean).join(' ');
}

function getNodeGlyph(node: SpecialEncounterNode): string {
  if (node.type === 'roman_camp') return 'R';
  if (node.type === 'roman_trace') return 'r';
  if (node.recorded) return '◆';
  if (node.visited) return '●';
  return '?';
}

function shouldShowNode(node: SpecialEncounterNode, debugMode: boolean): boolean {
  return debugMode || node.discovered || node.visited || node.recorded;
}

function makePathPoints(state: MapTestState): string {
  return state.discoveredPath
    .map((point) => {
      const percent = pointToPercent(point);
      return `${percent.x},${percent.y}`;
    })
    .join(' ');
}

export function MapTestPage() {
  const [seedInput, setSeedInput] = useState('hannibal-map-test');
  const [state, setState] = useState(() => generateMapTestState('hannibal-map-test'));
  const [debugMode, setDebugMode] = useState(false);
  const candidates = state.currentTargetId ? [] : getDirectionCandidates(state);
  const currentNode = getCurrentNode(state);
  const currentTravel = state.currentTargetId ? state.travelQueue[state.travelStepIndex] : undefined;
  const romanTraceCount = state.specialNodes.filter((node) => node.type === 'roman_trace' && (node.discovered || node.visited || node.recorded)).length;

  const regenerate = () => setState(generateMapTestState(seedInput));
  const randomSeed = () => {
    const nextSeed = createRandomMapTestSeed();
    setSeedInput(nextSeed);
    setState(generateMapTestState(nextSeed));
  };
  const chooseCandidate = (candidate: DirectionCandidate) => setState((current) => selectDirectionCandidate(current, candidate));
  const returnToStart = () => setState((current) => ({
    ...cancelTravel(current),
    playerPosition: current.discoveredPath[0],
    discoveredPath: [current.discoveredPath[0]],
  }));

  return (
    <main className="map-test-page-v2" aria-label="방향 선택형 지도 테스트 페이지">
      <section className="map-test-shell">
        <header className="map-test-header-v2">
          <p className="map-test-eyebrow">Directional Map Prototype</p>
          <h1>Map Test</h1>
          <label className="map-test-seed-field">
            <span>Seed</span>
            <input value={seedInput} onChange={(event: { target: { value: string } }) => setSeedInput(event.target.value)} />
          </label>
          <div className="map-test-toolbar">
            <button type="button" onClick={regenerate}>Regenerate</button>
            <button type="button" onClick={randomSeed}>Random Seed</button>
            <button type="button" className={debugMode ? 'active' : ''} onClick={() => setDebugMode((value) => !value)}>Debug Mode</button>
          </div>
        </header>

        <section className={`map-test-parchment ${debugMode ? 'debug' : ''}`} aria-label="양피지 지도">
          {debugMode && <div className="map-test-grid" aria-hidden="true" />}
          {debugMode && state.specialNodes.flatMap((node) => getFootprintCells(node).map((cell) => {
            const percent = pointToPercent(cell);
            return <span key={`${node.id}-${cell.x}-${cell.y}`} className="map-test-footprint" style={{ left: `${percent.x}%`, top: `${percent.y}%` }} />;
          }))}

          <svg className="map-test-path-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {state.discoveredPath.length > 1 && <polyline points={makePathPoints(state)} fill="none" stroke="rgba(65, 38, 16, 0.72)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />}
          </svg>

          {state.specialNodes.filter((node) => shouldShowNode(node, debugMode)).map((node) => {
            const percent = pointToPercent(node.center);
            const isCurrentTarget = node.id === state.currentTargetId || candidates.some((candidate) => candidate.nodeId === node.id);
            return (
              <span
                key={node.id}
                className={nodeClassName(node, isCurrentTarget)}
                style={{ left: `${percent.x}%`, top: `${percent.y}%` }}
                title={`${node.id} · ${node.type}`}
              >
                {debugMode ? <small>{node.type}</small> : getNodeGlyph(node)}
              </span>
            );
          })}

          <span className="map-test-start-marker" style={{ left: `${pointToPercent(state.discoveredPath[0]).x}%`, top: `${pointToPercent(state.discoveredPath[0]).y}%` }}>S</span>
          <span className="map-test-player-marker-v2" style={{ left: `${pointToPercent(state.playerPosition).x}%`, top: `${pointToPercent(state.playerPosition).y}%` }}>P</span>
        </section>

        <section className="map-test-status-v2" aria-label="현재 지도 테스트 상태">
          <div><span>현재 위치</span><strong>{state.playerPosition.x}, {state.playerPosition.y}</strong></div>
          <div><span>진행 방향</span><strong>{state.currentHeading ?? '없음'}</strong></div>
          <div><span>현재 목표</span><strong>{state.currentTargetId ?? '없음'}</strong></div>
          <div><span>이동 단계</span><strong>{state.currentTargetId ? `${state.travelStepIndex + 1}/${Math.max(1, state.travelQueue.length)}` : '대기'}</strong></div>
          <div><span>방문 노드</span><strong>{state.visitedNodeIds.length}</strong></div>
          <div><span>기록 노드</span><strong>{state.recordedNodeIds.length}</strong></div>
          <div><span>로마군 단서</span><strong>{romanTraceCount}</strong></div>
          <div><span>전체 노드</span><strong>{state.specialNodes.length}</strong></div>
        </section>

        <section className="map-test-action-panel" aria-label="방향 선택과 이동 진행">
          {currentTravel ? (
            <article className="map-test-travel-card">
              <p>{currentTravel.type}</p>
              <h2>{currentTravel.title}</h2>
              <p>{currentTravel.body}</p>
              {currentTravel.canTriggerDirectionChoice && <em>이 지점에서는 주변을 다시 살펴 방향을 바꿀 수 있습니다.</em>}
            </article>
          ) : currentNode ? (
            <article className="map-test-travel-card reached">
              <p>{currentNode.type}</p>
              <h2>{currentNode.title}</h2>
              <p>{currentNode.hint}</p>
              <em>{currentNode.recorded ? '지도에 기록된 지점입니다.' : '도착했습니다. 기록할 수 있습니다.'}</em>
            </article>
          ) : (
            <p className="map-test-help">방위와 단서를 골라 정찰 방향을 정하세요. 지도는 이동 결과와 발견한 흔적만 기록합니다.</p>
          )}

          {state.currentTargetId ? (
            <div className="map-test-choice-stack">
              <button type="button" onClick={() => setState((current) => advanceTravel(current))}>계속 전진</button>
              <button type="button" onClick={() => setState((current) => cancelTravel(current))}>주변을 다시 살핀다</button>
              <button type="button" onClick={returnToStart}>회군 테스트</button>
            </div>
          ) : (
            <div className="map-test-choice-stack">
              {candidates.map((candidate) => (
                <button type="button" key={candidate.nodeId} onClick={() => chooseCandidate(candidate)}>
                  <span>{candidate.label}</span>
                  <small>거리 {candidate.distance} · {candidate.nodeId}</small>
                </button>
              ))}
              {currentNode && !currentNode.recorded && <button type="button" className="record" onClick={() => setState((current) => recordCurrentNode(current))}>기록한다</button>}
              <button type="button" onClick={returnToStart}>회군 테스트</button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
