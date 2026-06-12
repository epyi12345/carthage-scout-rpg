import { ingameUiAssets } from './ingameAssets';
import './InGamePlayScreen.css';

export function InGamePlayScreen() {
  return (
    <main className="ingame-play-screen">
      <section className="ingame-stage" aria-label="인게임 화면">
        <img
          className="ingame-background"
          src={ingameUiAssets.parchmentBackground}
          alt=""
          draggable={false}
        />

        <img
          className="ingame-vignette"
          src={ingameUiAssets.outerVignetteFrame}
          alt=""
          draggable={false}
        />

        <header className="ingame-header" aria-hidden="true">
          <div className="ingame-top-ornament-wrap">
            <img
              className="ingame-top-ornament"
              src={ingameUiAssets.topDividerLeftSource}
              alt=""
              draggable={false}
            />
          </div>

          <div className="ingame-center-divider-wrap">
            <img
              className="ingame-center-divider"
              src={ingameUiAssets.centerDividerLine}
              alt=""
              draggable={false}
            />
          </div>

          <img
            className="ingame-gear-icon"
            src={ingameUiAssets.gearIcon}
            alt=""
            draggable={false}
          />

          <img
            className="ingame-small-toggle"
            src={ingameUiAssets.smallToggleHorizontal}
            alt=""
            draggable={false}
          />
        </header>

        <section className="ingame-text-scroll" aria-label="인게임 텍스트 영역" />

        <footer className="ingame-footer" aria-hidden="true">
          <img
            className="footer-map-handle"
            src="/assets/ui/ui_icon_15_map_pull_handle_bar_exact.png"
            alt=""
            aria-hidden="true"
            draggable={false}
          />

          <div className="ingame-bottom-ornament-wrap">
            <img
              className="ingame-bottom-ornament"
              src={ingameUiAssets.bottomDividerRightSource}
              alt=""
              draggable={false}
            />
          </div>
        </footer>
      </section>
    </main>
  );
}
