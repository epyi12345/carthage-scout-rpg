import type { Encounter, EncounterChoice } from '../../game/types';
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
  const imageContent = encounter ? splitImagePlaceholder(encounter.body, encounter.imagePlaceholder) : null;
  const displayedEncounterId = resultText ? resultEncounterId : encounter?.id;
  const displayedEncounterTitle = resultText ? resultEncounterTitle : encounter?.title;

  return (
    <main className="ingame-play-screen">
      <section className="ingame-stage" aria-label="인게임 화면">
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

        <header className="ingame-header" aria-hidden="true">
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

            <img
              className="ingame-header-toggle"
              src={ingameUiAssets.smallToggleHorizontal}
              alt=""
              draggable={false}
            />
          </div>
        </header>

        <section className="ingame-text-scroll" aria-label="인게임 텍스트 영역">
          {encounter ? (
            <article className="ingame-encounter-content">
              <p className="ingame-encounter-id">{displayedEncounterId}</p>
              <h1 className="ingame-encounter-title">{displayedEncounterTitle}</h1>

              {resultText ? (
                <div className="ingame-result-block">
                  {renderParagraphs(resultText)}
                  <button type="button" className="ingame-choice-button" onClick={onContinueResult}>
                    계속
                  </button>
                </div>
              ) : (
                <>
                  {imageContent && renderParagraphs(imageContent.before)}
                  {imageContent?.placeholder && (
                    <div className="ingame-image-placeholder" aria-label="이미지 임시 영역">
                      {renderParagraphs(imageContent.placeholder)}
                    </div>
                  )}
                  {imageContent && renderParagraphs(imageContent.after)}

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
      </section>
    </main>
  );
}
