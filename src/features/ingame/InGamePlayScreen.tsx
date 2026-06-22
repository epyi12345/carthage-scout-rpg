import { useEffect, useState } from 'react';
import { AchievementAlbumPopup } from '../../components/AchievementAlbumPopup';
import type { Encounter, EncounterChoice } from '../../game/types';
import { MapPanel } from '../map/MapPanel';
import { advanceTravel, cancelTravel, getCurrentNode, recordCurrentNode, selectDirectionCandidate } from '../map/mapLogic';
import type { DirectionCandidate, MapRunState } from '../map/mapTypes';
import { useMapRun } from '../map/useMapRun';
import { OptionsOverlay } from '../options/OptionsOverlay';
import { getTextSpeedDelay, loadUiSettings, saveUiSettings } from '../options/uiSettings';
import { useTypewriterText } from '../typing/useTypewriterText';
import { ingameUiAssets } from './ingameAssets';
import './InGamePlayScreen.css';

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


interface MapEventChoice {
  label: string;
  action: () => void;
}

interface MapEventText {
  id: string;
  title: string;
  body: string;
  choices: MapEventChoice[];
}

type MapDrawerState = 'closed' | 'dragging' | 'open';

const MAP_DRAWER_HEIGHT_PX = 576;
const MAP_DRAWER_HANDLE_HEIGHT_PX = 66;
const MAP_DRAWER_CLOSED_TRANSLATE_PX = MAP_DRAWER_HEIGHT_PX - MAP_DRAWER_HANDLE_HEIGHT_PX;
const MAP_DRAWER_DRAG_THRESHOLD_PX = 40;
const MAP_DRAWER_TAP_THRESHOLD_PX = 8;

function clampMapDrawerTranslate(value: number): number {
  return Math.max(0, Math.min(MAP_DRAWER_CLOSED_TRANSLATE_PX, value));
}

