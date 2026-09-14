import { useState, useEffect } from "react";
import { usePolling } from "./usePolling";
import { getStations, getAlerts } from "./api";
import Header from "./components/Header";
import FleetKpis from "./components/FleetKpis";
import StationMap from "./components/StationMap";
import AlertsPanel from "./components/AlertsPanel";
import StationGrid from "./components/StationGrid";
import StationDetail from "./components/StationDetail";
import SystemStatus from "./components/SystemStatus";
import "./App.css";

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const { data: stations, error: stationsError } = usePolling(getStations, [], 3000);
  const { data: alerts } = usePolling(getAlerts, [], 3000);

  // Update last sync timestamp when data arrives
  useEffect(() => {
    if (stations) {
      setLastSync(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
  }, [stations, alerts]);

  // Auto-select initial station: prioritize any station with a fault, otherwise default to first station
  useEffect(() => {
    if (stations && stations.length > 0 && selectedId === null) {
      const faultStation = stations.find((s) => s.status === "red");
      if (faultStation) {
        setSelectedId(faultStation.id);
      } else {
        setSelectedId(stations[0].id);
      }
    }
  }, [stations, selectedId]);

  const selectedStation = (stations || []).find((s) => s.id === selectedId);

  return (
    <div className="app-shell">
      {/* 1. Command Center Header */}
      <Header
        stations={stations}
        error={stationsError}
        lastSync={lastSync}
      />

      {stationsError && (
        <div className="error-banner">
          <span className="error-icon">⚠</span>
          <div>
            <strong>Backend Connection Error:</strong> Unable to connect to <code>http://127.0.0.1:8000</code>.
            Ensure FastAPI server is running via <code>uvicorn app.main:app</code>.
          </div>
        </div>
      )}

      <main className="dashboard-content">
        {/* 2. Fleet KPI / Health Summary */}
        <FleetKpis stations={stations} alerts={alerts} />

        {/* 3. Live Map + Active Alerts Side-by-Side */}
        <section className="map-alerts-layout">
          <div className="map-column">
            <StationMap
              stations={stations || []}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
          <div className="alerts-column">
            <AlertsPanel
              alerts={alerts || []}
              onSelectStation={setSelectedId}
            />
          </div>
        </section>

        {/* 4. Station Fleet Monitoring Cards */}
        <section className="fleet-cards-section">
          <StationGrid
            stations={stations || []}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>

        {/* 5. Selected Station Telemetry & Anomaly Workspace */}
        <section className="station-workspace-section">
          <StationDetail
            station={selectedStation}
            allStations={stations || []}
          />
        </section>
      </main>

      {/* 6. System Status Bar */}
      <SystemStatus isOnline={!stationsError && stations !== null} />
    </div>
  );
}
