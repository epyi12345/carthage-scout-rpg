import { useState } from 'react';
import { BaseMapLayer } from './BaseMapLayer';
import { FogOfWarLayer } from './FogOfWarLayer';
import { MapHandle } from './MapHandle';
import { MapLegend } from './MapLegend';
import { PlayerMarkerLayer } from './PlayerMarkerLayer';
import { RecordPanel } from './RecordPanel';
import { VisiblePointLayer } from './VisiblePointLayer';
import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  selectedTileId?: string;
  onSelectTile?: (tileId: string) => void;
  onObserveTile?: (tileId: string) => void;
  onRecordTile?: (tileId: string) => void;
  onMarkRouteTile?: (tileId: string) => void;
  onPlaceMarker?: (x: number, y: number) => void;
}

export function MapView({ state, selectedTileId, onSelectTile, onPlaceMarker }: Props) {
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ x: number; y: number } | null>(null);
  const selectedPoint = state.parchmentSystemMap.points.find((point) => point.id === selectedTileId);

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
        <span>{state.parchmentSystemMap.baseMapId}</span>
      </div>
      <p className="muted">검은 안개 아래에는 실제 시스템 지도가 숨겨져 있다. 현재 드러난 범위 안의 지점과 직접 남긴 표식만 믿을 수 있다.</p>
      <div className="parchment-map-frame">
        <MapHandle />
        <div className="parchment-map-surface" onClick={handleMapClick} role="button" tabIndex={0} aria-label="양피지 지도. 빈 지점을 눌러 수동 표식을 준비한다.">
          <BaseMapLayer systemMap={state.parchmentSystemMap} />
          <VisiblePointLayer
            points={state.parchmentSystemMap.points}
            playerMap={state.parchmentPlayerMap}
            selectedPointId={selectedPoint?.id}
            onSelectPoint={(pointId) => {
              setSelectedCoordinates(null);
              onSelectTile?.(pointId);
            }}
          />
          <PlayerMarkerLayer markers={state.parchmentPlayerMap.placedMarkers} />
          <FogOfWarLayer revealedAreas={state.parchmentPlayerMap.revealedAreas} />
        </div>
      </div>
      <MapLegend />
      <RecordPanel point={selectedPoint} playerMap={state.parchmentPlayerMap} selectedCoordinates={selectedCoordinates} onPlaceMarker={onPlaceMarker} />
    </section>
  );
}
