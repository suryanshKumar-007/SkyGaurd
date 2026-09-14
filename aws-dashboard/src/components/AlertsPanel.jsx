function formatTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getSeverityBadge(severity) {
  const sev = (severity || "high").toLowerCase();
  if (sev === "high") return { label: "Critical", className: "sev-badge-high" };
  if (sev === "medium") return { label: "Medium", className: "sev-badge-med" };
  return { label: "Low", className: "sev-badge-low" };
}

function getSensorIcon(sensor) {
  if (!sensor) return "—";
  if (sensor.includes("temp")) return "T";
  if (sensor.includes("humid")) return "H";
  if (sensor.includes("press")) return "P";
  return "S";
}

function getSensorColor(sensor) {
  if (!sensor) return "#8b97b0";
  if (sensor.includes("temp")) return "#fb923c";
  if (sensor.includes("humid")) return "#34d399";
  if (sensor.includes("press")) return "#38bdf8";
  return "#8b97b0";
}

export default function AlertsPanel({ alerts, onSelectStation }) {
  const alertList = alerts || [];

  return (
    <div className="alerts-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <div className="title-with-badge">
            <h2 className="panel-title">Active Alerts</h2>
            <span className={`alert-count-pill ${alertList.length > 0 ? "has-alerts" : "all-clear"}`}>
              {alertList.length}
            </span>
          </div>
          <p className="panel-subtitle">Live anomaly notifications</p>
        </div>
      </div>

      {alertList.length === 0 ? (
        <div className="alerts-empty-state">
          <span className="empty-icon text-ok">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <p className="empty-title">All Clear</p>
          <p className="empty-desc">No active anomalies across the network.</p>
        </div>
      ) : (
        <div className="alerts-list">
          {alertList.map((a) => {
            const sev = getSeverityBadge(a.severity);
            const isML = a.rule_fired === "isolation_forest";
            const sensorColor = getSensorColor(a.sensor);

            return (
              <div
                key={a.id}
                className={`alert-card ${sev.className}`}
                onClick={() => onSelectStation && onSelectStation(a.station_id)}
                title="Click to inspect this station"
              >
                <div className="alert-card-top">
                  <div className="alert-type-group">
                    <span className="alert-sensor-icon" style={{ color: sensorColor, fontWeight: 700, fontSize: '12px' }}>
                      {getSensorIcon(a.sensor)}
                    </span>
                    <strong className="alert-anomaly-type">
                      {a.anomaly_type?.charAt(0).toUpperCase() + a.anomaly_type?.slice(1)} Detected
                    </strong>
                  </div>
                  <span className={`alert-sev-tag ${sev.className}`}>
                    {sev.label}
                  </span>
                </div>

                <div className="alert-station-row">
                  <span className="alert-st-name">{a.station_name || `Station #${a.station_id}`}</span>
                  {a.station_code && <span className="alert-st-code">({a.station_code})</span>}
                  <span className="alert-sensor-target">· {a.sensor}</span>
                </div>

                <div className="alert-metric-strip">
                  {a.raw_value != null && (
                    <div className="alert-metric">
                      <span className="m-label">Value:</span>
                      <span className="m-val numeric">{a.raw_value.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="alert-metric">
                    <span className="m-label">Conf:</span>
                    <span className="m-val numeric">{(a.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="alert-metric">
                    <span className="m-label">Via:</span>
                    <span className={`m-rule-tag ${isML ? "rule-ml" : "rule-engine"}`}>
                      {isML ? "Isolation Forest" : a.rule_fired}
                    </span>
                  </div>
                </div>

                <div className="alert-card-bottom">
                  <span className="alert-time numeric">{formatTime(a.timestamp)}</span>
                  <span className="alert-action-hint">Inspect →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
