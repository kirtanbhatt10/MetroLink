import { useEffect, useState, type ReactNode } from 'react';
import { checkHealth } from '../api/client';

export type View = 'plan' | 'data' | 'twin';

export function AppLayout({ view, onNav, children }: { view: View; onNav: (v: View) => void; children: ReactNode }) {
  const [online, setOnline] = useState<boolean | null>(null);
  const [scale, setScale] = useState(() => {
    try { return Number(localStorage.getItem('ml.scale')) || 100; } catch { return 100; }
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${scale}%`;
    try { localStorage.setItem('ml.scale', String(scale)); } catch { /* ignore */ }
  }, [scale]);

  useEffect(() => {
    let alive = true;
    const ping = () => checkHealth().then((ok) => alive && setOnline(ok));
    ping();
    const t = setInterval(ping, 20000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const items: { v: View; label: string }[] = [
    { v: 'plan', label: 'Journey' }, { v: 'twin', label: 'Disruption' }, { v: 'data', label: 'About data' },
  ];
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="topbar">
        <div className="topbar-in">
          <button className="brand" onClick={() => onNav('plan')} aria-label="MetroLink home">
            <span className="logo" aria-hidden="true">M</span> MetroLink
          </button>
          <nav aria-label="Main" className="nav-desktop">
            {items.map((i) => (
              <button key={i.v} className={view === i.v ? 'on' : ''} aria-current={view === i.v ? 'page' : undefined} onClick={() => onNav(i.v)}>{i.label}</button>
            ))}
          </nav>
          <div className="tools">
            <span className={`status ${online === false ? 'off' : online ? 'on' : ''}`} role="status">
              {online === null ? 'Checking…' : online ? 'Backend online' : 'Backend offline'}
            </span>
            <div className="textsize" role="group" aria-label="Text size">
              <button onClick={() => setScale((s) => Math.max(90, s - 10))} aria-label="Decrease text size" disabled={scale <= 90}>A−</button>
              <button onClick={() => setScale((s) => Math.min(150, s + 10))} aria-label="Increase text size" disabled={scale >= 150}>A+</button>
            </div>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>{children}</main>
      <nav aria-label="Main (mobile)" className="nav-mobile">
        {items.map((i) => (
          <button key={i.v} className={view === i.v ? 'on' : ''} aria-current={view === i.v ? 'page' : undefined} onClick={() => onNav(i.v)}>{i.label}</button>
        ))}
      </nav>
    </>
  );
}
