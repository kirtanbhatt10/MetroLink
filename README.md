# MetroLink backend

MetroLink is a local Express and SQLite backend with a React/Vite frontend in `frontend/`. The current imported GTFS feed contains scheduled Ahmedabad and Gandhinagar bus service records. Curated GMRC station and gate listings are searchable, but do not establish metro operations or station-to-station connections. This project does not claim complete Ahmedabad–Gandhinagar transit coverage.

## Architecture

- `src/`: Express API, SQLite schema/migrations and graph router.
- `frontend/`: existing React/Vite client.
- `scripts/`: GTFS and curated metro importers plus validation.
- `metrolink_dataset/metro/`: supplied curated GMRC CSV sources.
- `data/metrolink.sqlite`: local imported database (generated/local data).
- GTFS text files: currently extracted directly in the project root; source files are retained in place. No original ZIP archive was present.

## Prerequisites and setup

Use Node.js 20+ and npm. Install root and frontend dependencies separately with `npm install` in the project root and `npm install` in `frontend/`. Copy `.env.example` to `.env` only if a local override is needed; never commit secrets. The API listens on port 3000 by default. The frontend client defaults to `http://localhost:3000` and can be configured with `VITE_API_BASE_URL`.

## Data sources and limits

The combined GTFS text feed is from [croyla/amd-gtfs](https://github.com/croyla/amd-gtfs), which declares MIT licensing. `agency.txt` identifies AMTS, Ahmedabad Janmarg Limited (AJL), and Gandhinagar Transport Services Limited (GTSL). Its `feed_info.txt` date range is 2026-09-30 through 2027-03-29. The upstream repository warns GTSL trip times may be obsolete; GTSL is marked stale and excluded from routing. Imported text-file manifest digest: `a2faedb16835eec2664533f637770dbb5b47bcda967e3b459c0d8e5698d8231e`. The original archive was not found, so no archive hash is available.

Metro CSVs are supplied in `metrolink_dataset/metro/`. Their URLs and row verification statuses are retained. Names/sequences are not evidence of operational service, adjacency, or walking transfer. Unknown coordinates remain unknown. Do not manufacture schedules, fares, route numbers, stops, or rickshaw stands.

## Database and imports

The SQLite schema is initialized/migrated by the backend connection layer. Import the discovered local extracted GTFS files without moving them:

```sh
npm run import:gtfs
npm run import:gtfs -- path/to/another/extracted/feed
npm run import:metro
npm run validate
```

The importer also accepts a real ZIP path when one is supplied. It validates required GTFS files and uses transactions; re-import is idempotent and preserves other sources. Optional files such as `calendar_dates.txt`, `transfers.txt`, and `frequencies.txt` are imported when present. The current extracted feed has no original ZIP to hash and does not include those optional files. Do not download another copy when a valid local feed is available. When needed, the retryable upstream download command is `npm run download:gtfs`.

## Run the applications

Terminal 1 (project root):

```sh
npm run dev
```

Terminal 2 (`frontend/`):

```sh
npm run dev
```

The API implements health, data status, place search, journey planning, navigation instructions/recovery and disruption simulation. Responses use the frontend client's `{data: ...}` and `{error: ...}` envelopes. Routing honors service calendars/exceptions and only uses scheduled trips and supported transfer/walking edges. It does not infer links from proximity. Disruption simulation removes a selected supported graph edge for its recomputation; the saved disruption record is explicitly simulated. Timetables are static, not live vehicle arrivals.

## Tests and build

```sh
npm test
npm run build
npm run validate
```

In `frontend/`, run `npm run typecheck`, `npm run build`, and `npm test`.

## Current validation snapshot

The loaded database contains 4 agencies including GMRC curation, 3,260 stops, 639 routes, 14,323 trips, 646,471 stop times, 1 calendar, 0 calendar exceptions, 0 transfers, 0 frequencies, 270,043 shape points, 57 curated metro stations, and 31 gate/lift entries. GTFS operator records: AJL 149 routes / 3,940 trips / 193 served stops; AMTS 474 / 10,167 / 3,039; GTSL 16 / 216 / 74 (stale and not routable). The 3,203 bus stops are unverified in this feed; 57 metro stops have unknown coordinates and no supported graph connections. Three repeated station-name groups remain separate by ID; 57 metro corridor/order listings require validation and one gate listing could not be uniquely matched. Run `npm run validate` for the current live database report.

<<<<<<< HEAD
=======
## Known limitations

No verified metro trip graph or supported GTFS transfer links are present, so metro cannot participate in route planning. The feed has no calendar exceptions, transfers or frequencies. Only observed GTFS trips and explicitly supported connections can be routed; no completeness or service freshness is guaranteed for AMTS/AJL by this import. Landmark recovery uses a selected stop as the new origin; generic instructions are returned when verified navigation steps are unavailable. No live data, fares, or generated demo graph are included.

## Routing notes

Boarding is limited to departures within 2 hours of arriving at a stop (`MAX_WAIT_SECONDS` in `src/services/routing/engine.ts`), which cut worst-case multi-transfer searches from about 34 s to about 6 s with identical results on the benchmark journeys. Journeys that would need a longer wait are not returned. The planner uses the current time when no departure time is supplied, so late-night searches (after the last scheduled departure) return "no active connection".
>>>>>>> Speed up routing: numeric ride sort, binary-search boarding, 2h max wait
