# CitySync

**Find where you should actually live.**

CitySync solves the real problem behind every relocation: people patch together five different tools — rental apps, map apps, safety forums, commute calculators — to answer a question that should have one answer. CitySync gives that answer in one place.

---

## The Problem

> "Millions of people move to a new city every year with no real way to figure out where to live. Rental apps show price and size. Nothing tells you how long your commute will actually be, whether your daily destinations are reachable, what the area is like to live in, or whether it fits your household."

CitySync was built to solve exactly this.

---

## Features

### Core
- **Dynamic neighbourhood search** — works for any Indian city via OpenStreetMap + Overpass. Type Hyderabad, Nagpur, Coimbatore — it finds real suburbs, not a hardcoded list
- **Real commute times** — calculated via OSRM routing engine for Car, Metro, Bus, or Bike. Not estimates, not straight-line distances
- **Multiple daily destinations** — add up to 3 extra places (school, gym, hospital, parents' home). Commute score averages across all of them
- **Live amenity scoring** — healthcare, education, grocery, food, leisure, transit counted within 1.5 km radius via Overpass API
- **Match score with explanation** — weighted score across budget fit, commute, safety, transit, amenities, and lifestyle. "Why?" panel explains each score
- **Best Fit card** — plain-English recommendation at the top of results ("short commute, ₹8k under budget · good safety")

### UI
- **Multi-step preference form** — 5 steps: destination, workplace + transport, extra destinations, budget range, household type
- **Dual-handle range sliders** for budget and commute (Amazon-style)
- **Autocomplete** on all location inputs, backed by Nominatim — closes on selection, only reopens when user types again
- **Interactive map** — colour-coded pins by match %, workplace marker, 1.5km amenity radius circle, auto-fit bounds
- **View on Map modal** — focused modal map for any individual location card
- **Radar chart** on area detail pages (Chart.js)
- **Side-by-side compare** — all 11 metrics with winner highlighting per row
- **Saved shortlist** — localStorage-persisted, with Compare prompt when 2+ saved
- **Find Properties** — deep links into MagicBricks, NoBroker, and 99acres pre-filtered to the neighbourhood

### Technical
- Progressive data loading — UI updates as each location is enriched, no blank waiting
- Session persistence — preferences survive page refresh via sessionStorage
- Result caching — Nominatim and Overpass results cached in sessionStorage to avoid repeat requests
- Graceful fallback — if a city has no OSM suburb data, falls back to curated dataset
- Per-city filtering — Delhi shows Delhi areas only, Mumbai shows Mumbai, no cross-city bleed
- 404 page, mobile hamburger nav, keyboard-accessible range sliders and autocomplete

---

## Data Sources

| Source | Used For | Cost |
|---|---|---|
| [Nominatim / OpenStreetMap](https://nominatim.org) | Geocoding all location inputs, city bounding box lookup, neighbourhood search | Free |
| [Overpass API / OSM](https://overpass-api.de) | Live amenity counts (healthcare, education, grocery, food, leisure, transit) within 1.5km radius | Free |
| [OSRM](https://project-osrm.org) | Real road-based commute time routing for Car, Cycling, Walking | Free |

All sources are free and require **no API keys**.

---

## Tech Stack

| Category | Library |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router v7 |
| Map | Leaflet + react-leaflet |
| Charts | Chart.js + react-chartjs-2 |
| Notifications | react-toastify |
| HTTP | Native `fetch` |
| Fonts | Inter (body) + Syne (headings) via Google Fonts |
| Styling | Plain CSS with custom property tokens |

---

## Architecture

```
src/
├── components/
│   ├── Autocomplete/       Nominatim-backed location search
│   ├── BestFitCard/        Top recommendation with plain-English reason
│   ├── FindProperties/     Deep links to MagicBricks, NoBroker, 99acres
│   ├── LiveDataBanner/     Loading progress for API enrichment
│   ├── LocationCard/       Card with scores, score bars, Why panel, Map modal
│   ├── Map/                Dashboard map with colour-coded pins
│   ├── MapModal/           Focused single-location map overlay
│   ├── Navbar/             Sticky nav with active link, mobile hamburger
│   ├── RangeSlider/        Custom dual-handle range slider
│   └── SkeletonCard/       Shimmer placeholder during loading
├── context/
│   └── LocationsContext    Shared enriched location state across pages
├── data/
│   └── locations.js        Curated dataset for Delhi, Noida, Mumbai, Bengaluru
├── hooks/
│   └── useEnrichedLocations  Orchestrates geocoding → routing → amenities
├── pages/
│   ├── Home/               Landing page with hero, features, how-it-works
│   ├── Preferences/        5-step form (destination, work, destinations, budget, lifestyle)
│   ├── Dashboard/          Scored + filtered results, map toggle, sidebar filters
│   ├── AreaDetails/        Full profile with radar chart, amenity counts, property links
│   ├── Compare/            Side-by-side metric comparison with winner highlighting
│   ├── Saved/              localStorage shortlist
│   └── NotFound/           404 page
├── services/
│   ├── geocoding.js        Nominatim geocode + Overpass neighbourhood search
│   ├── overpass.js         Single-query amenity profile per location
│   └── routing.js          OSRM commute time calculation
├── styles/
│   └── global.css          CSS custom property token system
└── utils/
    └── recommendations.js  Match scoring + plain-English reason builder
```

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## How It Works

1. User fills in destination city, workplace, optional extra destinations, budget range, and household type
2. On submit, CitySync geocodes the destination city → queries Overpass for real suburbs within the city bounding box
3. Commute times are calculated from each suburb to the workplace (and any extra destinations) via OSRM — averaged across all destinations
4. Amenity profiles are fetched per suburb from Overpass in a single round-trip query
5. Each location is scored (budget fit 30%, commute 25%, safety 20%, transit 10%, amenities 10%, lifestyle 5%) and ranked
6. Results are shown progressively as each location's data arrives — no blank waiting

---

Built by **Meet8376** · 2026
