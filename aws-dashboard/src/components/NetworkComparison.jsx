function formatTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const HISTORICAL_BASELINE = {
  temperature: 28.0,
  pressure: 1008.0,
  humidity: 55.0,
};

export default function NetworkComparison({ selectedStation, allStations, latestAnomaly }) {
  if (!selectedStation || !allStations || allStations.length <= 1) {
    return null;
  }

  const nearbyStations = allStations.filter((s) => s.id !== selectedStation.id);

  const selReading = selectedStation.latest_reading || {};
  const selTemp = selReading.temperature;
  const selHum = selReading.humidity;
  const selPres = selReading.pressure;
  const isFault = selectedStation.status === "red";

  const validTemps = nearbyStations.map((s) => s.latest_reading?.temperature).filter((v) => v != null);
  const validHums = nearbyStations.map((s) => s.latest_reading?.humidity).filter((v) => v != null);
  const validPres = nearbyStations.map((s) => s.latest_reading?.pressure).filter((v) => v != null);

  const avgTemp = validTemps.length > 0 ? validTemps.reduce((a, b) => a + b, 0) / validTemps.length : null;
  const avgHum = validHums.length > 0 ? validHums.reduce((a, b) => a + b, 0) / validHums.length : null;
  const avgPres = validPres.length > 0 ? validPres.reduce((a, b) => a + b, 0) / validPres.length : null;

  const deltaTemp = selTemp != null && avgTemp != null ? selTemp - avgTemp : null;
  const deltaHum = selHum != null && avgHum != null ? selHum - avgHum : null;
  const deltaPres = selPres != null && avgPres != null ? selPres - avgPres : null;

  const isTempDeviated = deltaTemp != null && Math.abs(deltaTemp) >= 4.0;
  const isTempModerateDeviated = deltaTemp != null && Math.abs(deltaTemp) >= 2.0 && Math.abs(deltaTemp) < 4.0;

  const maxTempScale = 55.0;
  const getPercent = (val) => {
    if (val == null) return 0;
    return Math.min(100, Math.max(0, (val / maxTempScale) * 100));
  };

  return (
    <div className="network-comparison-panel">
      {/* Header */}
      <div className="net-comp-header">
        <div className="net-comp-title-group">
          <div className="title-with-badge">
            <span className="net-icon">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="2" stroke="#38bdf8" strokeWidth="1.3" fill="none"/><circle cx="3" cy="12" r="2" stroke="#38bdf8" strokeWidth="1.3" fill="none"/><circle cx="13" cy="12" r="2" stroke="#38bdf8" strokeWidth="1.3" fill="none"/><line x1="8" y1="5" x2="3" y2="10" stroke="#38bdf8" strokeWidth="1" opacity="0.6"/><line x1="8" y1="5" x2="13" y2="10" stroke="#38bdf8" strokeWidth="1" opacity="0.6"/></svg>
            </span>
            <h3 className="net-title">Network Context</h3>
            <span className="ref-only-badge">Reference Only</span>
          </div>
          <p className="net-subtitle">
            Compare {selectedStation.name} against nearby Haryana stations
          </p>
        </div>
        <div className="net-baseline-pill">
          <span className="base-label">Baseline:</span>
          <span className="base-val numeric">~{HISTORICAL_BASELINE.temperature}°C · {HISTORICAL_BASELINE.humidity}% · {HISTORICAL_BASELINE.pressure} hPa</span>
        </div>
      </div>

      {/* Cards: Selected vs Nearby */}
      <div className="net-comparison-grid">
        {/* Selected Station Card */}
        <div className={`comp-station-card selected-comp-card ${isFault ? "card-is-fault" : "card-is-ok"}`}>
          <div className="comp-card-badge">Monitored</div>
          <div className="comp-station-header">
            <div>
              <strong className="comp-name">{selectedStation.name}</strong>
              <span className="comp-code">({selectedStation.station_code})</span>
            </div>
            <span className={`comp-status-tag ${isFault ? "status-fault" : "status-ok"}`}>
              {isFault ? "Fault" : "Healthy"}
            </span>
          </div>

          <div className="comp-readings-list">
            <div className="comp-reading-row highlight-row">
              <span className="comp-r-label">Temperature:</span>
              <span className="comp-r-val numeric">{selTemp != null ? `${selTemp.toFixed(1)}°C` : "—"}</span>
            </div>
            <div className="comp-reading-row">
              <span className="comp-r-label">Humidity:</span>
              <span className="comp-r-val numeric">{selHum != null ? `${selHum.toFixed(0)}%` : "—"}</span>
            </div>
            <div className="comp-reading-row">
              <span className="comp-r-label">Pressure:</span>
              <span className="comp-r-val numeric">{selPres != null ? `${selPres.toFixed(0)} hPa` : "—"}</span>
            </div>
          </div>
          <div className="comp-card-footer">
            <span className="comp-time">{formatTime(selReading.timestamp)}</span>
          </div>
        </div>

        {/* Nearby Reference Stations */}
        <div className="nearby-references-group">
          <div className="nearby-cards-row">
            {nearbyStations.map((ns) => {
              const r = ns.latest_reading || {};
              const nsFault = ns.status === "red";
              return (
                <div key={ns.id} className="comp-station-card nearby-comp-card">
                  <div className="comp-card-badge badge-nearby">Nearby</div>
                  <div className="comp-station-header">
                    <div>
                      <strong className="comp-name">{ns.name}</strong>
                      <span className="comp-code">({ns.station_code})</span>
                    </div>
                    <span className={`comp-status-tag ${nsFault ? "status-fault" : "status-ok"}`}>
                      {nsFault ? "Fault" : "Normal"}
                    </span>
                  </div>

                  <div className="comp-readings-list">
                    <div className="comp-reading-row">
                      <span className="comp-r-label">Temp:</span>
                      <span className="comp-r-val numeric">{r.temperature != null ? `${r.temperature.toFixed(1)}°C` : "—"}</span>
                    </div>
                    <div className="comp-reading-row">
                      <span className="comp-r-label">Humidity:</span>
                      <span className="comp-r-val numeric">{r.humidity != null ? `${r.humidity.toFixed(0)}%` : "—"}</span>
                    </div>
                    <div className="comp-reading-row">
                      <span className="comp-r-label">Pressure:</span>
                      <span className="comp-r-val numeric">{r.pressure != null ? `${r.pressure.toFixed(0)} hPa` : "—"}</span>
                    </div>
                  </div>
                  <div className="comp-card-footer">
                    <span className="comp-time">{formatTime(r.timestamp)}</span>
                  </div>
                </div>
              );
            })}

            {/* Regional Average Card */}
            <div className="comp-station-card average-comp-card">
              <div className="comp-card-badge badge-avg">Average</div>
              <div className="comp-station-header">
                <div>
                  <strong className="comp-name">Nearby Mean</strong>
                  <span className="comp-code">({nearbyStations.length} stations)</span>
                </div>
                <span className="comp-status-tag status-ref">Reference</span>
              </div>

              <div className="comp-readings-list">
                <div className="comp-reading-row">
                  <span className="comp-r-label">Mean Temp:</span>
                  <span className="comp-r-val numeric text-info">{avgTemp != null ? `${avgTemp.toFixed(1)}°C` : "—"}</span>
                </div>
                <div className="comp-reading-row">
                  <span className="comp-r-label">Mean Humidity:</span>
                  <span className="comp-r-val numeric">{avgHum != null ? `${avgHum.toFixed(0)}%` : "—"}</span>
                </div>
                <div className="comp-reading-row">
                  <span className="comp-r-label">Mean Pressure:</span>
                  <span className="comp-r-val numeric">{avgPres != null ? `${avgPres.toFixed(0)} hPa` : "—"}</span>
                </div>
              </div>
              <div className="comp-card-footer">
                <span className="comp-time">Live calculated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Comparison */}
      <div className="visual-comparison-section">
        <div className="comparison-columns-grid">
          {/* Temperature Bars */}
          <div className="temp-comparison-box">
            <div className="box-header">
              <span className="box-title">Temperature Distribution</span>
              <span className="box-scale-hint">0°C — 55°C</span>
            </div>

            <div className="bars-container">
              <div className="bar-row selected-bar-row">
                <div className="bar-label-col">
                  <span className="bar-st-name">{selectedStation.name}</span>
                  <span className="bar-st-tag">(This)</span>
                </div>
                <div className="bar-track-col">
                  <div
                    className={`bar-fill ${isFault ? "bar-fill-fault" : "bar-fill-selected"}`}
                    style={{ width: `${getPercent(selTemp)}%` }}
                  />
                </div>
                <span className="bar-val-col numeric">{selTemp != null ? `${selTemp.toFixed(1)}°C` : "—"}</span>
              </div>

              {nearbyStations.map((ns) => {
                const t = ns.latest_reading?.temperature;
                return (
                  <div key={ns.id} className="bar-row">
                    <div className="bar-label-col">
                      <span className="bar-st-name">{ns.name}</span>
                      <span className="bar-st-tag">(Nearby)</span>
                    </div>
                    <div className="bar-track-col">
                      <div className="bar-fill bar-fill-nearby" style={{ width: `${getPercent(t)}%` }} />
                    </div>
                    <span className="bar-val-col numeric">{t != null ? `${t.toFixed(1)}°C` : "—"}</span>
                  </div>
                );
              })}

              <div className="bar-row average-bar-row">
                <div className="bar-label-col">
                  <span className="bar-st-name">Mean</span>
                  <span className="bar-st-tag">(Average)</span>
                </div>
                <div className="bar-track-col">
                  <div className="bar-fill bar-fill-avg" style={{ width: `${getPercent(avgTemp)}%` }} />
                </div>
                <span className="bar-val-col numeric">{avgTemp != null ? `${avgTemp.toFixed(1)}°C` : "—"}</span>
              </div>
            </div>
          </div>

          {/* Deviations */}
          <div className="deviations-summary-box">
            <div className="box-header">
              <span className="box-title">Network Variance</span>
            </div>

            <div className="deviations-pills-row">
              <div className="deviation-metric-card">
                <span className="dev-sensor">Temperature Δ</span>
                <span className={`dev-val numeric ${isTempDeviated ? "text-fault" : isTempModerateDeviated ? "text-warn" : "text-ok"}`}>
                  {deltaTemp != null ? `${deltaTemp > 0 ? `+${deltaTemp.toFixed(1)}` : deltaTemp.toFixed(1)}°C` : "—"}
                </span>
                <span className={`dev-status-pill ${isTempDeviated ? "pill-fault" : isTempModerateDeviated ? "pill-warn" : "pill-ok"}`}>
                  {isTempDeviated ? "Significant" : isTempModerateDeviated ? "Moderate" : "Normal"}
                </span>
              </div>

              <div className="deviation-metric-card">
                <span className="dev-sensor">Humidity Δ</span>
                <span className="dev-val numeric text-muted">
                  {deltaHum != null ? `${deltaHum > 0 ? `+${deltaHum.toFixed(0)}` : deltaHum.toFixed(0)}%` : "—"}
                </span>
                <span className="dev-status-pill pill-subtle">
                  {deltaHum != null && Math.abs(deltaHum) > 15 ? "Elevated" : "Nominal"}
                </span>
              </div>

              <div className="deviation-metric-card">
                <span className="dev-sensor">Pressure Δ</span>
                <span className="dev-val numeric text-muted">
                  {deltaPres != null ? `${deltaPres > 0 ? `+${deltaPres.toFixed(0)}` : deltaPres.toFixed(0)} hPa` : "—"}
                </span>
                <span className="dev-status-pill pill-subtle">Nominal</span>
              </div>
            </div>

            {/* Contextual Explanation */}
            <div className={`contextual-explanation-banner ${isFault ? "banner-fault" : "banner-ok"}`}>
              {isFault && latestAnomaly ? (
                <div className="explanation-content">
                  <div className="exp-top-row">
                    <span className="exp-icon">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/></svg>
                    </span>
                    <strong>{latestAnomaly.anomaly_type?.charAt(0).toUpperCase() + latestAnomaly.anomaly_type?.slice(1)} detected on {selectedStation.name}</strong>
                  </div>
                  <p className="exp-body">
                    {selectedStation.name} temperature of <strong>{selTemp?.toFixed(1)}°C</strong> diverges by{" "}
                    <strong>{deltaTemp != null ? (deltaTemp > 0 ? `+${deltaTemp.toFixed(1)}°C` : `${deltaTemp.toFixed(1)}°C`) : "—"}</strong> from the regional average ({avgTemp?.toFixed(1)}°C).
                  </p>
                  <div className="exp-footer">
                    <span>Detected by: <strong>{latestAnomaly.rule_fired === "isolation_forest" ? "Isolation Forest (Tier 2)" : `${latestAnomaly.rule_fired} (Tier 1)`}</strong> ({Math.round(latestAnomaly.confidence * 100)}% confidence)</span>
                    <span className="exp-disclaimer">
                      Regional values provide contextual corroboration for station-local detection.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="explanation-content">
                  <div className="exp-top-row">
                    <span className="exp-icon text-ok">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    <strong>Consistent with regional conditions</strong>
                  </div>
                  <p className="exp-body">
                    {selectedStation.name} telemetry aligns with neighboring observations (Δ {deltaTemp != null ? `${deltaTemp > 0 ? `+${deltaTemp.toFixed(1)}` : deltaTemp.toFixed(1)}°C` : "0.0°C"}). No spatial anomalies detected.
                  </p>
                  <span className="exp-disclaimer">
                    Reference context calculated dynamically against active stations.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
