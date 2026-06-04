import { useState } from 'react';
import { allEncounters, v02SampleEncounters } from '../game/encounter';
import { applyEffects, patchState } from '../game/engine';
import { clearSave } from '../game/save';
import { traitCatalog, traitIds } from '../game/traits';
import type { GameState, TraitId } from '../game/types';

interface Props { state: GameState; onStateChange: (state: GameState, shouldSave?: boolean) => void }

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function DevPanel({ state, onStateChange }: Props) {
  const [flagQuery, setFlagQuery] = useState('');
  const change = (patch: Partial<GameState>) => onStateChange(patchState(state, patch));
  const effect = (effects: Parameters<typeof applyEffects>[1]) => onStateChange(applyEffects(state, effects));
  const togglePendant = () => change({ items: toggleValue(state.items, 'pendant') });
  const toggleBlackWaterPendant = () => change({ items: toggleValue(state.items, 'black_water_pendant') });
  const visibleFlags = flagQuery.trim() ? state.flags.filter((flag) => flag.includes(flagQuery.trim())) : state.flags;

  return (
    <section className="panel dev-panel">
      <h1>개발자 테스트 패널</h1>
      <p className="muted">현재 인카운터: <strong>{state.currentEncounterId}</strong></p>
      <label className="field">
        특정 인카운터로 이동
        <select value={state.currentEncounterId} onChange={(event: { target: HTMLSelectElement }) => change({ currentEncounterId: event.target.value, tutorialComplete: false, isDead: false })}>
          {allEncounters.map((encounter) => <option key={encounter.id} value={encounter.id}>{encounter.id} · {encounter.category}</option>)}
        </select>
      </label>
      <div className="sample-jumps">
        <p className="muted">샘플 인카운터 바로 이동</p>
        {v02SampleEncounters.map((encounter) => <button key={encounter.id} onClick={() => change({ currentEncounterId: encounter.id, tutorialComplete: false, isDead: false })}>{encounter.title}</button>)}
      </div>
      <div className="dev-actions">
        <button onClick={() => effect({ hp: 10 })}>체력 +10</button><button onClick={() => effect({ hp: -10 })}>체력 -10</button>
        <button onClick={() => effect({ sanity: 10 })}>정신력 +10</button><button onClick={() => effect({ sanity: -10 })}>정신력 -10</button>
        <button onClick={() => effect({ bodyTemp: 10 })}>체온 +10</button><button onClick={() => effect({ bodyTemp: -10 })}>체온 -10</button>
        <button onClick={() => effect({ food: 1 })}>식량 +1</button><button onClick={() => effect({ food: -1 })}>식량 -1</button>
        <button onClick={() => effect({ mapTools: 1 })}>지도도구 +1</button><button onClick={() => effect({ mapTools: -1 })}>지도도구 -1</button>
        <button onClick={togglePendant}>펜던트 보유 토글</button>
        <button onClick={() => change({ hasConsumedPendant: !state.hasConsumedPendant })}>펜던트 소모 상태 토글</button>
        <button onClick={toggleBlackWaterPendant}>검은 물의 펜던트 지급/제거</button>
        <button onClick={() => change({ isDead: !state.isDead, deathReason: state.isDead ? null : '개발자 패널로 사망 상태를 켰다.' })}>사망 상태 토글</button>
        <button onClick={() => change({ tutorialComplete: !state.tutorialComplete })}>튜토리얼 완료 토글</button>
        <button className="danger" onClick={() => { clearSave(); onStateChange(state, false); }}>세이브 초기화</button>
      </div>
      <div className="trait-grid">
        <p className="muted">특성 추가/제거: {state.traits.length ? state.traits.join(', ') : '없음'}</p>
        {traitIds.map((trait) => {
          const traitName = traitCatalog.find((entry) => entry.id === trait)?.name ?? trait;
          return <button className={state.traits.includes(trait) ? 'active' : ''} key={trait} onClick={() => change({ traits: toggleValue(state.traits, trait) })}>{traitName}</button>;
        })}
      </div>
      <label className="field">
        플래그 검색
        <input value={flagQuery} onChange={(event: { target: HTMLInputElement }) => setFlagQuery(event.target.value)} placeholder="flag id" />
      </label>
      <div className="debug-list">
        <strong>flags</strong>
        <p>{visibleFlags.length ? visibleFlags.join(', ') : '표시할 플래그 없음'}</p>
      </div>
      <div className="debug-list">
        <strong>chainState</strong>
        <p>{state.chainStates.length ? state.chainStates.map((chain) => `${chain.chainId}:${chain.step}`).join(', ') : '진행 중인 체인 없음'}</p>
      </div>
      <pre className="json-output">{JSON.stringify(state, null, 2)}</pre>
    </section>
  );
}
