import type { SystemMap } from '../game/types';

const BASE_MAP_IMAGE_SRC = `${import.meta.env.BASE_URL}assets/maps/map_base_alpine_parchment.jpg`;

export function BaseMapLayer({ systemMap }: { systemMap: SystemMap }) {
  return (
    <div
      className="base-map-layer"
      style={{ '--base-map-image': `url(${BASE_MAP_IMAGE_SRC})` }}
      aria-label={`기본 양피지 지도 ${systemMap.baseMapId}`}
    />
  );
}
