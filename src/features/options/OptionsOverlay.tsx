import { useEffect } from 'react';
import {
  DEFAULT_UI_SETTINGS,
  FONT_SIZE_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  TEXT_SPEED_OPTIONS,
  type TextSpeedKey,
  type UiSettings,
} from './uiSettings';
import './OptionsOverlay.css';

interface OptionsOverlayProps {
  open: boolean;
  settings: UiSettings;
  onChange: (settings: UiSettings) => void;
  onClose: () => void;
}

const previewText = '막사 안은 아직 따뜻합니다.\n\n기름등이 낮게 흔들리고,\n밖에서는 말들이 진흙을 긁는 소리가 들립니다.';

function adjacentValue<T>(options: readonly T[], current: T, direction: -1 | 1): T {
  const currentIndex = Math.max(0, options.indexOf(current));
  const nextIndex = Math.min(options.length - 1, Math.max(0, currentIndex + direction));
  return options[nextIndex];
}

export function OptionsOverlay({ open, settings, onChange, onClose }: OptionsOverlayProps) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const update = (patch: Partial<UiSettings>) => onChange({ ...settings, ...patch });
  const speedOptions = TEXT_SPEED_OPTIONS.map((option) => option.key);
  const speedLabel = TEXT_SPEED_OPTIONS.find((option) => option.key === settings.textSpeed)?.label ?? '보통';

  return (
    <div
      className="options-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="options-title"
      onClick={(event: { stopPropagation: () => void }) => event.stopPropagation()}
      style={{
        '--game-font-size': `${settings.fontSize}px`,
        '--game-line-height': settings.lineHeight,
      }}
    >
      <section className="options-panel" onClick={(event: { stopPropagation: () => void }) => event.stopPropagation()}>
        <div className="options-panel-heading">
          <p>SCOUT FIELD SETTINGS</p>
          <h2 id="options-title">Option</h2>
        </div>

        <div className="options-scroll-area">
          <div className="options-step-row">
            <span>글자 크기</span>
            <div className="options-step-control">
              <button type="button" onClick={() => update({ fontSize: adjacentValue(FONT_SIZE_OPTIONS, settings.fontSize, -1) })} aria-label="글자 크기 줄이기">‹</button>
              <output>{settings.fontSize}</output>
              <button type="button" onClick={() => update({ fontSize: adjacentValue(FONT_SIZE_OPTIONS, settings.fontSize, 1) })} aria-label="글자 크기 늘리기">›</button>
            </div>
          </div>

          <div className="options-step-row">
            <span>행간</span>
            <div className="options-step-control">
              <button type="button" onClick={() => update({ lineHeight: adjacentValue(LINE_HEIGHT_OPTIONS, settings.lineHeight, -1) })} aria-label="행간 줄이기">‹</button>
              <output>{settings.lineHeight.toFixed(2)}</output>
              <button type="button" onClick={() => update({ lineHeight: adjacentValue(LINE_HEIGHT_OPTIONS, settings.lineHeight, 1) })} aria-label="행간 늘리기">›</button>
            </div>
          </div>

          <div className="option-preview" aria-label="텍스트 설정 미리보기">
            {previewText.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>

          <fieldset className="options-volume-group">
            <legend>볼륨</legend>
            <label>
              <span>BGM</span>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.bgmVolume}
                onChange={(event: { target: { value: string } }) => update({ bgmVolume: Number(event.target.value) })}
              />
              <output>{settings.bgmVolume}</output>
            </label>
            <label>
              <span>SFX</span>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.sfxVolume}
                onChange={(event: { target: { value: string } }) => update({ sfxVolume: Number(event.target.value) })}
              />
              <output>{settings.sfxVolume}</output>
            </label>
          </fieldset>

          <div className="options-step-row">
            <span>Text Speed</span>
            <div className="options-step-control options-speed-control">
              <button
                type="button"
                onClick={() => update({ textSpeed: adjacentValue(speedOptions, settings.textSpeed, -1) as TextSpeedKey })}
                aria-label="텍스트 속도 낮추기"
              >‹</button>
              <output>{speedLabel}</output>
              <button
                type="button"
                onClick={() => update({ textSpeed: adjacentValue(speedOptions, settings.textSpeed, 1) as TextSpeedKey })}
                aria-label="텍스트 속도 높이기"
              >›</button>
            </div>
          </div>

          <div className="options-disabled-row" aria-disabled="true">
            <span>Dark Mode</span>
            <span>Off</span>
            <small>미구현</small>
          </div>
        </div>

        <div className="options-actions">
          <button type="button" onClick={onClose}>닫기</button>
          <button type="button" onClick={() => onChange({ ...DEFAULT_UI_SETTINGS })}>기본값</button>
        </div>
      </section>
    </div>
  );
}
