import type { RevealedArea } from '../game/types';

export function FogOfWarLayer({ revealedAreas }: { revealedAreas: RevealedArea[] }) {
  return (
    <svg className="fog-of-war-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <mask id="parchment-fog-mask">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          {revealedAreas.map((area) => (
            <circle key={area.id} cx={area.x} cy={area.y} r={area.radius} fill="black" />
          ))}
        </mask>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,.88)" mask="url(#parchment-fog-mask)" />
      <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,.18)" />
    </svg>
  );
}
