import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Preferences from "./pages/Preferences/Preferences";
import Dashboard from "./pages/Dashboard/Dashboard";
import Compare from "./pages/Compare/Compare";
import Saved from "./pages/Saved/Saved";
import AreaDetails from "./pages/AreaDetails/AreaDetails";
import { LocationsProvider } from "./context/LocationsContext";

function App() {
  return (
    <LocationsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/details/:id" element={<AreaDetails />} />
        </Routes>
      </BrowserRouter>
    </LocationsProvider>
  );
}

export default App;