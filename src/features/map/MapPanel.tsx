import { getFootprintCells } from './mapGenerator';
import { getCurrentNode, pointToPercent } from './mapLogic';
import type { DirectionCandidate, MapRunState, SpecialEncounterNode } from './mapTypes';
import './MapPanel.css';

interface MapPanelProps {
  state: MapRunState;
  candidates: DirectionCandidate[];
  isDebug?: boolean;
  onSelectCandidate: (candidate: DirectionCandidate) => void;
  onNextTravelEncounter: () => void;
  onRecordCurrentNode: () => void;
  onCancelTravel?: () => void;
  onReturnToStart?: () => void;
  onClose?: () => void;
  compact?: boolean;
}

function nodeClassName(node: SpecialEncounterNode, isCurrentTarget: boolean): string {
  return [
    'map-panel-node',
    `map-panel-node-${node.type}`,
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

function makePathPoints(state: MapRunState): string {
  return state.discoveredPath
    .map((point) => {
      const percent = pointToPercent(point);
      return `${percent.x},${percent.y}`;
    })
    .join(' ');
}

export function MapPanel({
  state,
  candidates,
  isDebug = false,
  onSelectCandidate,
  onNextTravelEncounter,
  onRecordCurrentNode,
  onCancelTravel,
  onReturnToStart,
  onClose,
  compact = false,
}: MapPanelProps) {
  const currentNode = getCurrentNode(state);
  const currentTravel = state.currentTargetId ? state.travelQueue[state.travelStepIndex] : undefined;
  const romanTraceCount = state.specialNodes.filter((node) => node.type === 'roman_trace' && (node.discovered || node.visited || node.recorded)).length;

  return (
    <section className={`map-panel ${compact ? 'compact' : ''}`} aria-label="정찰 지도 패널" onClick={(event: { stopPropagation: () => void }) => event.stopPropagation()}>
      {onClose && !compact && (
        <button type="button" className="map-panel-close" onClick={onClose} aria-label="지도 닫기">
          닫기
        </button>
      )}

      <section className={`map-panel-parchment ${isDebug ? 'debug' : ''}`} aria-label="양피지 지도">
        {isDebug && <div className="map-panel-grid" aria-hidden="true" />}
        {isDebug && state.specialNodes.flatMap((node) => getFootprintCells(node).map((cell) => {
          const percent = pointToPercent(cell);
          return <span key={`${node.id}-${cell.x}-${cell.y}`} className="map-panel-footprint" style={{ left: `${percent.x}%`, top: `${percent.y}%` }} />;
        }))}

        <svg className="map-panel-path-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {state.discoveredPath.length > 1 && <polyline points={makePathPoints(state)} fill="none" stroke="rgba(65, 38, 16, 0.72)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>

        {state.specialNodes.filter((node) => shouldShowNode(node, isDebug)).map((node) => {
          const percent = pointToPercent(node.center);
          const isCurrentTarget = node.id === state.currentTargetId || candidates.some((candidate) => candidate.nodeId === node.id);
          return (
            <span
              key={node.id}
              className={nodeClassName(node, isCurrentTarget)}
              style={{ left: `${percent.x}%`, top: `${percent.y}%` }}
              title={`${node.id} · ${node.type}`}
            >
              {isDebug ? <small>{node.type}</small> : getNodeGlyph(node)}
            </span>
          );
        })}

        <span className="map-panel-start-marker" style={{ left: `${pointToPercent(state.discoveredPath[0]).x}%`, top: `${pointToPercent(state.discoveredPath[0]).y}%` }}>S</span>
        <span className="map-panel-player-marker" style={{ left: `${pointToPercent(state.playerPosition).x}%`, top: `${pointToPercent(state.playerPosition).y}%` }}>P</span>
      </section>

      {!compact && (<>
      <section className="map-panel-status" aria-label="현재 정찰 지도 상태">
        <div><span>Seed</span><strong>{state.seed}</strong></div>
        <div><span>현재 위치</span><strong>{state.playerPosition.x}, {state.playerPosition.y}</strong></div>
        <div><span>진행 방향</span><strong>{state.currentHeading ?? '없음'}</strong></div>
        <div><span>현재 목표</span><strong>{state.currentTargetId ?? '없음'}</strong></div>
        <div><span>방문 노드</span><strong>{state.visitedNodeIds.length}</strong></div>
        <div><span>기록 노드</span><strong>{state.recordedNodeIds.length}</strong></div>
        <div><span>로마군 단서</span><strong>{romanTraceCount}</strong></div>
      </section>

      <section className="map-panel-actions" aria-label="지도 선택과 이동 진행">
        {currentTravel ? (
          <article className="map-panel-card">
            <p>{currentTravel.type}</p>
            <h2>{currentTravel.title}</h2>
            <p>{currentTravel.body}</p>
            {currentTravel.canTriggerDirectionChoice && <em>이 지점에서는 주변을 다시 살펴 방향을 바꿀 수 있습니다.</em>}
          </article>
        ) : currentNode ? (
          <article className="map-panel-card reached">
            <p>{currentNode.type}</p>
            <h2>{currentNode.title}</h2>
            <p>{currentNode.hint}</p>
            <em>{currentNode.recorded ? '지도에 기록된 지점입니다.' : '도착했습니다. 기록할 수 있습니다.'}</em>
          </article>
        ) : (
          <p className="map-panel-help">방위와 단서를 골라 정찰 방향을 정하세요. 지도는 이동 결과와 발견한 흔적만 기록합니다.</p>
        )}

        {state.currentTargetId ? (
          <div className="map-panel-choice-stack">
            <button type="button" onClick={onNextTravelEncounter}>계속 전진</button>
            <button type="button" onClick={onCancelTravel ?? (() => undefined)}>주변을 다시 살핀다</button>
            {onReturnToStart && <button type="button" onClick={onReturnToStart}>회군 테스트</button>}
          </div>
        ) : (
          <div className="map-panel-choice-stack">
            {candidates.map((candidate) => (
              <button type="button" key={candidate.nodeId} onClick={() => onSelectCandidate(candidate)}>
                <span>{candidate.label}</span>
                <small>거리 {candidate.distance} · {candidate.nodeId}</small>
              </button>
            ))}
            {currentNode && !currentNode.recorded && <button type="button" className="record" onClick={onRecordCurrentNode}>기록한다</button>}
            {onReturnToStart && <button type="button" onClick={onReturnToStart}>회군 테스트</button>}
          </div>
        )}
      </section>
      </>)}
    </section>
  );
}

