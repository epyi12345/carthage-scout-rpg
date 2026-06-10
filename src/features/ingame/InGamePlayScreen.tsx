import { ingameUiAssets } from './ingameAssets';
import './InGamePlayScreen.css';

export function InGamePlayScreen() {
  return (
    <main
      className="ingame-play-screen"
      style={{ '--ingame-bg': `url(${ingameUiAssets.parchmentBackground})` }}
      aria-label="인게임 기본 배경 프레임"
    >
      <img
        className="ingame-vignette-frame"
        src={ingameUiAssets.outerVignetteFrame}
        alt=""
        draggable={false}
      />
      <img
        className="ingame-top-ornament"
        src={ingameUiAssets.topOrnamentSource}
        alt=""
        draggable={false}
      />
    </main>
  );
}
