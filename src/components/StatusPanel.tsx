import type { GameState } from '../game/types';

interface Props { state: GameState }

function dangerClass(value: number, warnAt: number, dangerAt: number, inverse = false): string {
  if (inverse) {
    if (value >= dangerAt) return 'danger';
    if (value >= warnAt) return 'warn';
    return 'safe';
  }
  if (value <= dangerAt) return 'danger';
  if (value <= warnAt) return 'warn';
  return 'safe';
}

export function StatusPanel({ state }: Props) {
  const player = state.player;
  const knownTiles = state.map.tiles.filter((tile) => tile.observed || tile.visited).length;
  const recordedTiles = state.map.tiles.filter((tile) => tile.recorded).length;
  const routeTiles = state.map.tiles.filter((tile) => tile.routeMarked).length;
  const currentTile = state.map.tiles.find((tile) => tile.position.x === state.map.currentPosition.x && tile.position.y === state.map.currentPosition.y);

  return (
    <header className="status-panel" aria-label="현재 정찰 상태">
      <div className="status-topline">
        <span>Day {state.player.day}/{state.run.maxDays}</span>
        <strong>{state.map.currentPosition.x},{state.map.currentPosition.y}</strong>
        <span>{state.phase}</span>
      </div>
      <div className="status-grid survival-grid">
        <div className={`stat ${dangerClass(player.health, 45, 25)}`}><span>체력</span><strong>{player.health}</strong></div>
        <div className={`stat ${dangerClass(player.food, 2, 0)}`}><span>식량</span><strong>{player.food}</strong></div>
        <div className={`stat ${dangerClass(player.warmth, 45, 25)}`}><span>체온</span><strong>{player.warmth}</strong></div>
        <div className={`stat ${dangerClass(player.fatigue, 55, 78, true)}`}><span>피로</span><strong>{player.fatigue}</strong></div>
      </div>
      <div className="map-awareness-strip">
        <span>확인 {knownTiles}/900</span>
        <span>기록 {recordedTiles}</span>
        <span>경로 {routeTiles}</span>
        <span>{currentTile?.recorded ? 'recorded' : currentTile?.visited ? 'visited' : 'unknown'}</span>
      </div>
    </header>
  );
}
