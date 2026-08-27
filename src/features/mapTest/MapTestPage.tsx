import { useState } from 'react';
import { MapPanel } from '../map/MapPanel';
import { createRandomMapTestSeed, generateMapTestState } from '../map/mapGenerator';
import { advanceTravel, cancelTravel, getDirectionCandidates, recordCurrentNode, selectDirectionCandidate } from '../map/mapLogic';
import type { DirectionCandidate } from '../map/mapTypes';
import './MapTestPage.css';

export function MapTestPage() {
  const [seedInput, setSeedInput] = useState('hannibal-map-test');
  const [state, setState] = useState(() => generateMapTestState('hannibal-map-test'));
  const [debugMode, setDebugMode] = useState(false);
  const candidates = state.currentTargetId ? [] : getDirectionCandidates(state);

  const regenerate = () => setState(generateMapTestState(seedInput));
  const randomSeed = () => {
    const nextSeed = createRandomMapTestSeed();
    setSeedInput(nextSeed);
    setState(generateMapTestState(nextSeed));
  };
  const chooseCandidate = (candidate: DirectionCandidate) => setState((current) => selectDirectionCandidate(current, candidate));
  const returnToStart = () => setState((current) => ({
    ...cancelTravel(current),
    currentPosition: current.startPosition,
    discoveredPath: [current.discoveredPath[0]],
  }));

  return (
    <main className="map-test-page-v2" aria-label="방향 선택형 지도 테스트 페이지">
      <section className="map-test-shell">
        <header className="map-test-header-v2">
          <p className="map-test-eyebrow">Directional Map Prototype</p>
          <h1>Map Test</h1>
          <label className="map-test-seed-field">
            <span>Seed</span>
            <input value={seedInput} onChange={(event: { target: { value: string } }) => setSeedInput(event.target.value)} />
          </label>
          <div className="map-test-toolbar">
            <button type="button" onClick={regenerate}>Regenerate</button>
            <button type="button" onClick={randomSeed}>Random Seed</button>
            <button type="button" className={debugMode ? 'active' : ''} onClick={() => setDebugMode((value) => !value)}>Debug Mode</button>
          </div>
        </header>

        <MapPanel
          state={state}
          candidates={candidates}
          isDebug={debugMode}
          onSelectCandidate={chooseCandidate}
          onNextTravelEncounter={() => setState((current) => advanceTravel(current))}
          onRecordCurrentNode={() => setState((current) => recordCurrentNode(current))}
          onCancelTravel={() => setState((current) => cancelTravel(current))}
          onReturnToStart={returnToStart}
        />
      </section>
    </main>
  );
}
