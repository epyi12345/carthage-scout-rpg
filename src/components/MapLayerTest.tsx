import { useState } from 'react';

const BASE_MAP_SRC = `${import.meta.env.BASE_URL}assets/maps/map_base_alpine_terrain_v0.png`;

const samplePoints = [
  { id: 'camp', label: '야영지', x: 50, y: 88, glyph: 'C' },
  { id: 'pass', label: '고개 후보', x: 58, y: 28, glyph: '●' },
  { id: 'shelter', label: '은신처', x: 32, y: 57, glyph: '✦' },
];

export function MapLayerTest() {
  const [showPoints, setShowPoints] = useState(false);
  const [showFog, setShowFog] = useState(false);
  const [showMarker, setShowMarker] = useState(false);
  const [loadStatus, setLoadStatus] = useState('Map image loading');

  return (
    <main className="map-test-page" aria-label="지도 레이어 테스트 페이지">
      <section className="panel map-test-panel">
        <p className="eyebrow">Map Layer Test</p>
        <h1>BaseMapLayer 시각 확인</h1>
        <p className="muted">
          실제 기본 지형도 <code>map_base_alpine_terrain_v0.png</code>를 모바일 양피지 프레임 안에서 확인한다.
          이미지가 잘리지 않고 전체 비율을 유지하는지 확인하기 위한 테스트 화면이다.
        </p>

        <div className="map-test-debug-card" aria-live="polite">
          <span>resolved mapSrc:</span>
          <code>{BASE_MAP_SRC}</code>
          <strong className={loadStatus === 'Map image loaded' ? 'map-load-ok' : loadStatus === 'Map image failed to load' ? 'map-load-error' : ''}>{loadStatus}</strong>
        </div>

        <div className="map-test-direct-preview">
          <img
            className="map-test-direct-image"
            src={BASE_MAP_SRC}
            alt="Carthage Scout RPG alpine terrain base map direct preview"
            onLoad={() => setLoadStatus('Map image loaded')}
            onError={() => setLoadStatus('Map image failed to load')}
          />
        </div>

        <div className="map-test-controls" aria-label="지도 테스트 토글">
          <button className={showPoints ? 'active' : ''} onClick={() => setShowPoints((value) => !value)}>sample points</button>
          <button className={showFog ? 'active' : ''} onClick={() => setShowFog((value) => !value)}>sample fog</button>
          <button className={showMarker ? 'active' : ''} onClick={() => setShowMarker((value) => !value)}>sample marker</button>
        </div>

        <div className="parchment-map-frame map-test-frame">
          <div className="map-handle" aria-hidden="true"><span /></div>
          <div className="map-test-surface">
            <img
              className="map-test-base-image"
              src={BASE_MAP_SRC}
              alt="Carthage Scout RPG alpine terrain base map framed preview"
              onLoad={() => setLoadStatus('Map image loaded')}
              onError={() => setLoadStatus('Map image failed to load')}
            />
            {showPoints && (
              <div className="map-test-overlay" aria-label="샘플 시스템 포인트">
                {samplePoints.map((point) => (
                  <span key={point.id} className="map-test-point" style={{ left: `${point.x}%`, top: `${point.y}%` }} title={point.label}>{point.glyph}</span>
                ))}
              </div>
            )}
            {showMarker && <span className="player-marker map-test-marker" style={{ left: '45%', top: '72%' }}>↩</span>}
            {showFog && (
              <svg className="map-test-fog" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <mask id="map-test-fog-mask">
                    <rect x="0" y="0" width="100" height="100" fill="white" />
                    <circle cx="50" cy="88" r="18" fill="black" />
                    <circle cx="58" cy="28" r="12" fill="black" />
                  </mask>
                </defs>
                <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,.82)" mask="url(#map-test-fog-mask)" />
              </svg>
            )}
          </div>
        </div>

        <div className="map-test-notes">
          <span>로컬: <code>/carthage-scout-rpg/#/map-test</code></span>
          <span>GitHub Pages: <code>/carthage-scout-rpg/#/map-test</code></span>
        </div>
      </section>
    </main>
  );
}
