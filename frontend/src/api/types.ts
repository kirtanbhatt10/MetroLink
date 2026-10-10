// Types mirror the actual backend (../../src/app.ts, src/services/routing/engine.ts).
export type Objective = 'balanced' | 'fastest' | 'least_walking' | 'fewest_transfers';

export interface Place {
  id: string;
  name: string;
  mode: string;
  operator: string | null;
  latitude: number | null;
  longitude: number | null;
  verificationStatus: string;
}

export interface Preferences {
  objective: Objective;
  maxWalkingMeters?: number | null;
  maxTransfers?: number | null;
  avoidStairs: boolean;
  preferStepFree: boolean;
}

export interface Leg {
  originId: string;
  originName?: string;
  destinationId: string;
  destinationName?: string;
  mode: string;
  route?: string | null;
  tripId?: string;
  headsign?: string | null;
  scheduledDeparture?: string | null;
  scheduledArrival?: string | null;
  sourceId?: string | null;
  verificationStatus?: string;
}

export interface JourneyOption {
  legs: Leg[];
  transfers: number;
  walkingMeters: number;
  confidence: string;
  rankingReason: string;
}

export interface PlanResult {
  options: JourneyOption[];
  noRoute: boolean;
  reason: string;
}

export interface NavStep {
  id: string;
  stopId: string;
  text: string;
  verified: boolean;
  verificationStatus: string;
  isIllustrative: boolean;
}

export interface DataSource {
  source_id: string;
  name: string;
  source_url?: string | null;
  license?: string | null;
  retrieved_at?: string | null;
  feed_start_date?: string | null;
  feed_end_date?: string | null;
  archive_hash?: string | null;
  import_status: string;
  quality_notes?: string | null;
}

export interface DataStatus {
  sources: DataSource[];
  counts: { agency: string; mode: string; count: number }[];
  warnings: string[];
  confidence: { verified: number; estimated: number; stale: number; illustrative: number };
}

export interface DisruptionResult {
  before: PlanResult;
  after: PlanResult;
  alert: { isSimulated: boolean; fromStopId: string; toStopId: string };
}
