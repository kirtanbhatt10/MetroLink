import { useEffect, useMemo, useRef, useState } from 'react';
import { getInstructions } from '../api/client';
import type { JourneyOption, NavStep } from '../api/types';
import { buildSteps, modeLabel } from '../lib/journey';
import { useSpeech } from '../lib/speech';
import { ErrorState, LoadingState } from './common';
import { NavigationInstruction } from './NavigationInstruction';
import { LostRecoveryDialog } from './LostRecoveryDialog';

export function StationSense({ option, onExit, onReplace }: {
  option: JourneyOption; onExit: () => void; onReplace: (o: JourneyOption) => void;
}) {
  const [nav, setNav] = useState<Record<string, NavStep[]> | null>(null);
  const [err, setErr] = useState<unknown>(null);
  const [idx, setIdx] = useState(0);
  const [lost, setLost] = useState(false);
  const speech = useSpeech();
  const headRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setErr(null); setNav(null);
    const first = option.legs[0].originId;
    getInstructions(first).then((s) => setNav({ [first]: s })).catch(setErr);
  };
  useEffect(() => { load(); setIdx(0); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [option]);

  const steps = useMemo(() => (nav ? buildSteps(option, nav) : []), [option, nav]);
  const step = steps[idx];
  const last = steps.length - 1;
  const destId = option.legs[option.legs.length - 1].destinationId;

  // Read aloud on step change if speech is on; move focus to the heading for screen readers.
  useEffect(() => {
    if (!step) return;
    headRef.current?.querySelector<HTMLElement>('#instr-title')?.focus({ preventScroll: true });
    if (speech.enabled) speech.speak(step.speech); else speech.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.key, speech.enabled]);

  if (err) return <ErrorState error={err} onRetry={load} title="Could not load station guidance" />;
  if (!nav || !step) return <LoadingState label="Preparing StationSense…" />;

  const legTotal = option.legs.length;
  const leg = option.legs[Math.min(step.legIndex, legTotal - 1)];

  return (
    <section className="sense" aria-label="StationSense navigation">
      <div className="sense-top">
        <p className="sense-leg">
          Leg {Math.min(step.legIndex + 1, legTotal)} of {legTotal} · {modeLabel(leg.mode)}{leg.route ? ` ${leg.route}` : ''}
        </p>
        <div className="speech-ctl">
          {speech.supported ? (
            <label className="check">
              <input type="checkbox" checked={speech.enabled} onChange={(e) => speech.setEnabled(e.target.checked)} />
              <span>Speak instructions</span>
            </label>
          ) : <span className="muted">Speech not available in this browser. Read the text below.</span>}
        </div>
      </div>

      <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={idx + 1}
        aria-label={`Step ${idx + 1} of ${steps.length}`}>
        <span style={{ width: `${((idx + 1) / steps.length) * 100}%` }} />
      </div>
      <p className="step-count" aria-live="polite">Step {idx + 1} of {steps.length}</p>

      <div ref={headRef} className="sense-main" aria-live="polite">
        <NavigationInstruction step={step} />
      </div>

      <div className="sense-nav">
        <button className="btn btn-secondary btn-lg" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Previous step</button>
        {idx < last
          ? <button className="btn btn-primary btn-lg" onClick={() => setIdx(idx + 1)}>I've reached here · Next step</button>
          : <button className="btn btn-primary btn-lg" onClick={onExit}>Finish</button>}
      </div>

      <div className="sense-tools">
        <button className="btn btn-secondary" onClick={() => speech.speak(step.speech)} disabled={!speech.supported}>
          {speech.speaking ? 'Speaking…' : 'Repeat instruction'}
        </button>
        {speech.speaking && <button className="btn btn-secondary" onClick={speech.stop}>Pause speech</button>}
        <button className="btn btn-warn" onClick={() => setLost(true)}>I'm lost</button>
        <button className="btn btn-secondary" onClick={() => setIdx(0)}>Restart guidance</button>
        <button className="btn btn-link" onClick={onExit}>Exit navigation</button>
      </div>

      {lost && (
        <LostRecoveryDialog destinationId={destId} onClose={() => setLost(false)}
          onUse={(o) => { setLost(false); onReplace(o); }} />
      )}
    </section>
  );
}
