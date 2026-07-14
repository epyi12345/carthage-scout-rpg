import { useEffect, useState } from 'react';
import { AchievementAlbumPopup } from '../../components/AchievementAlbumPopup';
import type { Encounter, EncounterChoice } from '../../game/types';
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
  const viewportSize = useViewportSize();
  const uiScale = Math.min(
    viewportSize.width / INGAME_DESIGN_WIDTH,
    viewportSize.height / INGAME_DESIGN_HEIGHT,
  );
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

        <img
          className="ingame-map-handle-visual"
          src={ingameUiAssets.mapPullHandleBar}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
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
