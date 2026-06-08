import type { GameState } from '../game/types';

interface Props { state: GameState }

export function StatusBar({ state }: Props) {
  const stats = [
    ['체력', `${state.player.health}/${state.player.maxHealth}`],
    ['식량', state.player.food],
    ['체온', `${state.player.warmth}/${state.player.maxWarmth}`],
    ['피로', `${state.player.fatigue}/${state.player.maxFatigue}`],
    ['일차', state.player.day],
  ];
  return (
    <header className="status-bar">
      <div className="status-meta">Seed {state.mapSeed} · 위치 {state.player.position}</div>
      <div className="status-grid">
        {stats.map(([label, value]) => <div className="stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>
    </header>
  );
}
