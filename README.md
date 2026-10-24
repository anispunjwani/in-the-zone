# From Car Washes to Community

NYC Transit Land Opportunity Explorer is a hackathon MVP for asking: what else could exist within a short walk of a subway station?

The app combines an official MTA station-complex snapshot with live NYC MapPLUTO tax-lot polygons and property attributes. Candidate classification and redevelopment scenarios are transparent exploratory rules—not zoning determinations, appraisals, entitlement analyses, or policy recommendations.

## Technical stack

- Next.js, React, and strict TypeScript
- Tailwind CSS
- MapLibre GL JS with a token-free basemap
- shadcn/ui primitives and Lucide icons
- Official MTA station snapshot plus live MapPLUTO adapter

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by the development server.

## Architecture

The UI works exclusively with normalized domain objects in `types/domain.ts`.

```text
UI components → services → repository interfaces → MTA snapshot + MapPLUTO adapter → labeled fallback
```

`lib/dataProviders.ts` is the lightweight dependency configuration. Components never import the raw station list or mock parcel generator.

Key modules:

- `data/repositories/interfaces.ts` — source-independent contracts
- `data/adapters/MtaStationRepository.ts` — serves the generated official station snapshot
- `data/adapters/MapPlutoParcelRepository.ts` — loads real parcels and falls back safely
- `app/api/parcels/route.ts` — queries and normalizes the MapPLUTO feature layer
- `scripts/sync-mta-stations.mjs` — refreshes the official station snapshot
- `data/adapters/MockParcelRepository.ts` — deterministic, clearly labeled outage fallback
- `services/parcels.ts` — parcel generation and distance calculation
- `services/scenarios.ts` — low/medium/high capacity math and station summaries
- `components/map/TransitOpportunityMap.tsx` — MapLibre presentation over normalized models

## Data disclaimer

Real data: NYC Subway station names, station coordinates, routes, accessibility, tax-lot geometry, addresses, land use, zoning district, lot area, building area, and built FAR.

Derived data: straight-line station distance and rule-based candidate categories.

Illustrative data: redevelopment capacity scenarios. When MapPLUTO is unavailable, the interface explicitly switches to labeled demonstration parcels.

Refresh MTA stations with:

```bash
npm run data:sync:stations
```

## Data sources and next integrations

The current adapters translate official source-specific fields at the repository boundary. Future integrations can use the same contracts:

1. Replace the radial buffer with a pedestrian-network isochrone.
2. Add authoritative zoning-envelope calculations rather than showing the primary district only.
3. Join building footprints and permits by BBL/BIN.
4. Add community facilities, flood, environmental, and affordability layers.

## Recommended next steps

1. Add zoning-envelope and feasibility assumptions with clear provenance.
2. Add community facilities, flood, environmental, and affordability layers.
3. Validate candidate rules and methodology with planners and community partners.
