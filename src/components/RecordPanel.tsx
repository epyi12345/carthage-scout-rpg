import { getNeighbors } from '../game/mapGenerator';
import type { GameState, PlayerMapTile } from '../game/types';

interface Props {
  state: GameState;
  tile: PlayerMapTile;
  onObserve?: (tileId: string) => void;
  onRecord?: (tileId: string) => void;
  onMarkRoute?: (tileId: string) => void;
}

function canObserve(state: GameState, tile: PlayerMapTile): boolean {
  return tile.playerKnowledgeState === 'unknown' && getNeighbors(state.player.position, state.mapSize).some((neighbor) => neighbor.id === tile.id);
}

function canRecord(tile: PlayerMapTile): boolean {
  return tile.playerKnowledgeState === 'observed' || tile.playerKnowledgeState === 'scouted';
}

function canMarkRoute(tile: PlayerMapTile): boolean {
  return tile.playerKnowledgeState === 'recorded' && !tile.isRouteMarked;
}

export function RecordPanel({ state, tile, onObserve, onRecord, onMarkRoute }: Props) {
  return (
    <article className="record-panel">
      <div className="section-heading">
        <h2>기록 도구</h2>
        <span>{tile.id}</span>
      </div>
      <p className="muted">관측은 임시 단서다. 군대가 믿을 수 있는 정보로 남기려면 직접 기록해야 한다.</p>
      <div className="record-summary">
        <span>상태: {tile.playerKnowledgeState}</span>
        <span>기록 위험: {tile.playerRecordedRisk ?? '없음'}</span>
        <span>경로 표시: {tile.isRouteMarked ? '예' : '아니오'}</span>
      </div>
      <div className="record-actions">
        {canObserve(state, tile) && <button className="choice-card" onClick={() => onObserve?.(tile.id)}><strong>이 타일 관측</strong><span>인접 지형의 단서만 확인한다.</span></button>}
        {canRecord(tile) && <button className="choice-card" onClick={() => onRecord?.(tile.id)}><strong>지도에 기록</strong><span>복귀 평가에 반영되는 정보로 남긴다.</span></button>}
        {canMarkRoute(tile) && <button className="choice-card" onClick={() => onMarkRoute?.(tile.id)}><strong>한니발 경로 후보로 연결</strong><span>군대 통과 가능 경로로 표시한다.</span></button>}
        {!canObserve(state, tile) && !canRecord(tile) && !canMarkRoute(tile) && <p className="muted">현재 상태에서 가능한 지도 행동이 없다.</p>}
      </div>
    </article>
  );
}
