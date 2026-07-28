import { useEffect, useRef, useState } from 'react';
import { AchievementAlbumPopup } from '../../components/AchievementAlbumPopup';
import type { Encounter, EncounterChoice } from '../../game/types';
import { MapPanel } from '../map/MapPanel';
import { advanceTravel, cancelTravel, recordCurrentNode, selectDirectionCandidate } from '../map/mapLogic';
import type { DirectionCandidate } from '../map/mapTypes';
import { useMapRun } from '../map/useMapRun';
import { OptionsOverlay } from '../options/OptionsOverlay';
import { getTextSpeedDelay, loadUiSettings, saveUiSettings } from '../options/uiSettings';
import { useTypewriterText } from '../typing/useTypewriterText';
import { ingameUiAssets } from './ingameAssets';
import './InGamePlayScreen.css';

const INGAME_DESIGN_WIDTH = 390;
const INGAME_DESIGN_HEIGHT = 844;

interface InGamePlayScreenProps {
  encounter?: Encounter;
  missingEncounterId?: string | null;
  resultText?: string | null;
  resultEncounterId?: string | null;
  resultEncounterTitle?: string | null;
  onChoiceSelect?: (choice: EncounterChoice) => void;
  onContinueResult?: () => void;
}

function splitImagePlaceholder(body: string, fallbackPlaceholder?: string) {
  const imageBlockPattern = /\[이미지 영역\]\n?([\s\S]*?)\n?\[\/이미지 영역\]/;
  const match = body.match(imageBlockPattern);
  if (!match) return { before: body, placeholder: fallbackPlaceholder ?? null, after: '' };
  const [fullMatch, placeholder] = match;
  const [before, after = ''] = body.split(fullMatch);
  return { before, placeholder: fallbackPlaceholder ?? placeholder.trim(), after };
}

const headerHeartLefts = [100, 127, 154];


type MapRevealState = 'closed' | 'dragging' | 'open';

type HandleRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type MapGeometry = {
  stageWidth: number;
  handle: HandleRect;
  headerBottom: number;
};

type MapDragSession = {
  active: boolean;
  pointerId: number | null;
  startClientY: number;
  startHeight: number;
  lastClientY: number;
  lastHeight: number;
  openHeight: number;
  startedOpen: boolean;
};

type MapPointerEvent = {
  clientY: number;
  pointerId: number;
  preventDefault: () => void;
  stopPropagation: () => void;
  currentTarget: {
    setPointerCapture: (pointerId: number) => void;
    releasePointerCapture?: (pointerId: number) => void;
  };
};

const MAP_REVEAL_OPEN_THRESHOLD_RATIO = 0.1;
const MAP_REVEAL_CLOSE_THRESHOLD_RATIO = 0.9;
const MAP_REVEAL_MAX_WIDTH = 380;
const MAP_REVEAL_HEADER_SAFE_GAP = 10;
const MAP_HIT_AREA_MIN_HEIGHT = 52;
const MAP_HIT_AREA_MIN_WIDTH = 96;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}


