import type { SystemMap } from '../game/types';

export const BASE_MAP_IMAGE_SRC = `${import.meta.env.BASE_URL}assets/maps/map_base_alpine_terrain_v0.png`;

export function BaseMapLayer({ systemMap, onLoad, onError }: { systemMap: SystemMap; onLoad?: () => void; onError?: () => void }) {
  return (
    <div className="base-map-layer" aria-label={`기본 양피지 지도 ${systemMap.baseMapId}`}>
      <img
        className="base-map-image"
        src={BASE_MAP_IMAGE_SRC}
        alt="Carthage Scout RPG alpine terrain base map"
        onLoad={onLoad}
        onError={onError}
      />
    </div>
  );
}
