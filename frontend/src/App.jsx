import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppShell from "./components/AppShell";
import DatenManagerPage from "./pages/DatenManagerPage";
import NetzGeometriePage from "./pages/NetzGeometriePage";
import NetzAuslastungPage from "./pages/NetzAuslastungPage";
import NetworkMapPage from "./pages/NetworkMapPage";
import FahrplanFrequenzPage from "./pages/FahrplanFrequenzPage";
import HaltestellenPage from "./pages/HaltestellenPage";
import HaltestellenChartsPage from "./pages/HaltestellenChartsPage";
import FahrplanVergleichPage from "./pages/FahrplanVergleichPage";
import UmlaufPage from "./pages/UmlaufPage";
import UmlaufChartsPage from "./pages/UmlaufChartsPage";
import GaragierungPage from "./pages/GaragierungPage";
import KorridorAnalysePage from "./pages/KorridorAnalysePage";
import { ScenarioProvider, useScenario } from "./context/ScenarioContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

function AppRoutes() {
  const { scenario } = useScenario();
  return (
    <Router>
      <Routes>
        <Route element={<AppShell key={scenario} />}>
          <Route path="/" element={<ErrorBoundary><DatenManagerPage /></ErrorBoundary>} />
          <Route path="/daten" element={<ErrorBoundary><DatenManagerPage /></ErrorBoundary>} />
          <Route path="/netz" element={<ErrorBoundary><NetzGeometriePage /></ErrorBoundary>} />
          <Route path="/netz/plan" element={<ErrorBoundary><NetworkMapPage /></ErrorBoundary>} />
          <Route path="/netz/auslastung" element={<ErrorBoundary><NetzAuslastungPage /></ErrorBoundary>} />
          <Route path="/fahrplan" element={<ErrorBoundary><FahrplanFrequenzPage /></ErrorBoundary>} />
          <Route path="/haltestellen" element={<ErrorBoundary><HaltestellenPage /></ErrorBoundary>} />
          <Route path="/haltestellen/charts" element={<ErrorBoundary><HaltestellenChartsPage /></ErrorBoundary>} />
          <Route path="/vergleich" element={<ErrorBoundary><FahrplanVergleichPage /></ErrorBoundary>} />
          <Route path="/korridor" element={<ErrorBoundary><KorridorAnalysePage /></ErrorBoundary>} />
          <Route path="/umlaeufe" element={<ErrorBoundary><UmlaufPage /></ErrorBoundary>} />
          <Route path="/umlaeufe/charts" element={<ErrorBoundary><UmlaufChartsPage /></ErrorBoundary>} />
          <Route path="/garagen" element={<ErrorBoundary><GaragierungPage /></ErrorBoundary>} />
          <Route path="/einstellungen" element={<div className="p-8"><h2 className="text-2xl font-bold text-white">Einstellungen</h2><p className="text-text-muted mt-2">Konfiguration kommt bald.</p></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ScenarioProvider>
      <AppRoutes />
    </ScenarioProvider>
  );
}

export default App;
