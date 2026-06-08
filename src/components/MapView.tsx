import type { GameState, PlayerMapTile } from '../game/types';

interface Props { state: GameState; selectedTileId?: string; onSelectTile?: (tileId: string) => void }

function tileLabel(tile: PlayerMapTile, currentPosition: string, campPosition: string): string {
  if (tile.id === currentPosition) return 'P';
  if (tile.id === campPosition) return 'C';
  if (tile.state === 'unknown') return '□';
  if (tile.state === 'observed') return '?';
  if (tile.state === 'scouted') return '◇';
  if (tile.state === 'recorded') return '■';
  return 'R';
}

export function MapView({ state, selectedTileId, onSelectTile }: Props) {
  return (
    <section className="panel">
      <h1>정찰 지도</h1>
      <p className="muted">C = 야영지 · P = 현재 위치 · □ = 미확인 · ? = 관측 · ◇ = 정찰 · ■ = 기록 · R = 군대 경로 후보</p>
      <div className="mini-map mvp-map">
        {state.playerMap.map((tile) => (
          <button className={`map-tile ${selectedTileId === tile.id ? 'selected' : ''}`} key={tile.id} onClick={() => onSelectTile?.(tile.id)}>
            <strong>{tileLabel(tile, state.player.position, state.player.campPosition)}</strong>
            <span>{tile.id}</span>
          </button>
        ))}
      </div>
      {selectedTileId && <TileDetails state={state} tileId={selectedTileId} />}
    </section>
  );
}

function TileDetails({ state, tileId }: { state: GameState; tileId: string }) {
  const playerTile = state.playerMap.find((tile) => tile.id === tileId);
  const systemTile = state.systemMap.find((tile) => tile.id === tileId);
  if (!playerTile) return null;
  return (
    <article className="tile-details">
      <h2>{tileId}</h2>
      <p>플레이어 지도 상태: {playerTile.state}</p>
      {playerTile.state === 'unknown' ? <p className="muted">아직 확인되지 않은 지형이다.</p> : (
        <>
          <p>관측 지형: {playerTile.observedTerrain}</p>
          <p>위험도 기록: {playerTile.observedRisk}</p>
          <p>군대 통과 가능성: {playerTile.observedPassable ? '가능' : '불확실/불가'}</p>
          {playerTile.hasEncounterHint && <p>흔적: 이곳에는 사건의 단서가 있다.</p>}
        </>
      )}
      {state.flags.includes('dev_show_system_map') && systemTile && <p className="dev-truth">시스템 지도: {systemTile.terrain}, 위험 {systemTile.risk}, 통과 {systemTile.passable ? '가능' : '불가'}</p>}
    </article>
  );
}
