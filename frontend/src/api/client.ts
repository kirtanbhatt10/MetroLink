import type {
  DataStatus, DisruptionResult, NavStep, PlanResult, Place, Preferences, JourneyOption,
} from './types';

export const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message: string, public kind: 'offline' | 'timeout' | 'http' | 'invalid', public status?: number) {
    super(message);
  }
}

const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null;

async function request(path: string, init: RequestInit = {}, signal?: AbortSignal, timeoutMs = 10000): Promise<unknown> {
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, timeoutMs);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      signal: ctrl.signal,
    });
    let body: unknown;
    try { body = await res.json(); } catch { throw new ApiError('The server returned an unreadable response.', 'invalid', res.status); }
    if (!res.ok) {
      const err = isObj(body) && isObj(body.error) ? body.error : {};
      const msg = err.message ?? (res.status === 400 ? 'The request was not valid.' : `Server error (${res.status}).`);
      throw new ApiError(String(msg), 'http', res.status);
    }
    if (!isObj(body) || !('data' in body)) throw new ApiError('Unexpected response shape from server.', 'invalid', res.status);
    return body.data;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error).name === 'AbortError') {
      if (timedOut) throw new ApiError('The server took too long to respond.', 'timeout');
      throw e;
    }
    throw new ApiError(`Cannot reach the MetroLink backend at ${API_BASE}. Is it running?`, 'offline');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

const post = (path: string, body: unknown, signal?: AbortSignal, timeoutMs = 10000) =>
  request(path, { method: 'POST', body: JSON.stringify(body) }, signal, timeoutMs);

const bad = () => new ApiError('The server response did not match the expected format.', 'invalid');

export async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal });
    const j = await res.json();
    return res.ok && isObj(j) && j.ok === true;
  } catch { return false; }
}

export async function searchPlaces(q: string, signal?: AbortSignal): Promise<Place[]> {
  const data = await request(`/api/v1/places/search?q=${encodeURIComponent(q)}&limit=8`, {}, signal);
  if (!Array.isArray(data)) throw bad();
  return data.filter((p) => isObj(p) && typeof p.id === 'string' && typeof p.name === 'string') as Place[];
}

function parsePlan(data: unknown): PlanResult {
  if (!isObj(data) || !Array.isArray(data.options)) throw bad();
  const options = data.options.filter((o: any) => isObj(o) && Array.isArray(o.legs) && o.legs.length > 0).map((o: any) => ({
    legs: o.legs,
    transfers: Number(o.transfers) || 0,
    walkingMeters: Number(o.walkingMeters) || 0,
    confidence: String(o.confidence ?? 'unverified'),
    rankingReason: String(o.rankingReason ?? ''),
  })) as JourneyOption[];
  return { options, noRoute: Boolean(data.noRoute) || options.length === 0, reason: String(data.reason ?? '') };
}

export async function planJourney(originId: string, destinationId: string, preferences: Preferences, signal?: AbortSignal) {
  return parsePlan(await post('/api/v1/journeys/plan', { originId, destinationId, preferences }, signal, 30000));
}

// Backend returns raw DB rows (snake_case) for verified steps and a camelCase generic fallback.
export async function getInstructions(stopId: string, signal?: AbortSignal): Promise<NavStep[]> {
  const data = await post('/api/v1/navigation/instructions', { stopId }, signal);
  if (!Array.isArray(data)) throw bad();
  return data.filter(isObj).map((s: any, i: number): NavStep => {
    const status = String(s.verification_status ?? s.verificationStatus ?? 'unknown');
    return {
      id: String(s.step_id ?? `${stopId}-generic-${i}`),
      stopId,
      text: String(s.instruction_text ?? s.instructionText ?? ''),
      verified: status === 'verified',
      verificationStatus: status,
      isIllustrative: Boolean(s.is_illustrative ?? s.isIllustrative),
    };
  }).filter((s) => s.text);
}

export async function recoverRoute(originId: string, destinationId: string, signal?: AbortSignal) {
  return parsePlan(await post('/api/v1/navigation/recover', { originId, destinationId }, signal, 30000));
}

export async function simulateDisruption(
  p: { originId: string; destinationId: string; fromStopId: string; toStopId: string }, signal?: AbortSignal,
): Promise<DisruptionResult> {
  const d = await post('/api/v1/journeys/simulate-disruption', p, signal, 60000);
  if (!isObj(d) || !isObj(d.alert)) throw bad();
  return { before: parsePlan(d.before), after: parsePlan(d.after), alert: d.alert as DisruptionResult['alert'] };
}

export async function getDataStatus(signal?: AbortSignal): Promise<DataStatus> {
  const d = await request('/api/v1/data/status', {}, signal);
  if (!isObj(d) || !Array.isArray(d.sources) || !Array.isArray(d.counts) || !isObj(d.confidence)) throw bad();
  return { sources: d.sources, counts: d.counts, warnings: Array.isArray(d.warnings) ? d.warnings : [], confidence: d.confidence as DataStatus['confidence'] };
}
