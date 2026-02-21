import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppShell from "./components/AppShell";
import DatenManagerPage from "./pages/DatenManagerPage";
import NetzGeometriePage from "./pages/NetzGeometriePage";
import NetzAuslastungPage from "./pages/NetzAuslastungPage";
import FahrplanFrequenzPage from "./pages/FahrplanFrequenzPage";
import HaltestellenPage from "./pages/HaltestellenPage";
import FahrplanVergleichPage from "./pages/FahrplanVergleichPage";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DatenManagerPage />} />
          <Route path="/daten" element={<DatenManagerPage />} />
          <Route path="/netz" element={<NetzGeometriePage />} />
          <Route path="/netz/auslastung" element={<NetzAuslastungPage />} />
          <Route path="/fahrplan" element={<FahrplanFrequenzPage />} />
          <Route path="/haltestellen" element={<HaltestellenPage />} />
          <Route path="/vergleich" element={<FahrplanVergleichPage />} />
          <Route path="/einstellungen" element={<div className="p-8"><h2 className="text-2xl font-bold text-white">Einstellungen</h2><p className="text-text-muted mt-2">Konfiguration kommt bald.</p></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
