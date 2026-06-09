import { useEffect, useState } from 'react';

interface Props {
  onComplete: () => void;
}

type SplashPhase = 'entering' | 'visible' | 'leaving';

const LOGO_SRC = `${import.meta.env.BASE_URL}assets/logos/logo_ref_heick_games_full.png`;

export function SplashScreen({ onComplete }: Props) {
  const [phase, setPhase] = useState<SplashPhase>('entering');
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fadeInMs = prefersReducedMotion ? 0 : 500;
    const holdMs = prefersReducedMotion ? 150 : 1200;
    const fadeOutMs = prefersReducedMotion ? 150 : 900;

    const showTimer = window.setTimeout(() => setPhase('visible'), 20);
    const leaveTimer = window.setTimeout(() => setPhase('leaving'), fadeInMs + holdMs);
    const completeTimer = window.setTimeout(onComplete, fadeInMs + holdMs + fadeOutMs);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen splash-${phase}`} role="status" aria-live="polite" aria-label="Heick Games loading">
      <div className="splash-mark">
        {!logoFailed && <img src={LOGO_SRC} alt="Heick Games logo" onError={() => setLogoFailed(true)} />}
        {logoFailed && <span className="splash-placeholder">Heick Games</span>}
      </div>
    </div>
  );
}
