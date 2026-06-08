import type { GameState, PlayerMapTile } from '../game/types';
import { RecordPanel } from './RecordPanel';

interface Props {
  state: GameState;
  selectedTileId?: string;
  onSelectTile?: (tileId: string) => void;
  onObserveTile?: (tileId: string) => void;
  onRecordTile?: (tileId: string) => void;
  onMarkRouteTile?: (tileId: string) => void;
}

function tileLabel(tile: PlayerMapTile, currentPosition: string, campPosition: string): string {
  if (tile.id === currentPosition) return 'P';
  if (tile.id === campPosition) return 'C';
  if (tile.playerKnowledgeState === 'unknown') return '□';
  if (tile.playerKnowledgeState === 'observed') return '?';
  if (tile.playerKnowledgeState === 'scouted') return '◇';
  if (tile.playerKnowledgeState === 'recorded') return '■';
  return 'R';
}

function tileClass(tile: PlayerMapTile, selectedTileId?: string): string {
  return ['map-tile', `knowledge-${tile.playerKnowledgeState}`, tile.isRouteMarked ? 'route-marked' : '', selectedTileId === tile.id ? 'selected' : ''].filter(Boolean).join(' ');
}

export function MapView({ state, selectedTileId, onSelectTile, onObserveTile, onRecordTile, onMarkRouteTile }: Props) {
  const selectedTile = state.playerMap.find((tile) => tile.id === selectedTileId);
  return (
    <section className="panel">
      <h1>정찰 지도</h1>
      <p className="muted">C = 시작 · P = 현재 · □ = 미확인 · ? = 관측 단서 · ◇ = 정찰 확인 · ■ = 기록 · R = 한니발 경로 후보</p>
      <div className="mini-map mvp-map">
        {state.playerMap.map((tile) => (
          <button className={tileClass(tile, selectedTileId)} key={tile.id} onClick={() => onSelectTile?.(tile.id)}>
            <strong>{tileLabel(tile, state.player.position, state.player.campPosition)}</strong>
            <span>{tile.id}</span>
          </button>
        ))}
      </div>
      {selectedTile && <TileDetails state={state} tile={selectedTile} />}
      {selectedTile && <RecordPanel state={state} tile={selectedTile} onObserve={onObserveTile} onRecord={onRecordTile} onMarkRoute={onMarkRouteTile} />}
    </section>
  );
}

function TileDetails({ state, tile }: { state: GameState; tile: PlayerMapTile }) {
  const systemTile = state.systemMap.find((candidate) => candidate.id === tile.id);
  return (
    <article className="tile-details">
      <h2>{tile.id}</h2>
      <p>플레이어 지도 상태: {tile.playerKnowledgeState}</p>
      {tile.playerKnowledgeState === 'unknown' && <p className="muted">아직 확인되지 않은 지형이다. 지형, 위험도, 통과 가능성은 숨겨져 있다.</p>}
      {tile.playerKnowledgeState === 'observed' && tile.observedHint && (
        <>
          <p>관측 단서: {tile.observedHint.terrainHint}</p>
          <p>위험 단서: {tile.observedHint.riskBand}</p>
          <p>통과 단서: {tile.observedHint.passabilityHint}</p>
          <p className="muted">아직 기록되지 않은 관측이다. 복귀 평가에서는 신뢰 정보로 계산되지 않는다.</p>
        </>
      )}
      {(tile.playerKnowledgeState === 'scouted' || tile.playerKnowledgeState === 'recorded' || tile.playerKnowledgeState === 'route_connected') && (
        <>
          <p>확인 지형: {tile.confirmedTerrainType}</p>
          <p>{tile.playerKnowledgeState === 'scouted' ? '확인 위험도' : '기록 위험도'}: {tile.playerRecordedRisk ?? tile.confirmedRiskLevel}</p>
          <p>군대 통과 가능성: {tile.confirmedPassability}</p>
          {tile.hasEncounterHint && <p>흔적: 이곳에는 사건의 단서가 있다.</p>}
        </>
      )}
      {tile.playerNotes.length > 0 && <p>메모: {tile.playerNotes.join(' / ')}</p>}
      {state.flags.includes('dev_show_system_map') && systemTile && <p className="dev-truth">시스템 지도: {systemTile.terrainType}, 위험 {systemTile.trueRiskLevel}, 통과 {systemTile.passability}, 귀환 {systemTile.returnSignal}</p>}
    </article>
  );
}
