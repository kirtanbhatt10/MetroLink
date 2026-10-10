import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toSeconds, journeyMinutes, badges, buildSteps, fmtTime } from './journey';
import type { JourneyOption } from '../api/types';

const opt = (dep: string, arr: string, transfers = 0, walk = 0): JourneyOption => ({
  legs: [{ originId: 'a', destinationId: 'b', mode: 'bus', scheduledDeparture: dep, scheduledArrival: arr }],
  transfers, walkingMeters: walk, confidence: 'verified', rankingReason: 'balanced',
});

test('parses GTFS times beyond 24h', () => {
  assert.equal(toSeconds('25:10:00'), 90600);
  assert.equal(fmtTime('25:10:00'), '01:10');
});
test('computes duration', () => { assert.equal(journeyMinutes(opt('08:00:00', '08:45:00')), 45); });
test('no badges for a single option or ties', () => {
  assert.deepEqual(badges([opt('08:00:00', '08:45:00')]), [[]]);
  const tie = badges([opt('08:00:00', '08:45:00'), opt('09:00:00', '09:45:00')]);
  assert.equal(tie[0].length + tie[1].length, 0);
});
test('fastest badge when strictly best', () => {
  assert.equal(badges([opt('08:00:00', '08:30:00'), opt('09:00:00', '09:45:00')])[0][0].kind, 'fastest');
});
test('steps start generic, end with arrive', () => {
  const s = buildSteps(opt('08:00:00', '08:30:00'), {});
  assert.equal(s[0].stationVerified, false);
  assert.equal(s[s.length - 1].kind, 'arrive');
});
