import { useEffect, useState } from 'react';
import './AchievementAlbumPopup.css';

type AchievementAlbumTab = 'achievement' | 'album';

interface AchievementItem {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  thumbnailSrc?: string;
}

interface AlbumItem {
  id: string;
  title: string;
  unlocked: boolean;
  imageSrc?: string;
}

interface AchievementAlbumPopupProps {
  open: boolean;
  initialTab?: AchievementAlbumTab;
  onClose: () => void;
}

const uiAsset = (filename: string) => `${import.meta.env.BASE_URL}assets/ui/${filename}`;

const popupAssets = {
  parchment: uiAsset('ui_popup_parchment_large.png'),
  vignette: uiAsset('ui_popup_outer_vignette_frame.png'),
  achievementTabActive: uiAsset('ui_tab_achievement_active.png'),
  achievementTabInactive: uiAsset('ui_tab_achievement_inactive.png'),
  albumTabActive: uiAsset('ui_tab_album_active.png'),
  albumTabInactive: uiAsset('ui_tab_album_inactive.png'),
  achievementRow: uiAsset('ui_achievement_row_frame.png'),
  achievementThumbnailSlot: uiAsset('ui_achievement_thumbnail_slot.png'),
  achievementLockedOverlay: uiAsset('ui_achievement_locked_overlay.png'),
  albumGridSlot: uiAsset('ui_album_grid_slot.png'),
  albumLockedSlot: uiAsset('ui_album_locked_slot.png'),
  backArrow: uiAsset('ui_icon_back_arrow.png'),
  closeX: uiAsset('ui_icon_close_x.png'),
  scrollbarTrack: uiAsset('ui_scrollbar_track_vertical.png'),
  scrollbarThumb: uiAsset('ui_scrollbar_thumb_vertical.png'),
};

const ACHIEVEMENT_ITEMS: AchievementItem[] = [
  { id: 'ach_001', title: '첫 기록', description: '첫 번째 기록을 남겼다.', unlocked: true },
  { id: 'ach_002', title: '눈 속의 생존자', description: '눈사태 이후 살아남았다.', unlocked: false },
  { id: 'ach_003', title: '길의 징후', description: '산악 지형의 단서를 발견했다.', unlocked: false },
  { id: 'ach_004', title: '정찰대장', description: '위험 지역을 정찰했다.', unlocked: false },
  { id: 'ach_005', title: '지도 조각', description: '지도에 새로운 정보를 기록했다.', unlocked: false },
];

const ALBUM_ITEMS: AlbumItem[] = [
  { id: 'album_001', title: '눈 덮인 고개', unlocked: true },
  { id: 'album_002', title: '부서진 장비', unlocked: false },
  { id: 'album_003', title: '야영의 불씨', unlocked: false },
  { id: 'album_004', title: '절벽의 흔적', unlocked: false },
  { id: 'album_005', title: '짐승의 발자국', unlocked: false },
  { id: 'album_006', title: '잃어버린 길', unlocked: false },
  { id: 'album_007', title: '말라붙은 계곡', unlocked: false },
  { id: 'album_008', title: '검은 산등성이', unlocked: false },
];

function AchievementList() {
  return (
    <div className="achievement-scroll-area">
      <div className="achievement-list">
        {ACHIEVEMENT_ITEMS.map((item) => (
          <article className="achievement-row" key={item.id}>
            <img className="achievement-row-bg" src={popupAssets.achievementRow} alt="" aria-hidden="true" draggable={false} />

            <div className="achievement-row-text">
              <h3 className="achievement-row-title">{item.title}</h3>
              <p className="achievement-row-desc">{item.description}</p>
            </div>

            <div className="achievement-thumb" aria-hidden="true">
              <img className="achievement-thumb-slot" src={popupAssets.achievementThumbnailSlot} alt="" draggable={false} />
              {item.thumbnailSrc && item.unlocked && <img className="achievement-thumb-image" src={item.thumbnailSrc} alt="" draggable={false} />}
              {!item.unlocked && <img className="achievement-locked-overlay" src={popupAssets.achievementLockedOverlay} alt="" draggable={false} />}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function AlbumGrid() {
  return (
    <div className="album-scroll-area">
      <div className="album-grid">
        {ALBUM_ITEMS.map((item) => (
          <figure className="album-slot" key={item.id}>
            <img
              className="album-slot-bg"
              src={item.unlocked ? popupAssets.albumGridSlot : popupAssets.albumLockedSlot}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
            {item.imageSrc && item.unlocked && <img className="album-slot-image" src={item.imageSrc} alt={item.title} draggable={false} />}
          </figure>
        ))}
      </div>
    </div>
  );
}

export function AchievementAlbumPopup({ open, initialTab = 'achievement', onClose }: AchievementAlbumPopupProps) {
  const [activeTab, setActiveTab] = useState<AchievementAlbumTab>(initialTab);

  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="achievement-popup-layer"
      role="dialog"
      aria-modal="true"
      aria-label="업적과 앨범"
      onClick={(event: { stopPropagation: () => void }) => event.stopPropagation()}
      style={{
        '--achievement-scrollbar-track': `url(${popupAssets.scrollbarTrack})`,
        '--achievement-scrollbar-thumb': `url(${popupAssets.scrollbarThumb})`,
      }}
    >
      <img className="achievement-popup-vignette" src={popupAssets.vignette} alt="" aria-hidden="true" draggable={false} />

      <section className="achievement-popup-panel-wrap" onClick={(event: { stopPropagation: () => void }) => event.stopPropagation()}>
        <img className="achievement-popup-panel-bg" src={popupAssets.parchment} alt="" aria-hidden="true" draggable={false} />

        <button type="button" className="achievement-popup-back" onClick={onClose} aria-label="뒤로가기">
          <img src={popupAssets.backArrow} alt="" aria-hidden="true" draggable={false} />
        </button>

        <button type="button" className="achievement-popup-close" onClick={onClose} aria-label="닫기">
          <img src={popupAssets.closeX} alt="" aria-hidden="true" draggable={false} />
        </button>

        <div className="achievement-popup-tabs" role="tablist" aria-label="업적과 앨범 탭">
          <button
            type="button"
            className="achievement-popup-tab"
            role="tab"
            aria-selected={activeTab === 'achievement'}
            onClick={() => setActiveTab('achievement')}
          >
            <img
              src={activeTab === 'achievement' ? popupAssets.achievementTabActive : popupAssets.achievementTabInactive}
              alt="Achievement"
              draggable={false}
            />
          </button>

          <button
            type="button"
            className="achievement-popup-tab"
            role="tab"
            aria-selected={activeTab === 'album'}
            onClick={() => setActiveTab('album')}
          >
            <img src={activeTab === 'album' ? popupAssets.albumTabActive : popupAssets.albumTabInactive} alt="Album" draggable={false} />
          </button>
        </div>

        <div className="achievement-popup-content">{activeTab === 'achievement' ? <AchievementList /> : <AlbumGrid />}</div>
      </section>
    </div>
  );
}
