import type { ReactNode } from 'react';
import { ApiError } from '../api/client';

export function TransportModeIcon({ mode, size = 22 }: { mode: string; size?: number }) {
  const m = mode.toLowerCase();
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (m === 'metro')
    return (<svg {...p}><rect x="5" y="3" width="14" height="14" rx="3" /><path d="M5 11h14M9 21l2-4M15 21l-2-4" /><circle cx="9" cy="14" r=".5" /><circle cx="15" cy="14" r=".5" /></svg>);
  if (m === 'walk' || m === 'walking')
    return (<svg {...p}><circle cx="13" cy="4" r="1.6" /><path d="M9 21l3-7M12 14l-1-5 3 1 2 3M10 10l-3 2M12 14l4 7" /></svg>);
  // bus / brts / default
  return (<svg {...p}><rect x="4" y="3" width="16" height="15" rx="3" /><path d="M4 11h16M7 21v-3M17 21v-3" /><circle cx="8" cy="14.5" r=".5" /><circle cx="16" cy="14.5" r=".5" /></svg>);
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }: { error: unknown; onRetry?: () => void; title?: string }) {
  const msg = error instanceof Error ? error.message : String(error);
  const offline = error instanceof ApiError && error.kind === 'offline';
  return (
    <div className="state state-error" role="alert">
      <h3>{offline ? 'Backend unavailable' : title}</h3>
      <p>{msg}</p>
      {offline && <p className="muted">Start it with <code>npm run dev</code> in the project root.</p>}
      {onRetry && <button className="btn btn-secondary" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="state state-empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Pill({ tone = 'neutral', children }: { tone?: 'good' | 'warn' | 'neutral' | 'info'; children: ReactNode }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}
