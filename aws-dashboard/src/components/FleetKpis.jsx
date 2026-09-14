export default function FleetKpis({ stations, alerts }) {
  const totalStations = stations ? stations.length : 0;
  const healthyCount = stations ? stations.filter((s) => s.status === "green").length : 0;
  const flaggedCount = stations ? stations.filter((s) => s.status === "red").length : 0;
  const activeAlertsCount = alerts ? alerts.length : 0;

  const healthPercent = totalStations > 0 ? Math.round((healthyCount / totalStations) * 100) : 100;
  const estimatedReadings = totalStations * 60;

  return (
    <div className="fleet-kpis-container">
      {/* Total Stations */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Total Stations</span>
          <span className="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="4" r="3" stroke="#38bdf8" strokeWidth="1.5" fill="none"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
          </span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-value numeric">{totalStations}</span>
          <span className="kpi-unit">stations</span>
        </div>
        <div className="kpi-footer">
          <span className="kpi-subtext">Haryana AWS Network</span>
        </div>
      </div>

      {/* Healthy */}
      <div className={`kpi-card ${healthyCount === totalStations && totalStations > 0 ? "kpi-accent-ok" : ""}`}>
        <div className="kpi-header">
          <span className="kpi-title">Operational</span>
          <span className="kpi-icon text-ok">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-value numeric text-ok">{healthyCount}</span>
          <span className="kpi-badge badge-ok">{healthPercent}%</span>
        </div>
        <div className="kpi-footer">
          <span className="kpi-subtext">{healthyCount === totalStations ? "All nodes within bounds" : `${flaggedCount} node needs attention`}</span>
        </div>
      </div>

      {/* Flagged */}
      <div className={`kpi-card ${flaggedCount > 0 ? "kpi-accent-fault" : ""}`}>
        <div className="kpi-header">
          <span className="kpi-title">Flagged</span>
          <span className={`kpi-icon ${flaggedCount > 0 ? "text-fault" : "text-subtle"}`}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/><line x1="8" y1="6" x2="8" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11" r="0.7" fill="currentColor"/></svg>
          </span>
        </div>
        <div className="kpi-value-row">
          <span className={`kpi-value numeric ${flaggedCount > 0 ? "text-fault" : ""}`}>{flaggedCount}</span>
          <span className="kpi-unit">faults</span>
        </div>
        <div className="kpi-footer">
          <span className="kpi-subtext">{flaggedCount > 0 ? "Requires inspection" : "No active faults"}</span>
        </div>
      </div>

      {/* Active Alerts */}
      <div className={`kpi-card ${activeAlertsCount > 0 ? "kpi-accent-warn" : ""}`}>
        <div className="kpi-header">
          <span className="kpi-title">Active Alerts</span>
          <span className="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v6M8 12v1" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/><circle cx="8" cy="8" r="7" stroke="#fbbf24" strokeWidth="1.5" fill="none"/></svg>
          </span>
        </div>
        <div className="kpi-value-row">
          <span className={`kpi-value numeric ${activeAlertsCount > 0 ? "text-warn" : ""}`}>{activeAlertsCount}</span>
          <span className="kpi-unit">unresolved</span>
        </div>
        <div className="kpi-footer">
          <span className="kpi-subtext">{activeAlertsCount > 0 ? "Anomaly flags active" : "All parameters nominal"}</span>
        </div>
      </div>

      {/* Telemetry */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Telemetry Buffer</span>
          <span className="kpi-icon">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><polyline points="2,12 5,7 8,9 11,4 14,6" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          </span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-value numeric">{estimatedReadings}+</span>
          <span className="kpi-unit">samples</span>
        </div>
        <div className="kpi-footer">
          <span className="kpi-subtext">Live 3s polling</span>
        </div>
      </div>
    </div>
  );
}
