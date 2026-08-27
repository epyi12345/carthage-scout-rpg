import { useState } from 'react';
import { allEncounters, mvpEncounterCatalog, v02SampleEncounters } from '../game/encounter';
import { applyEffects } from '../game/encounterEngine';
import { clearSave } from '../game/saveLoad';
import { traitCatalog, traitIds } from '../game/traits';
import type { GameState, TraitId } from '../game/types';

interface Props { state: GameState; onStateChange: (state: GameState, shouldSave?: boolean) => void }

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function DevPanel({ state, onStateChange }: Props) {
  const [flagQuery, setFlagQuery] = useState('');
  const change = (next: GameState) => onStateChange(next);
  const effect = (effects: Parameters<typeof applyEffects>[1]) => onStateChange(applyEffects(state, effects));
  const togglePendant = () => change({ ...state, inventory: { itemIds: toggleValue(state.inventory.itemIds, 'pendant') } });
  const toggleBlackWaterPendant = () => change({ ...state, inventory: { itemIds: toggleValue(state.inventory.itemIds, 'black_water_pendant') } });
  const visibleFlags = flagQuery.trim() ? state.flags.filter((flag) => flag.includes(flagQuery.trim())) : state.flags;

  return (
    <section className="panel dev-panel">
      <h1>개발자 테스트 패널</h1>
      <p className="muted">현재 인카운터: <strong>{state.encounter.currentId ?? '없음'}</strong></p>
      <label className="field">
        특정 인카운터로 이동
        <select value={state.encounter.currentId ?? ''} onChange={(event: { target: HTMLSelectElement }) => change({ ...state, encounter: { ...state.encounter, currentId: event.target.value || null }, map: { ...state.map, tutorialComplete: false }, player: { ...state.player, isAlive: true } })}>
          <option value="">인카운터 없음</option>
          {allEncounters.map((encounter) => <option key={encounter.id} value={encounter.id}>{encounter.id} · {encounter.category}</option>)}
        </select>
      </label>
      <div className="sample-jumps">
        <p className="muted">MVP 인카운터 바로 이동</p>
        {mvpEncounterCatalog.map((encounter) => <button key={encounter.id} onClick={() => change({ ...state, encounter: { ...state.encounter, currentId: encounter.id }, map: { ...state.map, tutorialComplete: false }, player: { ...state.player, isAlive: true } })}>{encounter.title}</button>)}
        <p className="muted">v0.2 샘플 인카운터 바로 이동</p>
        {v02SampleEncounters.map((encounter) => <button key={encounter.id} onClick={() => change({ ...state, encounter: { ...state.encounter, currentId: encounter.id }, map: { ...state.map, tutorialComplete: false }, player: { ...state.player, isAlive: true } })}>{encounter.title}</button>)}
      </div>
      <div className="dev-actions">
        <button onClick={() => effect({ hp: 10 })}>체력 +10</button><button onClick={() => effect({ hp: -10 })}>체력 -10</button>
        <button onClick={() => effect({ sanity: 10 })}>정신력 +10</button><button onClick={() => effect({ sanity: -10 })}>정신력 -10</button>
        <button onClick={() => effect({ bodyTemp: 10 })}>체온 +10</button><button onClick={() => effect({ bodyTemp: -10 })}>체온 -10</button>
        <button onClick={() => effect({ food: 1 })}>식량 +1</button><button onClick={() => effect({ food: -1 })}>식량 -1</button>
        <button onClick={() => effect({ mapTools: 1 })}>지도도구 +1</button><button onClick={() => effect({ mapTools: -1 })}>지도도구 -1</button>
        <button onClick={togglePendant}>펜던트 보유 토글</button>
        <button onClick={() => change({ ...state, encounter: { ...state.encounter, hasConsumedPendant: !state.encounter.hasConsumedPendant } })}>펜던트 소모 상태 토글</button>
        <button onClick={toggleBlackWaterPendant}>검은 물의 펜던트 지급/제거</button>
        <button onClick={() => change({ ...state, player: { ...state.player, isAlive: !state.player.isAlive }, deathReason: state.player.isAlive ? '개발자 패널로 사망 상태를 켰다.' : null })}>사망 상태 토글</button>
        <button onClick={() => change({ ...state, map: { ...state.map, tutorialComplete: !state.map.tutorialComplete } })}>튜토리얼 완료 토글</button>
        <button onClick={() => change({ ...state, flags: toggleValue(state.flags, 'dev_show_system_map') })}>시스템 지도 표시 토글</button>
        <button className="danger" onClick={() => { clearSave(); onStateChange(state, false); }}>세이브 초기화</button>
      </div>
      <div className="trait-grid">
        <p className="muted">특성 추가/제거: {state.player.traits.length ? state.player.traits.join(', ') : '없음'}</p>
        {traitIds.map((trait) => {
          const traitName = traitCatalog.find((entry) => entry.id === trait)?.name ?? trait;
          return <button className={state.player.traits.includes(trait) ? 'active' : ''} key={trait} onClick={() => change({ ...state, player: { ...state.player, traits: toggleValue(state.player.traits, trait) } })}>{traitName}</button>;
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
        <p>{state.encounter.chainStates.length ? state.encounter.chainStates.map((chain) => `${chain.chainId}:${chain.step}`).join(', ') : '진행 중인 체인 없음'}</p>
      </div>
      <pre className="json-output">{JSON.stringify(state, null, 2)}</pre>
    </section>
  );
}
