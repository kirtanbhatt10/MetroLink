import { useEffect, useRef, useState } from 'react';
import { recoverRoute } from '../api/client';
import type { JourneyOption, Place, PlanResult } from '../api/types';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { EmptyState, ErrorState, LoadingState } from './common';
import { fmtDuration, journeyMinutes, modeLabel } from '../lib/journey';

export function LostRecoveryDialog({ destinationId, onClose, onUse }: {
  destinationId: string; onClose: () => void; onUse: (o: JourneyOption) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [state, setState] = useState<{ s: 'idle' | 'loading' | 'error' | 'done'; plan?: PlanResult; err?: unknown }>({ s: 'idle' });

  useEffect(() => { ref.current?.showModal(); }, []);

  const submit = () => {
    if (!place) return;
    setState({ s: 'loading' });
    recoverRoute(place.id, destinationId)
      .then((plan) => setState({ s: 'done', plan }))
      .catch((err) => setState({ s: 'error', err }));
  };

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="lost-h" onClose={onClose} onCancel={onClose}>
      <h2 id="lost-h">I'm lost</h2>
      <p>Tell us a stop or station name you can see or recognise. We will look for a route from there to your destination.
        MetroLink does not detect your location.</p>
      <PlaceAutocomplete label="A stop I can recognise" value={place} onChange={setPlace} placeholder="Search a stop name" />
      <p className="hint">The imported data has no verified landmark list yet, so please search for a stop instead.</p>
      <div className="actions">
        <button className="btn btn-primary" disabled={!place || state.s === 'loading'} onClick={submit}>Find a route from here</button>
        <button className="btn btn-secondary" onClick={() => ref.current?.close()}>Cancel</button>
      </div>
      <div aria-live="polite">
        {state.s === 'loading' && <LoadingState label="Finding a route…" />}
        {state.s === 'error' && <ErrorState error={state.err} onRetry={submit} />}
        {state.s === 'done' && state.plan && (state.plan.noRoute ? (
          <EmptyState title="No route found from there">{state.plan.reason}</EmptyState>
        ) : (
          <ul className="recover-list">
            {state.plan.options.map((o, i) => (
              <li key={i} className="card">
                <p>
                  {o.legs.map((l) => `${modeLabel(l.mode)}${l.route ? ' ' + l.route : ''}`).join(' → ')} ·{' '}
                  {fmtDuration(journeyMinutes(o))} scheduled
                </p>
                <p className="muted">{o.legs[0].originName ?? o.legs[0].originId} → {o.legs[o.legs.length - 1].destinationName}</p>
                <button className="btn btn-primary" onClick={() => { onUse(o); ref.current?.close(); }}>Guide me with this route</button>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </dialog>
  );
}
