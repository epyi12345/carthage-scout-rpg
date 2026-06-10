import { useState } from 'react';
import { MapPullHandle } from './MapPullHandle';
import { ingameUiAssets } from './ingameAssets';
import './InGamePlayScreen.css';

export type ChoiceViewModel = {
  id: string;
  label: string;
  disabled?: boolean;
};

export type InGamePlayScreenProps = {
  narrative?: string[];
  illustrationSrc?: string;
  choices?: ChoiceViewModel[];
  onChoiceSelect?: (choiceId: string) => void;
  onOpenCharacter?: () => void;
  onOpenInventory?: () => void;
  onOpenSettings?: () => void;
  onOpenAchievements?: () => void;
  onMapPullStart?: () => void;
};

const fallbackNarrative = [
  '눈보라가 잠시 잦아든다.',
  '멀리서 얼어붙은 절벽의 윤곽이 드러난다.',
  '길을 잘못 들면 다시 돌아오기 어려울 것이다.',
];

const topSlots = [
  { id: 'character', label: '초상', action: 'character' },
  { id: 'warmth', label: '체온' },
  { id: 'health', label: '체력' },
  { id: 'inventory', label: '가방', action: 'inventory' },
  { id: 'settings', label: '설정', action: 'settings' },
  { id: 'achievements', label: '업적', action: 'achievements' },
];

export function InGamePlayScreen({
  narrative = fallbackNarrative,
  illustrationSrc,
  choices = [],
  onChoiceSelect,
  onOpenCharacter,
  onOpenInventory,
  onOpenSettings,
  onOpenAchievements,
  onMapPullStart,
}: InGamePlayScreenProps) {
  const [mapPullState, setMapPullState] = useState<'idle' | 'started'>('idle');
  const splitIndex = illustrationSrc ? Math.max(1, Math.ceil(narrative.length / 2)) : narrative.length;
  const beforeIllustration = narrative.slice(0, splitIndex);
  const afterIllustration = narrative.slice(splitIndex);

  const handleSlotAction = (action?: string) => {
    if (action === 'character') onOpenCharacter?.();
    if (action === 'inventory') onOpenInventory?.();
    if (action === 'settings') onOpenSettings?.();
    if (action === 'achievements') onOpenAchievements?.();
  };

  const handleMapPullStart = () => {
    setMapPullState('started');
    onMapPullStart?.();
  };

  return (
    <main
      className="ingame-play-screen"
      style={{ '--ingame-parchment-bg': `url(${ingameUiAssets.parchmentBackground})` }}
    >
      <div className="ingame-vignette-layer" aria-hidden="true" />
      <img className="ingame-header-ornament" src={ingameUiAssets.topOrnament} alt="" draggable={false} />

      <header className="ingame-top-status" aria-label="상단 상태 슬롯">
        {topSlots.map((slot) => (
          <button
            key={slot.id}
            type="button"
            className="ingame-status-slot"
            onClick={() => handleSlotAction(slot.action)}
            disabled={!slot.action}
          >
            <span>{slot.label}</span>
          </button>
        ))}
      </header>

      <img className="ingame-top-divider" src={ingameUiAssets.topDivider} alt="" draggable={false} />

      <section className="ingame-scroll-content" aria-label="인게임 진행 내용">
        {beforeIllustration.length > 0 && (
          <div className="ingame-narrative-block">
            {beforeIllustration.map((line) => <p key={line}>{line}</p>)}
          </div>
        )}

        {illustrationSrc && (
          <figure className="ingame-illustration-block">
            <img src={illustrationSrc} alt="정찰 장면" draggable={false} />
          </figure>
        )}

        {afterIllustration.length > 0 && (
          <div className="ingame-narrative-block">
            {afterIllustration.map((line) => <p key={line}>{line}</p>)}
          </div>
        )}

        {choices.length > 0 && (
          <div className="ingame-choice-list" aria-label="선택지">
            {choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className="ingame-choice-button"
                disabled={choice.disabled}
                onClick={() => onChoiceSelect?.(choice.id)}
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}
      </section>

      <img className="ingame-footer-ornament" src={ingameUiAssets.bottomOrnament} alt="" draggable={false} />
      <MapPullHandle onMapPullStart={handleMapPullStart} />
      <p className="ingame-map-pull-state" aria-live="polite">
        {mapPullState === 'started' ? '지도 패널 연결 준비됨' : '지도 손잡이를 눌러 지도 패널을 준비한다'}
      </p>
    </main>
  );
}
