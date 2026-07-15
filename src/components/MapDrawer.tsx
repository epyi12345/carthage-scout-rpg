import { MapView } from './MapView';
import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  isOpen: boolean;
  selectedTileId: string;
  onClose: () => void;
  onSelectTile: (tileId: string) => void;
}

export function MapDrawer({ state, isOpen, selectedTileId, onClose, onSelectTile }: Props) {
  if (!isOpen) return null;
  return (
    <section className="ui-popup map-drawer" role="dialog" aria-modal="true" aria-label="지도 두루마리">
      <div className="ui-popup__panel map-drawer__panel">
        <p className="eyebrow">지도 두루마리 초안</p>
        <p className="note">TODO: 아래에서 위로 올라오는 두루마리형 지도, 안개 버전/클리어 버전을 전환한다.</p>
        <MapView state={state} selectedTileId={selectedTileId} onSelectTile={onSelectTile} />
        <button onClick={onClose}>닫기</button>
      </div>
    </section>
  );
}
