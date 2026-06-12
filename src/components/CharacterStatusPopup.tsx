import type { GameState } from '../game/types';

interface Props { state: GameState; isOpen: boolean; onClose: () => void }

export function CharacterStatusPopup({ state, isOpen, onClose }: Props) {
  if (!isOpen) return null;
  return (
    <section className="ui-popup character-status-popup" role="dialog" aria-modal="true" aria-label="정찰대장 상태">
      <div className="ui-popup__panel">
        <p className="eyebrow">상태 팝업 초안</p>
        <h2>정찰대장 상태</h2>
        <p className="note">TODO: 초상화, 부상, 피로, 온기, 사기/SAN 세부 표시를 이 영역에 정리한다.</p>
        <div className="record-summary">
          <span>체력: {state.player.health}</span>
          <span>체온: {state.player.warmth}</span>
          <span>피로: {state.player.fatigue}</span>
          <span>사기: {state.player.morale}</span>
        </div>
        <button onClick={onClose}>닫기</button>
      </div>
    </section>
  );
}
