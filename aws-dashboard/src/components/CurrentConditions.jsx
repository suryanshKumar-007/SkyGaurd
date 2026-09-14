function formatTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const BASELINE_TEMP = 28.0;

export default function CurrentConditions({ latestReading, stationName, stationCode }) {
  if (!latestReading) {
    return (
      <div className="current-conditions-card">
        <div className="conditions-header">
          <h3>Current Conditions</h3>
        </div>
        <p className="muted">Awaiting sensor data…</p>
      </div>
    );
  }

  const { temperature, humidity, pressure, timestamp } = latestReading;
  const tempDelta = temperature != null ? (temperature - BASELINE_TEMP).toFixed(1) : null;
  const isDeltaPositive = tempDelta && parseFloat(tempDelta) > 0;
  const isElevated = Math.abs(parseFloat(tempDelta || 0)) > 6.0;

  return (
    <div className="current-conditions-card">
      <div className="conditions-header">
        <div className="cond-title-group">
          <span className="cond-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v10M4 11a4 4 0 108 0" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
          </span>
          <div>
            <h3 className="cond-title">Current Conditions</h3>
            <p className="cond-subtitle">{stationName} ({stationCode}) · Live Readings</p>
          </div>
        </div>
        <div className="cond-timestamp numeric">
          <span>Observed: {formatTime(timestamp)}</span>
        </div>
      </div>

      <div className="conditions-readings-grid">
        {/* Temperature */}
        <div className={`condition-item temp-condition ${isElevated ? "cond-alert" : ""}`}>
          <div className="cond-top">
            <span className="sensor-tag">Temperature</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="6" y="1" width="4" height="10" rx="2" stroke="#fb923c" strokeWidth="1.3" fill="none"/><circle cx="8" cy="12.5" r="2.5" stroke="#fb923c" strokeWidth="1.3" fill="rgba(251,146,60,0.2)"/></svg>
          </div>
          <div className="cond-val-hero">
            <span className="val-number numeric">{temperature != null ? temperature.toFixed(1) : "—"}</span>
            <span className="val-unit">°C</span>
          </div>
          <div className="cond-subtext">
            {tempDelta != null && (
              <span className={`delta-tag ${isElevated ? "delta-warn" : "delta-normal"} numeric`}>
                {isDeltaPositive ? `+${tempDelta}` : tempDelta}°C vs 28°C baseline
              </span>
            )}
          </div>
        </div>

        {/* Humidity */}
        <div className="condition-item humidity-condition">
          <div className="cond-top">
            <span className="sensor-tag">Humidity</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2C8 2 3 7.5 3 10.5a5 5 0 0010 0C13 7.5 8 2 8 2Z" stroke="#34d399" strokeWidth="1.3" fill="rgba(52,211,153,0.1)"/></svg>
          </div>
          <div className="cond-val-hero">
            <span className="val-number numeric">{humidity != null ? humidity.toFixed(1) : "—"}</span>
            <span className="val-unit">%</span>
          </div>
          <div className="cond-subtext">
            <span className="reading-status-note">
              {humidity > 80 ? "High saturation" : humidity < 30 ? "Dry conditions" : "Normal range"}
            </span>
          </div>
        </div>

        {/* Pressure */}
        <div className="condition-item pressure-condition">
          <div className="cond-top">
            <span className="sensor-tag">Pressure</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#38bdf8" strokeWidth="1.3" fill="none"/><path d="M8 4v4l3 2" stroke="#38bdf8" strokeWidth="1.3" strokeLinecap="round" fill="none"/></svg>
          </div>
          <div className="cond-val-hero">
            <span className="val-number numeric">{pressure != null ? pressure.toFixed(1) : "—"}</span>
            <span className="val-unit">hPa</span>
          </div>
          <div className="cond-subtext">
            <span className="reading-status-note">
              Standard altitude pressure
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
