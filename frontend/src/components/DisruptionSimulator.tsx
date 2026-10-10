import { useState } from 'react';
import { simulateDisruption } from '../api/client';
import type { DisruptionResult, JourneyOption } from '../api/types';
import { fmtDuration, journeyMinutes, modeLabel } from '../lib/journey';
import { EmptyState, ErrorState, LoadingState, Pill } from './common';

const summary = (o: JourneyOption) =>
  `${o.legs.map((l) => `${modeLabel(l.mode)}${l.route ? ' ' + l.route : ''}`).join(' → ')} · ${fmtDuration(journeyMinutes(o))} scheduled`;

export function DisruptionSimulator({ option }: { option: JourneyOption | null }) {
  const [sel, setSel] = useState(0);
  const [st, setSt] = useState<{ s: 'idle' | 'loading' | 'error' | 'done'; r?: DisruptionResult; e?: unknown }>({ s: 'idle' });

  if (!option) {
    return (
      <section className="card" aria-labelledby="dis-h">
        <h2 id="dis-h">Journey Twin · Disruption simulation</h2>
        <EmptyState title="Plan a journey first">Disruption simulation needs a planned journey to compare against.</EmptyState>
      </section>
    );
  }
  const leg = option.legs[Math.min(sel, option.legs.length - 1)];
  const first = option.legs[0], last = option.legs[option.legs.length - 1];

  const run = () => {
    setSt({ s: 'loading' });
    simulateDisruption({ originId: first.originId, destinationId: last.destinationId, fromStopId: leg.originId, toStopId: leg.destinationId })
      .then((r) => setSt({ s: 'done', r }))
      .catch((e) => setSt({ s: 'error', e }));
  };

  return (
    <section className="card" aria-labelledby="dis-h">
      <h2 id="dis-h">Journey Twin · Disruption simulation</h2>
      <p className="sim-banner" role="note">Simulated disruption — not a live service alert</p>
      <p className="muted">Pick a leg to pretend is closed and compare it with what the planner finds instead. The backend records this simulated closure.</p>
      <div className="field">
        <label htmlFor="dis-leg">Leg to disable</label>
        <select id="dis-leg" value={sel} onChange={(e) => { setSel(Number(e.target.value)); setSt({ s: 'idle' }); }}>
          {option.legs.map((l, i) => (
            <option key={i} value={i}>{l.originName ?? l.originId} → {l.destinationName ?? l.destinationId} ({modeLabel(l.mode)} {l.route ?? ''})</option>
          ))}
        </select>
      </div>
      <button className="btn btn-warn" onClick={run} disabled={st.s === 'loading'}>Simulate closure</button>
      <div aria-live="polite">
        {st.s === 'loading' && <LoadingState label="Simulating…" />}
        {st.s === 'error' && <ErrorState error={st.e} onRetry={run} />}
        {st.s === 'done' && st.r && (
          <div className="compare">
            <div>
              <h3>Original <Pill tone="neutral">{st.r.before.options.length} option{st.r.before.options.length === 1 ? '' : 's'}</Pill></h3>
              {st.r.before.options[0] ? <p>{summary(st.r.before.options[0])}</p> : <p>{st.r.before.reason}</p>}
            </div>
            <div>
              <h3>With closure <Pill tone={st.r.after.noRoute ? 'warn' : 'good'}>{st.r.after.noRoute ? 'No alternative' : `${st.r.after.options.length} alternative`}</Pill></h3>
              {st.r.after.options[0] ? <p>{summary(st.r.after.options[0])}</p> : <p>{st.r.after.reason}</p>}
              <p className="muted">Closed section: {leg.originName ?? leg.originId} → {leg.destinationName ?? leg.destinationId}</p>
            </div>
            <p className="sim-banner">Simulated disruption — not a live service alert</p>
          </div>
        )}
      </div>
    </section>
  );
}
