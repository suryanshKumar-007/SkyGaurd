import { usePolling } from "../usePolling";
import { getReadings, getAnomalies } from "../api";
import CurrentConditions from "./CurrentConditions";
import DetectionEngine from "./DetectionEngine";
import NetworkComparison from "./NetworkComparison";
import TelemetryChart from "./TelemetryChart";
import DemoControls from "./DemoControls";
import AnomalyTable from "./AnomalyTable";

export default function StationDetail({ station, allStations = [] }) {
  const stationId = station?.id ?? null;

  const { data: readings } = usePolling(
    () => (stationId ? getReadings(stationId, 60) : Promise.resolve([])),
    [stationId],
    3000
  );

  const { data: anomalies } = usePolling(
    () => (stationId ? getAnomalies(stationId) : Promise.resolve([])),
    [stationId],
    3000
  );

  if (!station) {
    return (
      <div className="station-detail-empty">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="10" r="4" stroke="#5e6b82" strokeWidth="2" fill="none"/><path d="M6 28c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="#5e6b82" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
        <h3>No Station Selected</h3>
        <p>Select a station from the map or the grid above to view detailed telemetry and anomaly analysis.</p>
      </div>
    );
  }

  const latestReading = readings && readings.length > 0 ? readings[readings.length - 1] : station.latest_reading;
  const latestAnomaly = anomalies && anomalies.length > 0 ? anomalies[0] : null;
  const isFault = station.status === "red";

  return (
    <div className="selected-station-workspace">
      {/* Workspace Header */}
      <div className="workspace-header-bar">
        <div className="workspace-title-group">
          <span className="ws-badge">Selected Station</span>
          <div className="ws-main-row">
            <h2 className="ws-station-name">{station.name}</h2>
            <span className="ws-station-code">[{station.station_code}]</span>
            <span className="ws-geo">Haryana, India · {station.latitude}°N, {station.longitude}°E</span>
          </div>
        </div>

        <div className={`workspace-status-pill ${isFault ? "ws-status-fault" : "ws-status-ok"}`}>
          <span className="ws-status-dot" />
          <span className="ws-status-text">
            {isFault ? "Anomaly Detected" : "Operational"}
          </span>
        </div>
      </div>

      {/* Grid: Current Conditions + Detection Engine */}
      <div className="workspace-top-grid">
        <CurrentConditions
          latestReading={latestReading}
          stationName={station.name}
          stationCode={station.station_code}
        />
        <DetectionEngine latestAnomaly={latestAnomaly} />
      </div>

      {/* Network Context */}
      <NetworkComparison
        selectedStation={station}
        allStations={allStations}
        latestAnomaly={latestAnomaly}
      />

      {/* Telemetry Chart */}
      <TelemetryChart
        readings={readings}
        anomalies={anomalies}
        stationName={station.name}
        stationCode={station.station_code}
      />

      {/* Demo Controls */}
      <DemoControls stationId={station.id} stationName={station.name} />

      {/* Anomaly History */}
      <AnomalyTable anomalies={anomalies} stationName={station.name} />
    </div>
  );
}
