import { getInventoryItems } from '../game/inventory';
import type { GameState } from '../game/types';

interface Props { state: GameState }

export function InventoryView({ state }: Props) {
  const inventory = getInventoryItems(state);
  return (
    <section className="panel">
      <h1>인벤토리</h1>
      {inventory.length === 0 ? <p className="muted">아직 챙긴 물건이 없다.</p> : (
        <div className="inventory-list">
          {inventory.map((item) => (
            <article className="item-card" key={item.id}>
              <div><h2>{item.name}</h2><p>{item.description}</p></div>
              <div className="badges">
                <span>{item.type}</span>
                {item.isConsumable && <span>소모 가능</span>}
                {item.isAchievementItem && <span>업적 물품</span>}
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="note">펜던트 소모 상태: {state.hasConsumedPendant ? '소모됨' : '보존 중'}</p>
    </section>
  );
}
