import { useCallback, useEffect, useState } from 'react';
import { getDataStatus } from '../api/client';
import type { DataStatus } from '../api/types';
import { EmptyState, ErrorState, LoadingState } from './common';

const pct = (n: number) => `${Math.round((n ?? 0) * 100)}%`;
const fmtDate = (d?: string | null) => (d ? (/^\d{8}$/.test(d) ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : d) : 'Unknown');

export function DataStatusPanel() {
  const [data, setData] = useState<DataStatus | null>(null);
  const [err, setErr] = useState<unknown>(null);
  const load = useCallback(() => {
    setErr(null); setData(null);
    getDataStatus().then(setData).catch(setErr);
  }, []);
  useEffect(load, [load]);

  if (err) return <ErrorState error={err} onRetry={load} />;
  if (!data) return <LoadingState label="Loading data status…" />;

  const totalStops = data.counts.reduce((a, c) => a + c.count, 0);
  return (
    <div className="data-panel">
      <h2>About the data</h2>
      {data.sources.length === 0 && (
        <EmptyState title="No data has been imported">
          Run <code>npm run download:gtfs</code> and <code>npm run import:gtfs</code> in the backend. Until then searches return nothing.
        </EmptyState>
      )}

      {data.sources.map((s) => (
        <section className="card" key={s.source_id}>
          <h3>{s.name}</h3>
          <dl className="facts">
            <div><dt>Import status</dt><dd>{s.import_status}</dd></div>
            <div><dt>Last import</dt><dd>{s.retrieved_at ? new Date(s.retrieved_at).toLocaleString() : 'Unknown'}</dd></div>
            <div><dt>Service dates</dt><dd>{fmtDate(s.feed_start_date)} to {fmtDate(s.feed_end_date)}</dd></div>
            <div><dt>License</dt><dd>{s.license ?? 'Unknown'}</dd></div>
          </dl>
          {s.source_url && <p className="muted">Source: {s.source_url}</p>}
          {s.quality_notes && <p className="notice">{s.quality_notes}</p>}
        </section>
      ))}

      <section className="card">
        <h3>Stops by agency and mode ({totalStops.toLocaleString()} total)</h3>
        {data.counts.length === 0 ? <p>No stops imported.</p> : (
          <table>
            <thead><tr><th scope="col">Agency</th><th scope="col">Mode</th><th scope="col">Stops</th></tr></thead>
            <tbody>{data.counts.map((c, i) => <tr key={i}><td>{c.agency}</td><td>{c.mode}</td><td>{c.count.toLocaleString()}</td></tr>)}</tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h3>Data confidence (share of stops)</h3>
        <dl className="facts">
          <div><dt>Verified</dt><dd>{pct(data.confidence.verified)}</dd></div>
          <div><dt>Estimated</dt><dd>{pct(data.confidence.estimated)}</dd></div>
          <div><dt>Stale</dt><dd>{pct(data.confidence.stale)}</dd></div>
          <div><dt>Illustrative</dt><dd>{pct(data.confidence.illustrative)}</dd></div>
        </dl>
        <p className="muted">Anything not in these categories is unverified.</p>
      </section>

      <section className="card">
        <h3>Known limitations</h3>
        <ul>
          <li>Live arrivals are <strong>not</strong> integrated; all times are from static timetables.</li>
          <li>The planner finds direct same-trip connections only. Multi-leg transfers are not computed yet.</li>
          <li>Walking links, fares and station-internal maps are not in the data. Accessibility is shown as unknown.</li>
          <li>Metro stations have not been imported; do not assume complete Ahmedabad–Gandhinagar coverage.</li>
          {data.warnings.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      </section>
    </div>
  );
}