function createTravelOrArrivalEvent(state: MapRunState, onAdvance: () => void, onRecord: () => void, onOpenMap: () => void): MapEventText {
  const travel = state.currentTargetId ? state.travelQueue[state.travelStepIndex] : undefined;
  if (travel) {
    return {
      id: `MAP_TRAVEL_${state.travelStepIndex + 1}`,
      title: travel.title,
      body: travel.body,
      choices: [
        { label: '계속 전진한다', action: onAdvance },
        { label: '지도를 다시 펼친다', action: onOpenMap },
      ],
    };
  }

  const node = getCurrentNode(state);
  if (node) {
    return {
      id: node.id,
      title: node.title,
      body: `당신은 ${node.hint}

이 지점은 지도에 남길 수 있습니다.`,
      choices: [
        { label: node.recorded ? '이미 기록된 지점이다' : '기록한다', action: onRecord },
        { label: '다음 방향을 고른다', action: onOpenMap },
      ],
    };
  }

  return {
    id: 'MAP_READY',
    title: '정찰 지도',
    body: `지도에 아직 새로 확인한 지점이 없습니다.

하단 지도 핸들을 올려 다음 방향을 고르십시오.`,
    choices: [{ label: '지도를 펼친다', action: onOpenMap }],
  };
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
  const [mapDrawerState, setMapDrawerState] = useState<MapDrawerState>('closed');
  const [mapDrawerTranslateY, setMapDrawerTranslateY] = useState(MAP_DRAWER_CLOSED_TRANSLATE_PX);
  const [mapEvent, setMapEvent] = useState<MapEventText | null>(null);
  const [mapHandlePointerStartY, setMapHandlePointerStartY] = useState<number | null>(null);
  const [mapHandlePointerStartTranslateY, setMapHandlePointerStartTranslateY] = useState(MAP_DRAWER_CLOSED_TRANSLATE_PX);
  const imageContent = !mapEvent && encounter ? splitImagePlaceholder(encounter.body, encounter.imagePlaceholder) : null;
  const bodyText = imageContent ? `${imageContent.before}${imageContent.after}` : '';
  const displayedEncounterId = mapEvent ? mapEvent.id : resultText ? resultEncounterId : encounter?.id;
  const displayedEncounterTitle = mapEvent ? mapEvent.title : resultText ? resultEncounterTitle : encounter?.title;
  const activeText = mapEvent?.body ?? resultText ?? bodyText;
  const typingKey = mapEvent
    ? `map:${mapEvent.id}:${mapEvent.body}`
    : resultText
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


  const openMapSheet = () => {
    setMapDrawerState('open');
    setMapDrawerTranslateY(0);
  };
  const closeMapSheet = () => {
    setMapDrawerState('closed');
    setMapDrawerTranslateY(MAP_DRAWER_CLOSED_TRANSLATE_PX);
  };
  const handleSelectMapCandidate = (candidate: DirectionCandidate) => {
    closeMapSheet();
    setMapState((current) => {
      const nextState = selectDirectionCandidate(current, candidate);
      setMapEvent(createTravelOrArrivalEvent(nextState, handleAdvanceMapTravel, handleRecordMapNode, openMapSheet));
      return nextState;
    });
  };
  function handleAdvanceMapTravel() {
    setMapState((current) => {
      const nextState = advanceTravel(current);
      setMapEvent(createTravelOrArrivalEvent(nextState, handleAdvanceMapTravel, handleRecordMapNode, openMapSheet));
      return nextState;
    });
  }
  function handleRecordMapNode() {
    setMapState((current) => recordCurrentNode(current));
    setMapEvent({
      id: 'MAP_RECORD',
      title: '지도에 기록하다',
      body: `당신은 현재 지점을 양피지 위에 남깁니다.

기억은 흐려질 수 있지만, 기록은 복귀길에 다시 확인할 수 있습니다.`,
      choices: [{ label: '지도를 펼친다', action: openMapSheet }],
    });
  }
  const handleCancelMapTravel = () => {
    setMapState((current) => {
      const nextState = cancelTravel(current);
      setMapEvent(createTravelOrArrivalEvent(nextState, handleAdvanceMapTravel, handleRecordMapNode, openMapSheet));
      return nextState;
    });
  };
  const handleMapHandlePointerDown = (event: { clientY: number; pointerId?: number; currentTarget?: { setPointerCapture?: (pointerId: number) => void } }) => {
    if (event.pointerId !== undefined) event.currentTarget?.setPointerCapture?.(event.pointerId);
    setMapHandlePointerStartY(event.clientY);
    setMapHandlePointerStartTranslateY(mapDrawerState === 'open' ? 0 : MAP_DRAWER_CLOSED_TRANSLATE_PX);
    setMapDrawerState('dragging');
  };
  const handleMapHandlePointerMove = (event: { clientY: number }) => {
    if (mapDrawerState !== 'dragging' || mapHandlePointerStartY === null) return;
    const deltaY = event.clientY - mapHandlePointerStartY;
    setMapDrawerTranslateY(clampMapDrawerTranslate(mapHandlePointerStartTranslateY + deltaY));
  };
  const handleMapHandlePointerUp = (event: { clientY: number }) => {
    const startY = mapHandlePointerStartY;
    const startTranslateY = mapHandlePointerStartTranslateY;
    setMapHandlePointerStartY(null);
    if (startY === null) {
      setMapDrawerState(mapDrawerTranslateY <= MAP_DRAWER_CLOSED_TRANSLATE_PX / 2 ? 'open' : 'closed');
      return;
    }

    const deltaY = event.clientY - startY;
    const wasTap = Math.abs(deltaY) < MAP_DRAWER_TAP_THRESHOLD_PX;
    if (wasTap) {
      if (startTranslateY === 0) closeMapSheet();
      else openMapSheet();
      return;
    }

    if (startTranslateY === MAP_DRAWER_CLOSED_TRANSLATE_PX) {
      if (deltaY <= -MAP_DRAWER_DRAG_THRESHOLD_PX || mapDrawerTranslateY <= MAP_DRAWER_CLOSED_TRANSLATE_PX * 0.72) openMapSheet();
      else closeMapSheet();
      return;
    }

    if (deltaY >= MAP_DRAWER_DRAG_THRESHOLD_PX || mapDrawerTranslateY >= MAP_DRAWER_CLOSED_TRANSLATE_PX * 0.28) closeMapSheet();
    else openMapSheet();
  };

  return (
    <main className="ingame-play-screen">
      <section
        className="ingame-stage"
        aria-label="인게임 화면"
        style={{
          '--game-font-size': `${settings.fontSize}px`,
          '--game-line-height': settings.lineHeight,
        }}
      >
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
          {mapEvent || encounter ? (
            <article className="ingame-encounter-content">
              <p className="ingame-encounter-id">{displayedEncounterId}</p>
              <h1 className="ingame-encounter-title">{displayedEncounterTitle}</h1>

              {mapEvent ? (
                <div className="ingame-result-block">
                  {renderParagraphs(typewriter.visibleText)}
                  {typewriter.isComplete && (
                    <div className="ingame-choice-list" aria-label="지도 이벤트 선택지">
                      {mapEvent.choices.map((choice) => (
                        <button type="button" className="ingame-choice-button" key={choice.label} onClick={choice.action}>
                          {choice.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : resultText ? (
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
          <div className="ingame-bottom-ornament-wrap">
            <img
              className="ingame-bottom-ornament"
              src={ingameUiAssets.bottomDividerRightSource}
              alt=""
              draggable={false}
            />
          </div>
        </footer>

        <section
          className={`ingame-map-drawer is-${mapDrawerState}`}
          aria-hidden={mapDrawerState === 'closed'}
          style={{ '--map-drawer-translate': `${mapDrawerTranslateY}px` }}
        >
          <button
            type="button"
            className="ingame-map-drawer-handle"
            onPointerDown={handleMapHandlePointerDown}
            onPointerMove={handleMapHandlePointerMove}
            onPointerUp={handleMapHandlePointerUp}
            onPointerCancel={closeMapSheet}
            aria-label={mapDrawerState === 'open' ? '정찰 지도 접기' : '정찰 지도 펼치기'}
          >
            <img
              className="ingame-map-drawer-handle-image"
              src={ingameUiAssets.mapPullHandleBar}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
          </button>
          <div className="ingame-map-paper">
            <MapPanel
              state={mapState}
              candidates={candidates}
              isDebug={false}
              compact
              onSelectCandidate={handleSelectMapCandidate}
              onNextTravelEncounter={handleAdvanceMapTravel}
              onRecordCurrentNode={handleRecordMapNode}
              onCancelTravel={handleCancelMapTravel}
              onClose={closeMapSheet}
            />
          </div>
        </section>
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
