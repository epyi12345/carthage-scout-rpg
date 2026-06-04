import { tutorialEncounters } from '../game/encounter';
import { applyEffects, patchState } from '../game/engine';
import { clearSave } from '../game/save';
import type { GameState } from '../game/types';

interface Props { state: GameState; onStateChange: (state: GameState, shouldSave?: boolean) => void }

export function DevPanel({ state, onStateChange }: Props) {
  const change = (patch: Partial<GameState>) => onStateChange(patchState(state, patch));
  const effect = (effects: Parameters<typeof applyEffects>[1]) => onStateChange(applyEffects(state, effects));
  const togglePendant = () => {
    const hasPendant = state.items.includes('pendant');
    change({ items: hasPendant ? state.items.filter((item) => item !== 'pendant') : [...state.items, 'pendant'] });
  };

  return (
    <section className="panel dev-panel">
      <h1>개발자 테스트 패널</h1>
      <p className="muted">현재 인카운터: <strong>{state.currentEncounterId}</strong></p>
      <label className="field">
        특정 인카운터로 이동
        <select value={state.currentEncounterId} onChange={(event: { target: HTMLSelectElement }) => change({ currentEncounterId: event.target.value, tutorialComplete: false, isDead: false })}>
          {tutorialEncounters.map((encounter) => <option key={encounter.id} value={encounter.id}>{encounter.id}</option>)}
        </select>
      </label>
      <div className="dev-actions">
        <button onClick={() => effect({ hp: 10 })}>체력 +10</button><button onClick={() => effect({ hp: -10 })}>체력 -10</button>
        <button onClick={() => effect({ sanity: 10 })}>정신력 +10</button><button onClick={() => effect({ sanity: -10 })}>정신력 -10</button>
        <button onClick={() => effect({ bodyTemp: 10 })}>체온 +10</button><button onClick={() => effect({ bodyTemp: -10 })}>체온 -10</button>
        <button onClick={() => effect({ food: 1 })}>식량 +1</button><button onClick={() => effect({ food: -1 })}>식량 -1</button>
        <button onClick={() => effect({ mapTools: 1 })}>지도도구 +1</button><button onClick={() => effect({ mapTools: -1 })}>지도도구 -1</button>
        <button onClick={togglePendant}>펜던트 보유 토글</button>
        <button onClick={() => change({ hasConsumedPendant: !state.hasConsumedPendant })}>펜던트 소모 상태 토글</button>
        <button onClick={() => change({ isDead: !state.isDead, deathReason: state.isDead ? null : '개발자 패널로 사망 상태를 켰다.' })}>사망 상태 토글</button>
        <button onClick={() => change({ tutorialComplete: !state.tutorialComplete })}>튜토리얼 완료 토글</button>
        <button className="danger" onClick={() => { clearSave(); onStateChange(state, false); }}>세이브 초기화</button>
      </div>
      <pre className="json-output">{JSON.stringify(state, null, 2)}</pre>
    </section>
  );
}
