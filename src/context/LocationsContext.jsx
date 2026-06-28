/**
 * LocationsContext — shares enriched location data across the whole app.
 * Also caches the last enrichment key so Dashboard doesn't re-fetch
 * when navigating back from AreaDetails/Compare/Saved.
 */

import { createContext, useContext, useState } from "react";
import { locations as staticLocations } from "../data/locations";

const LocationsContext = createContext(null);

export function LocationsProvider({ children }) {
  const [locations, setLocations] = useState(staticLocations);
  // Tracks which preferences were last enriched so we can skip re-runs
  const [lastEnrichKey, setLastEnrichKey] = useState(null);

  return (
    <LocationsContext.Provider value={{ locations, setLocations, lastEnrichKey, setLastEnrichKey }}>
      {children}
    </LocationsContext.Provider>
  );
}

export function useLocations() {
  return useContext(LocationsContext);
}
