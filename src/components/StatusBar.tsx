import type { GameState } from '../game/types';

interface Props { state: GameState }

export function StatusBar({ state }: Props) {
  const stats = [
    ['체력', `${state.hp}/${state.maxHp}`],
    ['정신력', `${state.sanity}/${state.maxSanity}`],
    ['체온', `${state.bodyTemp}/${state.maxBodyTemp}`],
    ['식량', state.food],
    ['지도도구', state.mapTools],
  ];
  return (
    <header className="status-bar">
      <div className="status-meta">Day {state.day} · Slot {state.slot} · {state.location}</div>
      <div className="status-grid">
        {stats.map(([label, value]) => <div className="stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>
    </header>
  );
}
