import { createMiniMap } from '../game/map';
import type { GameState } from '../game/types';

interface Props { state: GameState }

export function MapView({ state }: Props) {
  if (!state.mapUnlocked) {
    return <section className="panel"><h1>지도</h1><p className="locked">아직 펼칠 수 있는 지도가 없다.</p></section>;
  }
  const tiles = createMiniMap(state);
  return (
    <section className="panel">
      <h1>지도</h1>
      <p className="muted">S = 시작 지점 · P = 현재 위치 · □ = 미확인 · ■ = 기록됨 · ? = 관측됨</p>
      <div className="mini-map">
        {tiles.map((tile) => <div className="map-tile" key={tile.coordinate}><strong>{tile.symbol}</strong><span>{tile.coordinate}</span></div>)}
      </div>
    </section>
  );
}
