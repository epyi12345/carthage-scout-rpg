import { useEffect, useState } from 'react';
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


type MapScrollState = 'closed' | 'dragging' | 'open';

type HandleRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const MAP_SCROLL_OPEN_THRESHOLD = 0.25;
const MAP_SCROLL_TAP_DISTANCE = 6;
const MAP_SCROLL_MAX_WIDTH = 380;
const MAP_SCROLL_TOP_GAP = 48;

function getFooterMapHandleRect(): HandleRect | null {
  if (typeof document === 'undefined') return null;
  const element = document.querySelector('.footer-map-handle');
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

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
  const [mapScrollState, setMapScrollState] = useState<MapScrollState>('closed');
  const [mapScrollOffset, setMapScrollOffset] = useState(0);
  const [footerHandleRect, setFooterHandleRect] = useState<HandleRect | null>(null);
  const [mapDragStartY, setMapDragStartY] = useState<number | null>(null);
  const [mapDragStartOffset, setMapDragStartOffset] = useState(0);
  const viewportSize = useViewportSize();
  const uiScale = Math.min(
    viewportSize.width / INGAME_DESIGN_WIDTH,
    viewportSize.height / INGAME_DESIGN_HEIGHT,
  );
  const mapLayerWidth = footerHandleRect ? Math.min(viewportSize.width * 0.88, MAP_SCROLL_MAX_WIDTH * uiScale) : 0;
  const mapOpenOffset = footerHandleRect ? Math.max(footerHandleRect.top - MAP_SCROLL_TOP_GAP * uiScale, 0) : 0;
  const mapLayerLeft = footerHandleRect ? footerHandleRect.left + footerHandleRect.width / 2 - mapLayerWidth / 2 : 0;
  const mapLayerTop = footerHandleRect ? footerHandleRect.top - mapScrollOffset : 0;
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

  useEffect(() => {
    const updateHandleRect = () => setFooterHandleRect(getFooterMapHandleRect());

    updateHandleRect();
    window.addEventListener('resize', updateHandleRect);
    window.addEventListener('orientationchange', updateHandleRect);

    return () => {
      window.removeEventListener('resize', updateHandleRect);
      window.removeEventListener('orientationchange', updateHandleRect);
    };
  }, [viewportSize.width, viewportSize.height]);

  const syncFooterHandleRect = () => {
    const nextRect = getFooterMapHandleRect();
    if (nextRect) setFooterHandleRect(nextRect);
    return nextRect;
  };

  const openMapScroll = () => {
    const rect = syncFooterHandleRect();
    if (!rect) return;
    const nextOpenOffset = Math.max(rect.top - MAP_SCROLL_TOP_GAP * uiScale, 0);
    setMapScrollOffset(nextOpenOffset);
    setMapScrollState('open');
  };

  const closeMapScroll = () => {
    setMapScrollOffset(0);
    setMapScrollState('closed');
  };

  const toggleMapScroll = () => {
    if (mapScrollState === 'open') closeMapScroll();
    else openMapScroll();
  };

  const handleMapPullPointerDown = (event: { clientY: number; pointerId?: number; currentTarget?: { setPointerCapture?: (pointerId: number) => void } }) => {
    const rect = syncFooterHandleRect();
    if (!rect) return;
    if (event.pointerId !== undefined) event.currentTarget?.setPointerCapture?.(event.pointerId);
    const nextOpenOffset = Math.max(rect.top - MAP_SCROLL_TOP_GAP * uiScale, 0);
    const startOffset = mapScrollState === 'open' ? nextOpenOffset : mapScrollOffset;
    setMapDragStartY(event.clientY);
    setMapDragStartOffset(startOffset);
    setMapScrollOffset(startOffset);
    setMapScrollState('dragging');
  };

  const handleMapPullPointerMove = (event: { clientY: number }) => {
    if (mapScrollState !== 'dragging' || mapDragStartY === null) return;
    const deltaUp = mapDragStartY - event.clientY;
    setMapScrollOffset(clamp(mapDragStartOffset + deltaUp, 0, mapOpenOffset));
  };

  const handleMapPullPointerUp = (event: { clientY: number }) => {
    if (mapScrollState !== 'dragging' || mapDragStartY === null) return;
    const moved = Math.abs(event.clientY - mapDragStartY);
    setMapDragStartY(null);

    if (moved < MAP_SCROLL_TAP_DISTANCE) {
      toggleMapScroll();
      return;
    }

    if (mapOpenOffset > 0 && mapScrollOffset / mapOpenOffset >= MAP_SCROLL_OPEN_THRESHOLD) openMapScroll();
    else closeMapScroll();
  };

  const handleSelectMapCandidate = (candidate: DirectionCandidate) => {
    setMapState((current) => selectDirectionCandidate(current, candidate));
  };

  return (
    <main className="ingame-play-screen">
      <section
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
        <header className="ingame-header">
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

        {footerHandleRect && (
          <>
            <button
              type="button"
              className="ingame-map-pull-hit-area"
              style={{
                '--map-hit-left': `${footerHandleRect.left}px`,
                '--map-hit-top': `${footerHandleRect.top}px`,
                '--map-hit-width': `${footerHandleRect.width}px`,
                '--map-hit-height': `${footerHandleRect.height}px`,
              }}
              onPointerDown={handleMapPullPointerDown}
              onPointerMove={handleMapPullPointerMove}
              onPointerUp={handleMapPullPointerUp}
              onPointerCancel={closeMapScroll}
              aria-label={mapScrollState === 'open' ? '정찰 지도 접기' : '정찰 지도 펼치기'}
            />

            <section
              className={`ingame-map-scroll-layer is-${mapScrollState}`}
              style={{
                '--map-layer-left': `${mapLayerLeft}px`,
                '--map-layer-top': `${mapLayerTop}px`,
                '--map-layer-width': `${mapLayerWidth}px`,
                '--map-handle-width': `${footerHandleRect.width}px`,
                '--map-handle-height': `${footerHandleRect.height}px`,
              }}
              aria-hidden={mapScrollState === 'closed'}
            >
              <button
                type="button"
                className="ingame-map-scroll-handle"
                onPointerDown={handleMapPullPointerDown}
                onPointerMove={handleMapPullPointerMove}
                onPointerUp={handleMapPullPointerUp}
                onPointerCancel={closeMapScroll}
                aria-label={mapScrollState === 'open' ? '정찰 지도 접기' : '정찰 지도 펼치기'}
              >
                <img src={ingameUiAssets.mapPullHandleBar} alt="" aria-hidden="true" draggable={false} />
              </button>

              <div className="ingame-map-paper">
                <MapPanel
                  state={mapState}
                  candidates={candidates}
                  isDebug={false}
                  compact
                  onSelectCandidate={handleSelectMapCandidate}
                  onNextTravelEncounter={() => setMapState((current) => advanceTravel(current))}
                  onRecordCurrentNode={() => setMapState((current) => recordCurrentNode(current))}
                  onCancelTravel={() => setMapState((current) => cancelTravel(current))}
                  onClose={closeMapScroll}
                />
              </div>
            </section>
          </>
        )}

          </div>
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
