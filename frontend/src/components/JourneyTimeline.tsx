import type { JourneyOption } from '../api/types';
import { confidenceLabel, fmtDuration, fmtTime, journeyMinutes, legMinutes, modeLabel } from '../lib/journey';
import { Pill, TransportModeIcon } from './common';

export function JourneyTimeline({ option, onStart, onBack }: { option: JourneyOption; onStart: () => void; onBack: () => void }) {
  return (
    <section className="card timeline-card" aria-labelledby="tl-h">
      <button className="btn btn-link" onClick={onBack}>← Back to options</button>
      <h2 id="tl-h">Journey details</h2>
      <p className="muted">
        {fmtDuration(journeyMinutes(option))} scheduled ride · {option.transfers} transfer{option.transfers === 1 ? '' : 's'} ·{' '}
        {confidenceLabel(option.confidence)}
      </p>
      <ol className="timeline">
        {option.legs.map((l, i) => (
          <li key={i}>
            <div className="tl-icon"><TransportModeIcon mode={l.mode} /></div>
            <div className="tl-body">
              <h3>{modeLabel(l.mode)}{l.route ? ` ${l.route}` : ''}</h3>
              {l.headsign && <p>Towards {l.headsign}</p>}
              <p><strong>Board:</strong> {l.originName ?? l.originId} · {fmtTime(l.scheduledDeparture)}</p>
              <p><strong>Get off:</strong> {l.destinationName ?? l.destinationId} · {fmtTime(l.scheduledArrival)}</p>
              <p className="muted">
                {legMinutes(l) != null ? `${legMinutes(l)} min scheduled · ` : ''}Intermediate stops not provided · Source: {l.sourceId ?? 'unknown'} ·{' '}
                <Pill tone={l.verificationStatus === 'verified' ? 'good' : 'warn'}>{confidenceLabel(l.verificationStatus ?? 'unverified')}</Pill>
              </p>
              {option.legs[i + 1] && (
                <p className="transfer-note">
                  Transfer after this leg. Walking distance and directions between stops are not available in the data.
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      <button className="btn btn-primary btn-lg" onClick={onStart}>Start StationSense</button>
    </section>
  );
}
