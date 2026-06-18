interface Props {
  statusSlot?: unknown;
  children: unknown;
  navigationSlot?: unknown;
  className?: string;
}

export function InGameFrame({ statusSlot, children, navigationSlot, className = '' }: Props) {
  return (
    <main className={`phone-shell game-shell recon-shell ingame-frame ${className}`.trim()}>
      {statusSlot}
      <div className="content-area ingame-frame__content">{children}</div>
      {navigationSlot}
    </main>
  );
}
