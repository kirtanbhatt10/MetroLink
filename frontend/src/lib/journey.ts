import type { JourneyOption, Leg, NavStep } from '../api/types';

/** Parse GTFS "HH:MM:SS" (hours may exceed 24) to seconds, or null. */
export function toSeconds(t?: string | null): number | null {
  if (!t) return null;
  const m = /^(\d+):(\d{2}):(\d{2})$/.exec(t.trim());
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
}

export function legMinutes(l: Leg): number | null {
  const a = toSeconds(l.scheduledDeparture), b = toSeconds(l.scheduledArrival);
  return a == null || b == null || b < a ? null : Math.round((b - a) / 60);
}

/** Sum of timetable ride times. Excludes waiting between legs, so it is a lower bound. */
export function journeyMinutes(o: JourneyOption): number | null {
  const parts = o.legs.map(legMinutes);
  return parts.some((p) => p == null) ? null : (parts as number[]).reduce((a, b) => a + b, 0);
}

export function fmtTime(t?: string | null): string {
  const s = toSeconds(t);
  if (s == null) return '—';
  const h = Math.floor(s / 3600) % 24, m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function fmtDuration(min: number | null): string {
  if (min == null) return 'Duration unknown';
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
}

export function modeLabel(mode: string): string {
  const m = mode.toLowerCase();
  if (m === 'metro') return 'Metro';
  if (m === 'brts') return 'BRTS';
  if (m === 'bus') return 'Bus';
  if (m === 'walk' || m === 'walking') return 'Walk';
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

export function confidenceLabel(c: string): string {
  return c === 'verified' ? 'Verified data'
    : c === 'estimated' ? 'Estimated'
    : c === 'stale' ? 'May be out of date'
    : c === 'illustrative' ? 'Illustrative'
    : 'Unverified data';
}

export interface Badge { kind: 'fastest' | 'least_walking' | 'fewest_transfers'; label: string }

/** A badge is only given when an option is strictly best among more than one option. */
export function badges(options: JourneyOption[]): Badge[][] {
  const out: Badge[][] = options.map(() => []);
  if (options.length < 2) return out;
  const strict = (vals: (number | null)[], kind: Badge['kind'], label: string) => {
    if (vals.some((v) => v == null)) return;
    const nums = vals as number[];
    const best = Math.min(...nums);
    const idx = nums.map((m, i) => (m === best ? i : -1)).filter((i) => i >= 0);
    if (idx.length === 1) out[idx[0]].push({ kind, label });
  };
  strict(options.map(journeyMinutes), 'fastest', 'Fastest');
  strict(options.map((o) => o.walkingMeters), 'least_walking', 'Least walking');
  strict(options.map((o) => o.transfers), 'fewest_transfers', 'Fewest transfers');
  return out;
}

export type StepKind = 'station' | 'board' | 'ride' | 'alight' | 'transfer' | 'arrive';
export interface GuideStep {
  key: string;
  kind: StepKind;
  legIndex: number;
  title: string;
  body: string;
  speech: string;
  /** True only when the text comes from backend-verified station directions. */
  stationVerified: boolean;
  fromLeg?: Leg;
  toLeg?: Leg;
}

const nm = (id: string, name?: string) => name || `stop ${id}`;
const routeText = (l: Leg) => `${modeLabel(l.mode)}${l.route ? ` ${l.route}` : ''}${l.headsign ? ` towards ${l.headsign}` : ''}`;

/** Build StationSense steps from a journey and backend navigation instructions keyed by stop id. */
export function buildSteps(o: JourneyOption, nav: Record<string, NavStep[]>): GuideStep[] {
  const steps: GuideStep[] = [];
  o.legs.forEach((leg, i) => {
    const boardName = nm(leg.originId, leg.originName);
    const alightName = nm(leg.destinationId, leg.destinationName);
    const atBoard = nav[leg.originId] ?? [];
    const verified = atBoard.filter((s) => s.verified);
    const generic = atBoard.find((s) => !s.verified);
    if (i === 0) {
      if (verified.length) {
        verified.forEach((s, k) => steps.push({
          key: `l${i}-st${k}`, kind: 'station', legIndex: i, title: `At ${boardName}`, body: s.text, speech: s.text,
          stationVerified: true, fromLeg: leg,
        }));
      } else {
        const text = generic?.text ?? 'Follow station signage to the designated boarding area.';
        steps.push({
          key: `l${i}-st`, kind: 'station', legIndex: i, title: `Go to ${boardName}`, body: text,
          speech: `Go to ${boardName}. ${text}`, stationVerified: false, fromLeg: leg,
        });
      }
    }
    steps.push({
      key: `l${i}-board`, kind: 'board', legIndex: i, title: `Board ${routeText(leg)}`,
      body: `Board at ${boardName}.${leg.scheduledDeparture ? ` Scheduled departure ${fmtTime(leg.scheduledDeparture)} (timetable, not live).` : ''}`,
      speech: `Board the ${routeText(leg)} at ${boardName}.`, stationVerified: false, fromLeg: leg,
    });
    const mins = legMinutes(leg);
    steps.push({
      key: `l${i}-ride`, kind: 'ride', legIndex: i, title: `Ride to ${alightName}`,
      body: `Stay on the ${modeLabel(leg.mode).toLowerCase()} until ${alightName}.${mins != null ? ` Scheduled ride about ${mins} min.` : ''}`,
      speech: `Stay on until ${alightName}.`, stationVerified: false, fromLeg: leg,
    });
    steps.push({
      key: `l${i}-alight`, kind: 'alight', legIndex: i, title: `Get off at ${alightName}`,
      body: `This is your stop. Check the stop name on the sign: ${alightName}.`,
      speech: `Get off at ${alightName}.`, stationVerified: false, fromLeg: leg,
    });
    const next = o.legs[i + 1];
    if (next) {
      steps.push({
        key: `l${i}-xfer`, kind: 'transfer', legIndex: i, title: `Transfer to ${routeText(next)}`, body: '',
        speech: `Transfer. Next, take the ${routeText(next)} from ${nm(next.originId, next.originName)}.`,
        stationVerified: false, fromLeg: leg, toLeg: next,
      });
    }
  });
  const last = o.legs[o.legs.length - 1];
  steps.push({
    key: 'arrive', kind: 'arrive', legIndex: o.legs.length - 1, title: 'You have arrived',
    body: `Destination: ${nm(last.destinationId, last.destinationName)}.`,
    speech: `You have arrived at ${nm(last.destinationId, last.destinationName)}.`, stationVerified: false,
  });
  return steps;
}
