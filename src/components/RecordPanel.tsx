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
      <h2>지도 행동</h2>
      <p className="muted">관측은 임시 단서다. 군대가 믿을 수 있는 정보로 남기려면 직접 기록해야 한다.</p>
      <div className="record-actions">
        {canObserve(state, tile) && <button onClick={() => onObserve?.(tile.id)}>이 타일 관측</button>}
        {canRecord(tile) && <button onClick={() => onRecord?.(tile.id)}>지도에 기록</button>}
        {canMarkRoute(tile) && <button onClick={() => onMarkRoute?.(tile.id)}>한니발 경로 후보로 연결</button>}
        {!canObserve(state, tile) && !canRecord(tile) && !canMarkRoute(tile) && <p className="muted">현재 상태에서 가능한 지도 행동이 없다.</p>}
      </div>
    </article>
  );
}
