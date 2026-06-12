import type { PlayerMarker } from '../game/types';

function markerGlyph(type: PlayerMarker['type']): string {
  if (type === 'danger') return '!';
  if (type === 'resource') return '+';
  if (type === 'route') return '→';
  if (type === 'question') return '?';
  return '↩';
}

export function PlayerMarkerLayer({ markers }: { markers: PlayerMarker[] }) {
  return (
    <div className="player-marker-layer" aria-label="플레이어 수동 표식">
      {markers.map((marker) => (
        <span
          key={marker.id}
          className={`player-marker player-marker-${marker.type}`}
          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          title={marker.note ?? marker.type}
        >
          {markerGlyph(marker.type)}
        </span>
      ))}
    </div>
  );
}
