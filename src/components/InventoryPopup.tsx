import { InventoryView } from './InventoryView';
import type { GameState } from '../game/types';

interface Props { state: GameState; isOpen: boolean; onClose: () => void }

export function InventoryPopup({ state, isOpen, onClose }: Props) {
  if (!isOpen) return null;
  return (
    <section className="ui-popup inventory-popup" role="dialog" aria-modal="true" aria-label="인벤토리">
      <div className="ui-popup__panel">
        <p className="eyebrow">인벤토리 팝업 초안</p>
        <InventoryView state={state} />
        <p className="note">TODO: 향후 아이템 사용, 버리기, 펜던트 보존/소모 경고 UX를 추가한다.</p>
        <button onClick={onClose}>닫기</button>
      </div>
    </section>
  );
}
