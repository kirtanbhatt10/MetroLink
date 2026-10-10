import type { Preferences } from '../api/types';

export function AccessiblePreferences({ value, onChange }: { value: Preferences; onChange: (p: Preferences) => void }) {
  return (
    <fieldset className="prefs">
      <legend>Accessibility</legend>
      <label className="check">
        <input type="checkbox" checked={value.preferStepFree} onChange={(e) => onChange({ ...value, preferStepFree: e.target.checked })} />
        <span>Step-free journey</span>
      </label>
      <label className="check">
        <input type="checkbox" checked={value.avoidStairs} onChange={(e) => onChange({ ...value, avoidStairs: e.target.checked })} />
        <span>Avoid stairs</span>
      </label>
      <p className="hint">
        These filters only work where stop accessibility is recorded in the data. If it is unknown, the planner will say so
        instead of guessing, and may return no journey.
      </p>
    </fieldset>
  );
}
