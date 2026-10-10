import type { Leg } from '../api/types';
import { fmtTime, modeLabel } from '../lib/journey';
import { TransportModeIcon } from './common';

export function TransferHandoff({ from, to }: { from: Leg; to: Leg }) {
  const sameStop = from.destinationId === to.originId;
  return (
    <div className="instruction handoff">
      <div className="instr-icon"><TransportModeIcon mode={to.mode} size={40} /></div>
      <h2 className="instr-title" tabIndex={-1} id="instr-title">Next: {modeLabel(to.mode)}{to.route ? ` ${to.route}` : ''}</h2>
      <ol className="handoff-list">
        <li><strong>Leave from:</strong> {from.destinationName ?? from.destinationId}</li>
        <li>
          <strong>Go to:</strong> {to.originName ?? to.originId}
          {sameStop ? ' (same stop)' : ''}
        </li>
        <li><strong>Take:</strong> {modeLabel(to.mode)}{to.route ? ` ${to.route}` : ''}{to.headsign ? ` towards ${to.headsign}` : ''}</li>
        {to.scheduledDeparture && <li><strong>Scheduled departure:</strong> {fmtTime(to.scheduledDeparture)} (timetable, not live)</li>}
        <li>When you reach {to.originName ?? 'the stop'}, check the route number on the vehicle before boarding.</li>
      </ol>
      {!sameStop && (
        <p className="notice" role="note">
          Walking distance and directions between these stops are not verified. If you need a rickshaw, confirm a pickup point locally;
          MetroLink has no verified rickshaw stand, fare or availability.
        </p>
      )}
    </div>
  );
}
