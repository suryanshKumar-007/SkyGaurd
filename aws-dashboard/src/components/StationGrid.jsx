function formatTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function StationGrid({ stations, selectedId, onSelect }) {
  if (!stations || stations.length === 0) {
    return (
      <div className="stations-loading-placeholder">
        <span className="loading-spinner" />
        <p>Loading weather stations…</p>
      </div>
    );
  }

  return (
    <div className="station-monitoring-section">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">Station Network</h2>
          <p className="section-subtitle">Real-time status of all weather stations in the network</p>
        </div>
      </div>

      <div className="station-cards-grid">
        {stations.map((s) => {
          const isSelected = s.id === selectedId;
          const isFault = s.status === "red";
          const temp = s.latest_reading?.temperature;
          const hum = s.latest_reading?.humidity;
          const pres = s.latest_reading?.pressure;
          const updated = formatTime(s.latest_reading?.timestamp);

          return (
            <div
              key={s.id}
              className={`station-monitor-card ${isFault ? "card-fault" : "card-ok"} ${isSelected ? "card-selected" : ""}`}
              onClick={() => onSelect(s.id)}
            >
              {/* Card Header */}
              <div className="card-top-bar">
                <div className="station-identity">
                  <div className="station-title-row">
                    <span className="station-name-text">{s.name}</span>
                    <span className="station-code-badge">{s.station_code}</span>
                  </div>
                  <span className="station-geo-tag">Haryana, India · [{s.latitude}°, {s.longitude}°]</span>
                </div>

                <div className={`status-pill-badge ${isFault ? "status-fault" : "status-ok"}`}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    {isFault ? (
                      <path d="M6 1L11 10H1L6 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
                    ) : (
                      <path d="M2.5 6.5L5 9L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    )}
                  </svg>
                  <span className="status-text">{isFault ? "Fault" : "Healthy"}</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="card-metrics-block">
                <div className="primary-metric">
                  <span className="metric-label">Temperature</span>
                  <div className="metric-display">
                    <span className="metric-val-hero numeric">
                      {temp != null ? temp.toFixed(1) : "—"}
                    </span>
                    <span className="metric-unit-hero">°C</span>
                  </div>
                </div>

                <div className="secondary-metrics-col">
                  <div className="secondary-metric-item">
                    <span className="sec-icon">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2C8 2 3 7.5 3 10.5a5 5 0 0010 0C13 7.5 8 2 8 2Z" stroke="#34d399" strokeWidth="1.3" fill="none"/></svg>
                    </span>
                    <div className="sec-content">
                      <span className="sec-label">Humidity</span>
                      <span className="sec-val numeric">{hum != null ? hum.toFixed(0) : "—"}%</span>
                    </div>
                  </div>

                  <div className="secondary-metric-item">
                    <span className="sec-icon">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="#38bdf8" strokeWidth="1.3" fill="none"/><path d="M8 4v4l2.5 1.5" stroke="#38bdf8" strokeWidth="1.3" strokeLinecap="round" fill="none"/></svg>
                    </span>
                    <div className="sec-content">
                      <span className="sec-label">Pressure</span>
                      <span className="sec-val numeric">{pres != null ? pres.toFixed(0) : "—"} hPa</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fault Banner */}
              {isFault && (
                <div className="card-fault-banner">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/></svg>
                  <span className="fault-message">Anomaly detected — reviewing telemetry</span>
                </div>
              )}

              {/* Footer */}
              <div className="card-footer-row">
                <span className="last-sync-text numeric">{updated}</span>
                <span className="inspect-action-text">
                  {isSelected ? "● Viewing" : "Inspect →"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}