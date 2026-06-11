import type { MapPoint, PlayerMap } from '../game/types';

interface Props {
  point?: MapPoint;
  playerMap: PlayerMap;
  selectedCoordinates?: { x: number; y: number } | null;
  onPlaceMarker?: (x: number, y: number) => void;
}

function pointTypeLabel(point: MapPoint): string {
  return {
    major_region: '주요 지역',
    fixed_encounter: '고정 사건',
    main_encounter: '주요 사건',
    optional_resource: '자원/선택 단서',
    return_landmark: '귀환 기준점',
  }[point.type];
}

export function RecordPanel({ point, playerMap, selectedCoordinates, onPlaceMarker }: Props) {
  return (
    <article className="record-panel parchment-record-panel">
      <div className="section-heading">
        <h2>지도 기록 도구</h2>
        <span>{point ? pointTypeLabel(point) : '수동 표식'}</span>
      </div>
      <p className="muted">이 지도는 격자 타일이 아니라 양피지 지형도다. 보이는 지점만 확인되고, 빈 지점에는 직접 귀환 표식을 남길 수 있다.</p>
      <div className="record-summary">
        <span>드러난 영역: {playerMap.revealedAreas.length}</span>
        <span>발견 지점: {playerMap.discoveredPointIds.length}</span>
        <span>수동 표식: {playerMap.placedMarkers.length}</span>
      </div>
      {point ? (
        <div className="point-detail-card">
          <strong>{point.label ?? point.id}</strong>
          <span>ID: {point.id}</span>
          <span>유형: {pointTypeLabel(point)}</span>
          {point.encounterId && <span>사건 단서: {point.encounterId}</span>}
        </div>
      ) : selectedCoordinates ? (
        <button className="choice-card" onClick={() => onPlaceMarker?.(selectedCoordinates.x, selectedCoordinates.y)}>
          <strong>이 위치에 귀환 표식 남기기</strong>
          <span>{Math.round(selectedCoordinates.x)}, {Math.round(selectedCoordinates.y)} 지점</span>
        </button>
      ) : (
        <p className="muted">지도 위의 드러난 지점이나 빈 양피지 위치를 누르면 기록 행동이 표시된다.</p>
      )}
    </article>
  );
}