function getViewportSize() {
  if (typeof window === 'undefined') return { width: INGAME_DESIGN_WIDTH, height: INGAME_DESIGN_HEIGHT };
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function useViewportSize() {
  const [size, setSize] = useState(getViewportSize);

  useEffect(() => {
    const updateSize = () => setSize(getViewportSize());

    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  return size;
}


function renderParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, paragraphIndex) => {
      const lines = paragraph.split('\n');
      return (
        <p key={`${paragraphIndex}-${paragraph}`} className="ingame-narrative-paragraph">
          {lines.map((line, lineIndex) => (
            <span key={`${lineIndex}-${line}`}>
              {line}
              {lineIndex < lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      );
    });
}

export function InGamePlayScreen({ encounter, missingEncounterId, resultText, resultEncounterId, resultEncounterTitle, onChoiceSelect, onContinueResult }: InGamePlayScreenProps) {
  const [isAchievementPopupOpen, setIsAchievementPopupOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [settings, setSettings] = useState(loadUiSettings);
  const [mapSeed] = useState(() => `run-${Date.now()}`);
  const { mapState, setMapState, candidates } = useMapRun(mapSeed);
  const [mapRevealState, setMapRevealState] = useState<MapRevealState>('closed');
  const [revealedHeight, setRevealedHeight] = useState(0);
  const [mapGeometry, setMapGeometry] = useState<MapGeometry | null>(null);
  const [mapUiContentHeight, setMapUiContentHeight] = useState(0);
  const ingameStageRef = useRef<HTMLElement | null>(null);
  const ingameHeaderRef = useRef<HTMLElement | null>(null);
  const footerMapHandleRef = useRef<HTMLImageElement | null>(null);
  const mapContentRef = useRef<HTMLDivElement | null>(null);
  const revealedHeightRef = useRef(0);
  const mapRevealStateRef = useRef<MapRevealState>('closed');
  const mapDragSessionRef = useRef<MapDragSession>({
    active: false,
    pointerId: null,
    startClientY: 0,
    startHeight: 0,
    lastClientY: 0,
    lastHeight: 0,
    openHeight: 0,
    startedOpen: false,
  });
  const viewportSize = useViewportSize();
  const uiScale = Math.min(
    viewportSize.width / INGAME_DESIGN_WIDTH,
    viewportSize.height / INGAME_DESIGN_HEIGHT,
  );
  const footerHandleRect = mapGeometry?.handle ?? null;
  const mapLayerWidth = mapGeometry ? Math.min(mapGeometry.stageWidth * 0.88, MAP_REVEAL_MAX_WIDTH * uiScale) : 0;
  const mapLayerLeft = footerHandleRect ? footerHandleRect.left + footerHandleRect.width / 2 - mapLayerWidth / 2 : 0;
  const availableHeightUntilHeader = mapGeometry
    ? Math.max(mapGeometry.handle.top - (mapGeometry.headerBottom + MAP_REVEAL_HEADER_SAFE_GAP * uiScale), 0)
    : 0;
  const finalOpenHeight = Math.min(mapUiContentHeight, availableHeightUntilHeader);
  const clampedRevealHeight = clamp(revealedHeight, 0, finalOpenHeight);
  const mapLayerTop = footerHandleRect ? footerHandleRect.top - clampedRevealHeight : 0;
  const hitAreaWidth = footerHandleRect ? Math.max(footerHandleRect.width, MAP_HIT_AREA_MIN_WIDTH) : 0;
  const hitAreaHeight = footerHandleRect ? Math.max(footerHandleRect.height, MAP_HIT_AREA_MIN_HEIGHT) : 0;
  const hitAreaLeft = footerHandleRect ? footerHandleRect.left + footerHandleRect.width / 2 - hitAreaWidth / 2 : 0;
  const hitAreaTop = footerHandleRect ? footerHandleRect.top + footerHandleRect.height / 2 - hitAreaHeight / 2 : 0;
  const isMapReady = mapGeometry !== null && mapUiContentHeight > 0 && finalOpenHeight > 0;
  const isMapLayerVisible = footerHandleRect !== null && (mapRevealState !== 'closed' || clampedRevealHeight > 0);
  const isMapInteractive = finalOpenHeight > 0 && clampedRevealHeight >= finalOpenHeight * 0.98;
  const imageContent = encounter ? splitImagePlaceholder(encounter.body, encounter.imagePlaceholder) : null;
  const bodyText = imageContent ? `${imageContent.before}${imageContent.after}` : '';
  const displayedEncounterId = resultText ? resultEncounterId : encounter?.id;
  const displayedEncounterTitle = resultText ? resultEncounterTitle : encounter?.title;
  const activeText = resultText ?? bodyText;
  const typingKey = resultText
    ? `result:${resultEncounterId ?? ''}:${resultText}`
    : `body:${encounter?.id ?? ''}:${encounter?.body ?? ''}`;
  const typewriter = useTypewriterText({
    text: activeText,
    delayMs: getTextSpeedDelay(settings.textSpeed),
    resetKey: typingKey,
  });
  const visibleBefore = imageContent ? typewriter.visibleText.slice(0, imageContent.before.length) : '';
  const visibleAfter = imageContent ? typewriter.visibleText.slice(imageContent.before.length) : '';
  const canShowImagePlaceholder = Boolean(imageContent?.placeholder) && typewriter.visibleText.length >= (imageContent?.before.length ?? 0);

  useEffect(() => {
    saveUiSettings(settings);
  }, [settings]);

  const syncMapGeometry = () => {
    const stage = ingameStageRef.current;
    const header = ingameHeaderRef.current;
    const handle = footerMapHandleRef.current;
    if (!stage || !header || !handle) return null;

    const stageRect = stage.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    const nextGeometry: MapGeometry = {
      stageWidth: stageRect.width,
      headerBottom: headerRect.bottom - stageRect.top,
      handle: {
        left: handleRect.left - stageRect.left,
        top: handleRect.top - stageRect.top,
        width: handleRect.width,
        height: handleRect.height,
      },
    };
    setMapGeometry(nextGeometry);
    return nextGeometry;
  };

  useEffect(() => {
    const updateGeometry = () => syncMapGeometry();
    const visualViewport = window.visualViewport;

    updateGeometry();
    window.addEventListener('resize', updateGeometry);
    window.addEventListener('orientationchange', updateGeometry);
    visualViewport?.addEventListener('resize', updateGeometry);
    visualViewport?.addEventListener('scroll', updateGeometry);

    return () => {
      window.removeEventListener('resize', updateGeometry);
      window.removeEventListener('orientationchange', updateGeometry);
      visualViewport?.removeEventListener('resize', updateGeometry);
      visualViewport?.removeEventListener('scroll', updateGeometry);
    };
  }, [viewportSize.width, viewportSize.height]);

  useEffect(() => {
    const element = mapContentRef.current;
    if (!element) return;

    const updateMapUiContentHeight = () => {
      const nextHeight = Math.max(element.scrollHeight, element.getBoundingClientRect().height);
      setMapUiContentHeight((current) => current === nextHeight ? current : nextHeight);
    };

    updateMapUiContentHeight();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateMapUiContentHeight);
      window.addEventListener('orientationchange', updateMapUiContentHeight);
      return () => {
        window.removeEventListener('resize', updateMapUiContentHeight);
        window.removeEventListener('orientationchange', updateMapUiContentHeight);
      };
    }

    const observer = new ResizeObserver(updateMapUiContentHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, [mapGeometry?.stageWidth, viewportSize.width, viewportSize.height]);

  useEffect(() => {
    if (mapRevealStateRef.current !== 'open') return;
    revealedHeightRef.current = finalOpenHeight;
    setRevealedHeight(finalOpenHeight);
  }, [finalOpenHeight]);

  const snapMapRevealTo = (height: number, openHeight: number) => {
    const nextHeight = clamp(height, 0, openHeight);
    revealedHeightRef.current = nextHeight;
    mapRevealStateRef.current = nextHeight >= openHeight && openHeight > 0 ? 'open' : 'closed';
    setRevealedHeight(nextHeight);
    setMapRevealState(mapRevealStateRef.current);
  };

  const closeMapReveal = () => {
    revealedHeightRef.current = 0;
    mapRevealStateRef.current = 'closed';
    setRevealedHeight(0);
    setMapRevealState('closed');
  };

  const openMapReveal = (openHeight: number) => {
    snapMapRevealTo(openHeight, openHeight);
  };

  const handleMapPullPointerDown = (event: MapPointerEvent) => {
    if (!isMapReady) return;
    event.preventDefault();
    event.stopPropagation();
    syncMapGeometry();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // WebKit may reject capture during viewport changes; the active session still tracks the gesture.
    }
    const startHeight = mapRevealStateRef.current === 'open'
      ? finalOpenHeight
      : clamp(revealedHeightRef.current, 0, finalOpenHeight);
    mapDragSessionRef.current = {
      active: true,
      pointerId: event.pointerId,
      startClientY: event.clientY,
      startHeight,
      lastClientY: event.clientY,
      lastHeight: startHeight,
      openHeight: finalOpenHeight,
      startedOpen: startHeight >= finalOpenHeight * 0.98,
    };
    revealedHeightRef.current = startHeight;
    mapRevealStateRef.current = 'dragging';
    setRevealedHeight(startHeight);
    setMapRevealState('dragging');
  };

  const handleMapPullPointerMove = (event: MapPointerEvent) => {
    const session = mapDragSessionRef.current;
    if (!session.active || session.pointerId !== event.pointerId) return;
    event.preventDefault();
    const nextHeight = clamp(
      session.startHeight + (session.startClientY - event.clientY),
      0,
      session.openHeight,
    );
    session.lastClientY = event.clientY;
    session.lastHeight = nextHeight;
    revealedHeightRef.current = nextHeight;
    setRevealedHeight(nextHeight);
  };

  const finishMapDrag = (pointerId?: number, clientY?: number) => {
    const session = mapDragSessionRef.current;
    if (!session.active) return;
    if (pointerId !== undefined && session.pointerId !== null && pointerId !== session.pointerId) return;

    const finalHeight = clientY === undefined
      ? session.lastHeight
      : clamp(
        session.startHeight + (session.startClientY - clientY),
        0,
        session.openHeight,
      );
    session.active = false;
    session.pointerId = null;

    if (session.openHeight <= 0) {
      closeMapReveal();
      return;
    }

    if (session.startedOpen) {
      const closeDragDistance = session.openHeight - finalHeight;
      if (closeDragDistance >= session.openHeight * (1 - MAP_REVEAL_CLOSE_THRESHOLD_RATIO)) closeMapReveal();
      else openMapReveal(session.openHeight);
      return;
    }

    if (finalHeight >= session.openHeight * MAP_REVEAL_OPEN_THRESHOLD_RATIO) openMapReveal(session.openHeight);
    else closeMapReveal();
  };

  const handleMapPullPointerUp = (event: MapPointerEvent) => {
    finishMapDrag(event.pointerId, event.clientY);
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Capture may already be released after pointercancel/lostpointercapture.
    }
  };

  const handleSelectMapCandidate = (candidate: DirectionCandidate) => {
    setMapState((current) => selectDirectionCandidate(current, candidate));
  };

  return (
    <main className="ingame-play-screen">
      <section
        ref={ingameStageRef}
        className="ingame-stage"
        aria-label="인게임 화면"
      >
        <div className="ingame-background-layer" aria-hidden="true">
          <img
            className="ingame-background"
            src={ingameUiAssets.parchmentBackground}
            alt=""
            draggable={false}
          />

          <img
            className="ingame-vignette"
            src={ingameUiAssets.outerVignetteFrame}
            alt=""
            draggable={false}
          />
        </div>

        <div className="ingame-ui-scale-viewport">
          <div
            className="ingame-ui-canvas"
            style={{
              '--ingame-ui-scale': uiScale,
              '--game-font-size': `${settings.fontSize}px`,
              '--game-line-height': settings.lineHeight,
            }}
          >
            <div className="ingame-ui-layout">
        <header ref={ingameHeaderRef} className="ingame-header">
          <div className="ingame-top-ornament-wrap">
            <img
              className="ingame-top-ornament"
              src={ingameUiAssets.topDividerLeftSource}
              alt=""
              draggable={false}
            />
          </div>

          <div className="ingame-center-divider-wrap">
            <img
              className="ingame-center-divider"
              src={ingameUiAssets.centerDividerLine}
              alt=""
              draggable={false}
            />
          </div>

          <div className="ingame-header-portrait-wrap">
            <img
              className="ingame-header-portrait"
              src={ingameUiAssets.scrollPortrait}
              alt=""
              draggable={false}
            />
          </div>

          <img
            className="ingame-header-status-bar"
            src={ingameUiAssets.capsuleFrameWide}
            alt=""
            draggable={false}
          />

          {headerHeartLefts.map((left) => (
            <img
              className="ingame-header-heart"
              key={left}
              src={ingameUiAssets.heartLike}
              alt=""
              draggable={false}
              style={{ '--heart-left': `${left}px` }}
            />
          ))}

          <div className="ingame-header-right-icons">
            <img
              className="ingame-header-gear"
              src={ingameUiAssets.gearIcon}
              alt=""
              draggable={false}
            />
            <button
              type="button"
              className="ingame-header-options-button"
              onClick={() => setIsOptionsOpen(true)}
              aria-label="옵션 열기"
            />

            <button
              type="button"
              className="ingame-header-achievement-button"
              onClick={() => setIsAchievementPopupOpen(true)}
              aria-label="업적 열기"
            >
              <img
                className="ingame-header-toggle"
                src={ingameUiAssets.smallToggleHorizontal}
                alt=""
                draggable={false}
              />
            </button>
          </div>
        </header>

        <section
          className="ingame-text-scroll"
          aria-label={typewriter.isComplete ? '인게임 텍스트 영역' : '인게임 텍스트 출력 중, 누르면 전체 표시'}
          onClick={() => {
            if (!typewriter.isComplete) typewriter.skip();
          }}
        >
          {resultText || encounter ? (
            <article className="ingame-encounter-content">
              <p className="ingame-encounter-id">{displayedEncounterId}</p>
              <h1 className="ingame-encounter-title">{displayedEncounterTitle}</h1>

              {resultText ? (
                <div className="ingame-result-block">
                  {renderParagraphs(typewriter.visibleText)}
                  {typewriter.isComplete && (
                    <button type="button" className="ingame-choice-button" onClick={onContinueResult}>
                      계속
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {renderParagraphs(visibleBefore)}
                  {canShowImagePlaceholder && (
                    <div className="ingame-image-placeholder" aria-label="이미지 임시 영역">
                      {renderParagraphs(imageContent?.placeholder ?? '')}
                    </div>
                  )}
                  {renderParagraphs(visibleAfter)}

                  {typewriter.isComplete && encounter && (
                    <div className="ingame-choice-list" aria-label="선택지">
                      {encounter.choices.map((choice) => (
                        <button
                          type="button"
                          className="ingame-choice-button"
                          key={choice.id}
                          disabled={choice.disabled}
                          onClick={() => onChoiceSelect?.(choice)}
                        >
                          {choice.text}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </article>
          ) : (
            <article className="ingame-encounter-content">
              <p className="ingame-encounter-id">{missingEncounterId ?? 'NO_ENCOUNTER'}</p>
              <h1 className="ingame-encounter-title">튜토리얼 다음 장면 미적용</h1>
            </article>
          )}
        </section>

        <footer className="ingame-footer" aria-hidden="true">
          <img
            ref={footerMapHandleRef}
            className="footer-map-handle"
            src={ingameUiAssets.mapPullHandleBar}
            alt=""
            aria-hidden="true"
            draggable={false}
          />

          <div className="ingame-bottom-ornament-wrap">
            <img
              className="ingame-bottom-ornament"
              src={ingameUiAssets.bottomDividerRightSource}
              alt=""
              draggable={false}
            />
          </div>
        </footer>
            </div>

          </div>
        </div>

        <div className="ingame-map-interaction-overlay">
        {footerHandleRect && (
          <>
            <button
              type="button"
              className="ingame-map-pull-hit-area"
              style={{
                '--map-hit-left': `${hitAreaLeft}px`,
                '--map-hit-top': `${hitAreaTop}px`,
                '--map-hit-width': `${hitAreaWidth}px`,
                '--map-hit-height': `${hitAreaHeight}px`,
              }}
              disabled={!isMapReady}
              onPointerDown={handleMapPullPointerDown}
              onPointerMove={handleMapPullPointerMove}
              onPointerUp={handleMapPullPointerUp}
              onPointerCancel={(event: MapPointerEvent) => finishMapDrag(event.pointerId)}
              onLostPointerCapture={(event: MapPointerEvent) => finishMapDrag(event.pointerId)}
              aria-label={clampedRevealHeight > 0 ? '정찰 지도 접기' : '정찰 지도 펼치기'}
            />

            <section
              className={`ingame-map-reveal-layer is-${mapRevealState}${isMapInteractive ? ' is-interactive' : ''}`}
              style={{
                '--map-layer-left': `${mapLayerLeft}px`,
                '--map-layer-top': `${mapLayerTop}px`,
                '--map-layer-width': `${mapLayerWidth}px`,
                '--map-reveal-height': `${clampedRevealHeight}px`,
                '--map-handle-width': `${footerHandleRect.width}px`,
                '--map-handle-height': `${footerHandleRect.height}px`,
              }}
              aria-hidden={!isMapLayerVisible}
            >
              <button
                type="button"
                className="ingame-map-floating-handle"
                onPointerDown={handleMapPullPointerDown}
                onPointerMove={handleMapPullPointerMove}
                onPointerUp={handleMapPullPointerUp}
                onPointerCancel={(event: MapPointerEvent) => finishMapDrag(event.pointerId)}
                onLostPointerCapture={(event: MapPointerEvent) => finishMapDrag(event.pointerId)}
                aria-label={clampedRevealHeight > 0 ? '정찰 지도 접기' : '정찰 지도 펼치기'}
              >
                <img src={ingameUiAssets.mapPullHandleBar} alt="" aria-hidden="true" draggable={false} />
              </button>

              <div className="ingame-map-reveal-window">
                <div
                  ref={mapContentRef}
                  className={`ingame-map-content${isMapInteractive ? ' is-interactive' : ''}`}
                >
                  <MapPanel
                    state={mapState}
                    candidates={candidates}
                    isDebug={false}
                    compact
                    onSelectCandidate={handleSelectMapCandidate}
                    onNextTravelEncounter={() => setMapState((current) => advanceTravel(current))}
                    onRecordCurrentNode={() => setMapState((current) => recordCurrentNode(current))}
                    onCancelTravel={() => setMapState((current) => cancelTravel(current))}
                    onClose={closeMapReveal}
                  />
                </div>
              </div>
            </section>
          </>
        )}
        </div>
      </section>

      <AchievementAlbumPopup
        open={isAchievementPopupOpen}
        initialTab="achievement"
        onClose={() => setIsAchievementPopupOpen(false)}
      />
      <OptionsOverlay
        open={isOptionsOpen}
        settings={settings}
        onChange={setSettings}
        onClose={() => setIsOptionsOpen(false)}
      />
    </main>
  );
}
