import { useState } from 'react';
import { BASE_MAP_IMAGE_SRC, BaseMapLayer } from './BaseMapLayer';
import { FogOfWarLayer } from './FogOfWarLayer';
import { MapHandle } from './MapHandle';
import { MapLegend } from './MapLegend';
import { PlayerMarkerLayer } from './PlayerMarkerLayer';
import { RecordPanel } from './RecordPanel';
import { VisiblePointLayer } from './VisiblePointLayer';
import type { PlayerMap, SystemMap } from '../game/types';

interface Props {
  state: { map: { parchmentSystem: SystemMap; parchmentPlayer: PlayerMap } };
  selectedTileId?: string;
  onSelectTile?: (tileId: string) => void;
  onObserveTile?: (tileId: string) => void;
  onRecordTile?: (tileId: string) => void;
  onMarkRouteTile?: (tileId: string) => void;
  onPlaceMarker?: (x: number, y: number) => void;
}

export function MapView({ state, selectedTileId, onSelectTile, onPlaceMarker }: Props) {
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [mapLoadStatus, setMapLoadStatus] = useState('Map image loading');
  const [showFog, setShowFog] = useState(false);
  const selectedPoint = state.map.parchmentSystem.points.find((point) => point.id === selectedTileId);

  const handleMapClick = (event: { currentTarget: HTMLDivElement; clientX: number; clientY: number }) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setSelectedCoordinates({ x, y });
    onSelectTile?.('');
  };

  return (
    <section className="panel map-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">양피지 정찰 지도</p>
          <h1>알프스 지형도</h1>
        </div>
        <span>{state.map.parchmentSystem.baseMapId}</span>
      </div>
      <p className="muted">검은 안개 아래에는 실제 시스템 지도가 숨겨져 있다. 현재 드러난 범위 안의 지점과 직접 남긴 표식만 믿을 수 있다.</p>
      <div className="map-runtime-debug" aria-live="polite">
        <span>resolved map image path:</span>
        <code>{BASE_MAP_IMAGE_SRC}</code>
        <strong className={mapLoadStatus === 'Map image loaded' ? 'map-load-ok' : mapLoadStatus === 'Map image failed to load' ? 'map-load-error' : ''}>{mapLoadStatus}</strong>
        <button className={showFog ? 'active' : ''} onClick={() => setShowFog((value) => !value)}>{showFog ? '안개 숨기기' : '안개 보기'}</button>
      </div>
      <div className="parchment-map-frame">
        <MapHandle />
        <div className="parchment-map-surface" onClick={handleMapClick} role="button" tabIndex={0} aria-label="양피지 지도. 빈 지점을 눌러 수동 표식을 준비한다.">
          <BaseMapLayer systemMap={state.map.parchmentSystem} onLoad={() => setMapLoadStatus('Map image loaded')} onError={() => setMapLoadStatus('Map image failed to load')} />
          <VisiblePointLayer
            points={state.map.parchmentSystem.points}
            playerMap={state.map.parchmentPlayer}
            selectedPointId={selectedPoint?.id}
            onSelectPoint={(pointId) => {
              setSelectedCoordinates(null);
              onSelectTile?.(pointId);
            }}
          />
          <PlayerMarkerLayer markers={state.map.parchmentPlayer.placedMarkers} />
          {showFog && <FogOfWarLayer revealedAreas={state.map.parchmentPlayer.revealedAreas} />}
        </div>
      </div>
      <MapLegend />
      <RecordPanel point={selectedPoint} playerMap={state.map.parchmentPlayer} selectedCoordinates={selectedCoordinates} onPlaceMarker={onPlaceMarker} />
    </section>
  );
}
