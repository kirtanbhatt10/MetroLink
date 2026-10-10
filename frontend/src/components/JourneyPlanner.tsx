import { useState } from 'react';
import type { Objective, Place, Preferences } from '../api/types';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { AccessiblePreferences } from './AccessiblePreferences';

export interface PlannerState {
  origin: Place | null;
  destination: Place | null;
  prefs: Preferences;
}

const OBJECTIVES: { value: Objective; label: string }[] = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'fastest', label: 'Fastest' },
  { value: 'least_walking', label: 'Least walking' },
  { value: 'fewest_transfers', label: 'Fewest transfers' },
];

export function JourneyPlanner({ state, onChange, onSubmit, busy }: {
  state: PlannerState; onChange: (s: PlannerState) => void; onSubmit: () => void; busy: boolean;
}) {
  const [touched, setTouched] = useState(false);
  const { origin, destination, prefs } = state;
  const same = origin && destination && origin.id === destination.id;
  const error = !origin || !destination ? 'Choose both an origin and a destination from the suggestions.'
    : same ? 'Origin and destination are the same stop.' : null;

  return (
    <form className="card planner" onSubmit={(e) => { e.preventDefault(); setTouched(true); if (!error) onSubmit(); }} noValidate>
      <div className="od">
        <PlaceAutocomplete label="From" value={origin} placeholder="Search a stop or station" onChange={(p) => onChange({ ...state, origin: p })} />
        <button type="button" className="btn btn-icon swap" aria-label="Swap origin and destination"
          onClick={() => onChange({ ...state, origin: destination, destination: origin })}>⇅</button>
        <PlaceAutocomplete label="To" value={destination} placeholder="Search a stop or station" onChange={(p) => onChange({ ...state, destination: p })} />
      </div>

      <fieldset className="objective">
        <legend>Journey preference</legend>
        <div className="seg">
          {OBJECTIVES.map((o) => (
            <label key={o.value} className={prefs.objective === o.value ? 'on' : ''}>
              <input type="radio" name="objective" value={o.value} checked={prefs.objective === o.value}
                onChange={() => onChange({ ...state, prefs: { ...prefs, objective: o.value } })} />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="row2">
        <div className="field">
          <label htmlFor="maxwalk">Max walking (metres, optional)</label>
          <input id="maxwalk" type="number" min={0} step={50} inputMode="numeric" value={prefs.maxWalkingMeters ?? ''}
            onChange={(e) => onChange({ ...state, prefs: { ...prefs, maxWalkingMeters: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) } })} />
        </div>
        <div className="field">
          <label htmlFor="maxtr">Max transfers (optional)</label>
          <input id="maxtr" type="number" min={0} max={5} inputMode="numeric" value={prefs.maxTransfers ?? ''}
            onChange={(e) => onChange({ ...state, prefs: { ...prefs, maxTransfers: e.target.value === '' ? null : Math.max(0, Math.floor(Number(e.target.value))) } })} />
        </div>
      </div>

      <AccessiblePreferences value={prefs} onChange={(p) => onChange({ ...state, prefs: p })} />

      {touched && error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Finding…' : 'Find my journey'}</button>
    </form>
  );
}
