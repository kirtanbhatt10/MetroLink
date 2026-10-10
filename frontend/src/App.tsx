import { useState } from 'react';
import { planJourney } from './api/client';
import type { JourneyOption, PlanResult } from './api/types';
import { AppLayout, type View } from './components/AppLayout';
import { JourneyPlanner, type PlannerState } from './components/JourneyPlanner';
import { JourneyOptions } from './components/JourneyOptions';
import { JourneyTimeline } from './components/JourneyTimeline';
import { StationSense } from './components/StationSense';
import { DisruptionSimulator } from './components/DisruptionSimulator';
import { DataStatusPanel } from './components/DataStatusPanel';
import { EmptyState, ErrorState, LoadingState } from './components/common';

type Stage = 'form' | 'details' | 'sense';

export default function App() {
  const [view, setView] = useState<View>('plan');
  const [stage, setStage] = useState<Stage>('form');
  const [planner, setPlanner] = useState<PlannerState>({
    origin: null, destination: null,
    prefs: { objective: 'balanced', maxWalkingMeters: null, maxTransfers: null, avoidStairs: false, preferStepFree: false },
  });
  const [req, setReq] = useState<{ s: 'idle' | 'loading' | 'error' | 'done'; plan?: PlanResult; err?: unknown }>({ s: 'idle' });
  const [selected, setSelected] = useState<JourneyOption | null>(null);

  const search = () => {
    const { origin, destination, prefs } = planner;
    if (!origin || !destination) return;
    setReq({ s: 'loading' }); setSelected(null); setStage('form');
    planJourney(origin.id, destination.id, prefs)
      .then((plan) => setReq({ s: 'done', plan }))
      .catch((err) => setReq({ s: 'error', err }));
  };

  const nav = (v: View) => { setView(v); window.scrollTo({ top: 0 }); };
  const pick = (o: JourneyOption, st: Stage) => { setSelected(o); setStage(st); window.scrollTo({ top: 0 }); };

  return (
    <AppLayout view={view} onNav={nav}>
      {view === 'data' && <div className="page"><DataStatusPanel /></div>}
      {view === 'twin' && <div className="page"><DisruptionSimulator option={selected ?? req.plan?.options[0] ?? null} /></div>}
      {view === 'plan' && stage === 'sense' && selected && (
        <div className="page narrow">
          <StationSense option={selected} onExit={() => setStage('form')} onReplace={(o) => setSelected(o)} />
        </div>
      )}
      {view === 'plan' && stage === 'details' && selected && (
        <div className="page narrow">
          <JourneyTimeline option={selected} onBack={() => setStage('form')} onStart={() => setStage('sense')} />
        </div>
      )}
      {view === 'plan' && stage === 'form' && (
        <>
          <section className="hero">
            <div className="page">
              <h1>Your entire journey. One clear path.</h1>
              <p>MetroLink connects public transport choices in Ahmedabad and Gandhinagar with step-by-step station guidance you can follow without confusion.</p>
            </div>
          </section>
          <div className="page lift">
            <JourneyPlanner state={planner} onChange={setPlanner} onSubmit={search} busy={req.s === 'loading'} />
            <div aria-live="polite" className="results">
              {req.s === 'loading' && <LoadingState label="Finding journeys…" />}
              {req.s === 'error' && <ErrorState error={req.err} onRetry={search} />}
              {req.s === 'done' && req.plan && (req.plan.noRoute
                ? <EmptyState title="No journey found">{req.plan.reason || 'No route exists between these stops in the imported data.'}</EmptyState>
                : <JourneyOptions options={req.plan.options} onView={(o) => pick(o, 'details')} onStart={(o) => pick(o, 'sense')} />)}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
