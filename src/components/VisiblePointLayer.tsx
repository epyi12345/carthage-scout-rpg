import type { MapPoint, PlayerMap } from '../game/types';

function pointClass(point: MapPoint, selectedPointId?: string): string {
  return ['map-point', `map-point-${point.type}`, selectedPointId === point.id ? 'selected' : ''].filter(Boolean).join(' ');
}

function pointGlyph(point: MapPoint): string {
  if (point.type === 'major_region') return '◆';
  if (point.type === 'main_encounter') return '●';
  if (point.type === 'fixed_encounter') return '▲';
  if (point.type === 'optional_resource') return '✦';
  return '◇';
}

export function VisiblePointLayer({ points, playerMap, selectedPointId, onSelectPoint }: { points: MapPoint[]; playerMap: PlayerMap; selectedPointId?: string; onSelectPoint?: (pointId: string) => void }) {
  const visiblePoints = points.filter((point) => playerMap.visiblePointIds.includes(point.id) || playerMap.discoveredPointIds.includes(point.id));
  return (
    <div className="visible-point-layer" aria-label="발견된 지도 지점">
      {visiblePoints.map((point) => (
        <button
          key={point.id}
          className={pointClass(point, selectedPointId)}
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
          onClick={(event: { stopPropagation: () => void }) => {
            event.stopPropagation();
            onSelectPoint?.(point.id);
          }}
          aria-label={point.label ?? point.id}
        >
          <span aria-hidden="true">{pointGlyph(point)}</span>
        </button>
      ))}
    </div>
  );
}
