# CitySync

**Find where you should actually live.**

CitySync helps people moving to a new city figure out which neighbourhood actually fits their life — not just their budget. It combines real commute times, live amenity data, and lifestyle preferences into one ranked view.

---

## The Problem

Millions of people move to a new city every year patching together five different tools to answer one question: *where should I live?* Rental apps show price and size. Nothing tells you how long your commute will actually be, whether the area has schools or hospitals, or whether it matches your household.

CitySync answers that in one place.

---

## Features

- **Multi-step preference form** — city, workplace, budget range, commute limit, household type
- **Dynamic neighbourhood search** — works for any Indian city via OpenStreetMap, not just a hardcoded list
- **Real commute times** — calculated via OSRM routing engine, not estimates
- **Live amenity scoring** — healthcare, education, grocery, food, leisure counted within 1.5 km via Overpass API
- **Match score** — weighted scoring across budget fit, commute, safety, transit, amenities, and lifestyle
- **Interactive map** — colour-coded pins by match %, workplace marker, auto-fit bounds
- **Side-by-side compare** — all metrics with winner highlighting per row
- **Saved shortlist** — localStorage-persisted, with Compare prompt
- **Radar chart** on area detail pages
- **Autocomplete** on all location inputs (Nominatim-powered)
- **Dual-handle range sliders** for budget and commute filters

---

## Data Sources

| Source | Used For |
|---|---|
| [Nominatim / OpenStreetMap](https://nominatim.org) | Geocoding, neighbourhood search |
| [OSRM](https://project-osrm.org) | Real commute time routing |
| [Overpass API / OSM](https://overpass-api.de) | Live amenity counts |

All sources are free and require no API key.

---

## Tech Stack

- React 19 + Vite
- React Router v7
- Leaflet + react-leaflet (map)
- Chart.js + react-chartjs-2 (radar chart)
- react-toastify (notifications)

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Built by

Meet8376 · CitySync · 2026
