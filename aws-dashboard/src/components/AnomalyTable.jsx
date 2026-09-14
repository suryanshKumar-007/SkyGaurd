function formatTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getRulePill(rule) {
  if (rule === "isolation_forest") {
    return <span className="rule-badge badge-ml">Isolation Forest (ML)</span>;
  }
  if (rule === "step_check") {
    return <span className="rule-badge badge-step">Step Check (Tier 1)</span>;
  }
  if (rule === "range_check") {
    return <span className="rule-badge badge-range">Range Check (Tier 1)</span>;
  }
  if (rule === "persistence_check") {
    return <span className="rule-badge badge-frozen">Frozen Sensor (Tier 1)</span>;
  }
  return <span className="rule-badge">{rule}</span>;
}

export default function AnomalyTable({ anomalies, stationName }) {
  const anomalyList = anomalies || [];
  const displayAnomalies = anomalyList.slice(0, 20);

  return (
    <div className="anomaly-history-panel">
      <div className="table-header-row">
        <div className="table-title-group">
          <div className="title-with-badge">
            <h3 className="table-title">Anomaly Log</h3>
            <span className="count-pill">
              {displayAnomalies.length} of {anomalyList.length}
            </span>
          </div>
          <p className="table-subtitle">
            Detection history for {stationName}
          </p>
        </div>
      </div>

      {displayAnomalies.length === 0 ? (
        <div className="table-empty-state">
          <span className="empty-icon text-ok">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <p>No anomalies detected for {stationName}. All readings nominal.</p>
        </div>
      ) : (
        <div className="table-responsive-container">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Sensor</th>
                <th>Type</th>
                <th>Value</th>
                <th>Verdict</th>
                <th>Confidence</th>
                <th>Severity</th>
                <th>Engine</th>
              </tr>
            </thead>
            <tbody>
              {displayAnomalies.map((a) => {
                const isML = a.rule_fired === "isolation_forest";
                const isHigh = a.severity === "high";

                return (
                  <tr key={a.id} className={isHigh ? "row-high-sev" : "row-med-sev"}>
                    <td className="numeric font-mono">{formatTime(a.timestamp)}</td>
                    <td className="sensor-cell">
                      <span className="sensor-cell-text">{a.sensor}</span>
                    </td>
                    <td>
                      <span className="type-tag">{a.anomaly_type}</span>
                    </td>
                    <td className="numeric val-cell">
                      {a.raw_value != null ? `${a.raw_value.toFixed(1)}°C` : "—"}
                    </td>
                    <td>
                      <span className="verdict-tag verdict-fault">{a.verdict}</span>
                    </td>
                    <td className="numeric">
                      <div className="confidence-meter-cell">
                        <span className="conf-percent">{(a.confidence * 100).toFixed(0)}%</span>
                        <div className="conf-track">
                          <div
                            className={`conf-bar ${isML ? "bar-ml" : isHigh ? "bar-high" : "bar-med"}`}
                            style={{ width: `${Math.min(100, a.confidence * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`sev-tag ${isHigh ? "tag-high" : "tag-med"}`}>
                        {a.severity?.charAt(0).toUpperCase() + a.severity?.slice(1)}
                      </span>
                    </td>
                    <td>{getRulePill(a.rule_fired)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
