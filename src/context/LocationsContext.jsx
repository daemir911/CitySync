/**
 * LocationsContext — shares enriched location data across the whole app.
 * Dashboard enriches the locations, then stores them here so AreaDetails
 * and Compare can read live data without re-fetching.
 */

import { createContext, useContext, useState } from "react";
import { locations as staticLocations } from "../data/locations";

const LocationsContext = createContext(null);

export function LocationsProvider({ children }) {
  const [locations, setLocations] = useState(staticLocations);

  return (
    <LocationsContext.Provider value={{ locations, setLocations }}>
      {children}
    </LocationsContext.Provider>
  );
}

export function useLocations() {
  return useContext(LocationsContext);
}
