import type { GuideStep } from '../lib/journey';
import { TransportModeIcon } from './common';
import { TransferHandoff } from './TransferHandoff';

export function NavigationInstruction({ step }: { step: GuideStep }) {
  if (step.kind === 'transfer' && step.fromLeg && step.toLeg) return <TransferHandoff from={step.fromLeg} to={step.toLeg} />;
  const mode = step.fromLeg?.mode ?? 'walk';
  return (
    <div className="instruction">
      <div className="instr-icon"><TransportModeIcon mode={step.kind === 'station' ? 'walk' : mode} size={40} /></div>
      <h2 className="instr-title" tabIndex={-1} id="instr-title">{step.title}</h2>
      <p className="instr-body">{step.body}</p>
      {step.kind === 'station' && !step.stationVerified && (
        <p className="notice" role="note">Station-specific directions not verified. Follow the station signage and ask staff if unsure.</p>
      )}
    </div>
  );
}
