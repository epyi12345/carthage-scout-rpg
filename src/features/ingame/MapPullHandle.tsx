import { ingameUiAssets } from './ingameAssets';
import './MapPullHandle.css';

interface MapPullHandleProps {
  onMapPullStart?: () => void;
}

export function MapPullHandle({ onMapPullStart }: MapPullHandleProps) {
  return (
    <button
      type="button"
      className="map-pull-handle"
      aria-label="지도 열기"
      onPointerDown={onMapPullStart}
    >
      <img src={ingameUiAssets.mapPullHandle} alt="" draggable={false} />
    </button>
  );
}
