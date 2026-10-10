# MetroLink Ahmedabad–Gandhinagar starter dataset

This is a source-grounded starter package, not a complete operational transit feed.

## Contents
- `metro/metro_stations_curated.csv`: station names transcribed from GMRC official station pages. Sequence/corridor order is marked for validation where the official page is a list rather than a definitive route graph.
- `metro/metro_gates_accessibility.csv`: published gate and lift-location details transcribed from GMRC's entry/exit page. It does not assert current live gate status or end-to-end step-free route accessibility.
- `gtfs/source_manifest.csv`: source manifest for bus/BRTS/metro datasets and current limitations.
- `landmarks/station_landmarks_template.csv`: empty template; no landmarks fabricated.

## Official / upstream sources
- GMRC route & fares: https://www.gujaratmetrorail.com/ahmedabad/route-and-fares/
- GMRC train information: https://www.gujaratmetrorail.com/ahmedabad/train-information/
- GMRC gate and entrance information: https://www.gujaratmetrorail.com/ahmedabad/information-of-entry-exit-gate-at-entrance/
- AMTS official planner: https://www.amts.co.in/plan/
- Ahmedabad Janmarg/BRTS official planner: https://www.ahmedabadbrts.org/en/plan/
- Candidate combined AMTS/AJL/GTSL GTFS: https://github.com/croyla/amd-gtfs

## Critical limitations
1. The GTFS archive could not be downloaded in the research environment. No AMTS/BRTS/GTSL route rows are included or invented.
2. The upstream repository says GTSL trip times may be obsolete.
3. Station names are source-grounded; route order, exact corridor membership, interchanges, coordinates, travel times and service calendars must be validated against current official route maps/timetables before they are used for journey calculations.
4. No coordinates, fares, bus schedules, walking links, rickshaw stands or indoor navigation paths have been fabricated.
5. Treat any unverified data as unknown. For hackathon fallback, create a separate explicitly illustrative demo dataset rather than mixing sample records with verified records.

## Next steps
1. Retry GTFS download when DNS/network access is restored.
2. Inspect `agency.txt`, `stops.txt`, `routes.txt`, `trips.txt`, `stop_times.txt`, `calendar.txt`, `calendar_dates.txt`, `shapes.txt`, `transfers.txt`, `frequencies.txt`, `feed_info.txt`.
3. Preserve source IDs and namespace IDs across operators.
4. Run import and validation scripts.
5. Validate GTSL service calendars and schedules independently.
6. Build routing graph edges only from imported trips/transfers and explicitly sourced walking links.
