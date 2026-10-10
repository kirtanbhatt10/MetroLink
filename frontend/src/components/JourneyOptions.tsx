import type { JourneyOption } from '../api/types';
import { badges, confidenceLabel, fmtDuration, journeyMinutes, modeLabel } from '../lib/journey';
import { Pill, TransportModeIcon } from './common';

export function JourneyCard({ option, index, badgeList, onView, onStart }: {
  option: JourneyOption; index: number; badgeList: { label: string }[]; onView: () => void; onStart: () => void;
}) {
  const mins = journeyMinutes(option);
  const first = option.legs[0], last = option.legs[option.legs.length - 1];
  const verified = option.confidence === 'verified';
  return (
    <article className="card journey-card" aria-labelledby={`jc-${index}`}>
      <header>
        <h3 id={`jc-${index}`}>Option {index + 1}</h3>
        <div className="badges">
          {badgeList.map((b) => <Pill key={b.label} tone="good">{b.label}</Pill>)}
          <Pill tone={verified ? 'good' : 'warn'}>{confidenceLabel(option.confidence)}</Pill>
        </div>
      </header>

      <div className="modes" aria-label="Transport modes">
        {option.legs.map((l, i) => (
          <span key={i} className="mode-chip">
            <TransportModeIcon mode={l.mode} size={18} /> {modeLabel(l.mode)}{l.route ? ` ${l.route}` : ''}
          </span>
        ))}
      </div>

      <p className="route-line"><strong>{first.originName ?? first.originId}</strong> → <strong>{last.destinationName ?? last.destinationId}</strong></p>

      <dl className="facts">
        <div><dt>Scheduled ride</dt><dd>{fmtDuration(mins)}{mins != null && <small> (timetable)</small>}</dd></div>
        <div><dt>Transfers</dt><dd>{option.transfers}</dd></div>
        <div><dt>Walking</dt><dd>{option.walkingMeters > 0 ? `${Math.round(option.walkingMeters)} m` : 'None counted'}</dd></div>
        <div><dt>Accessibility</dt><dd>Unknown</dd></div>
      </dl>

      <p className="why">{option.rankingReason ? `Ranked for: ${option.rankingReason.replace('_', ' ')}.` : ''} Walking links between stops are not in the dataset yet.</p>

      <div className="actions">
        <button className="btn btn-secondary" onClick={onView}>View journey</button>
        <button className="btn btn-primary" onClick={onStart}>Start StationSense</button>
      </div>
    </article>
  );
}

export function JourneyOptions({ options, onView, onStart }: {
  options: JourneyOption[]; onView: (o: JourneyOption) => void; onStart: (o: JourneyOption) => void;
}) {
  const b = badges(options);
  return (
    <section aria-label="Journey options" className="options">
      <h2>{options.length === 1 ? 'Your journey' : `${options.length} journey options`}</h2>
      <p className="muted">
        Times come from the static timetable. No live arrivals, fares or delays are shown. Objective, walking and transfer limits
        are applied to scheduled trips and supported transfer links in the imported data. Nearby stops are not assumed to connect.
      </p>
      <div className="grid">
        {options.map((o, i) => (
          <JourneyCard key={o.legs.map((l) => l.tripId ?? l.route).join('|') + i} option={o} index={i} badgeList={b[i]}
            onView={() => onView(o)} onStart={() => onStart(o)} />
        ))}
      </div>
    </section>
  );
}
