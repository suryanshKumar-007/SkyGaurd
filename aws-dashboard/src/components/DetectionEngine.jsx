export default function DetectionEngine({ latestAnomaly }) {
  const ruleFired = latestAnomaly?.rule_fired;
  const isTier1 = ruleFired === "step_check" || ruleFired === "range_check" || ruleFired === "persistence_check";
  const isTier2 = ruleFired === "isolation_forest";

  return (
    <div className="detection-engine-card">
      <div className="engine-header">
        <div className="engine-title-group">
          <span className="engine-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="#c084fc" strokeWidth="1.5" fill="rgba(192,132,252,0.1)"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.4 1.4M11.55 11.55l1.4 1.4M3.05 12.95l1.4-1.4M11.55 4.45l1.4-1.4" stroke="#c084fc" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </span>
          <div>
            <h3 className="engine-title">Detection Engine</h3>
            <p className="engine-subtitle">Two-tier detection: Rule-based QC + Isolation Forest ML</p>
          </div>
        </div>
      </div>

      <div className="tiers-architecture-container">
        {/* Tier 1: Rule Engine */}
        <div className={`tier-box tier-rules ${isTier1 ? "tier-active" : ""}`}>
          <div className="tier-header">
            <span className="tier-badge">Tier 1</span>
            <h4 className="tier-name">Rule-Based Quality Control</h4>
            {isTier1 && <span className="active-tag">Triggered</span>}
          </div>
          <p className="tier-desc">Deterministic checks against meteorological bounds</p>
          <ul className="tier-checks-list">
            <li className={`check-item ${ruleFired === "range_check" ? "check-highlight" : ""}`}>
              <span className="check-bullet">›</span>
              <span><strong>Range Check</strong> · Temp [-10, 55°C], Hum [0, 100%]</span>
            </li>
            <li className={`check-item ${ruleFired === "step_check" ? "check-highlight" : ""}`}>
              <span className="check-bullet">›</span>
              <span><strong>Step / Spike</strong> · Temp step &gt; 5.0°C / interval</span>
            </li>
            <li className={`check-item ${ruleFired === "persistence_check" ? "check-highlight" : ""}`}>
              <span className="check-bullet">›</span>
              <span><strong>Frozen Sensor</strong> · 5 consecutive identical values</span>
            </li>
          </ul>
        </div>

        <div className="tier-connector-arrow">
          <span>↓</span>
          <span className="arrow-subtext">Passes Tier 1</span>
        </div>

        {/* Tier 2: Machine Learning */}
        <div className={`tier-box tier-ml ${isTier2 ? "tier-active" : ""}`}>
          <div className="tier-header">
            <span className="tier-badge badge-ml">Tier 2</span>
            <h4 className="tier-name">Isolation Forest (ML)</h4>
            {isTier2 && <span className="active-tag tag-ml">Triggered</span>}
          </div>
          <p className="tier-desc">Multivariate anomaly detection on joint sensor features</p>
          <ul className="tier-checks-list">
            <li className={`check-item ${isTier2 ? "check-highlight-ml" : ""}`}>
              <span className="check-bullet">›</span>
              <span><strong>Multivariate Outliers</strong> · Joint sensor degradation & drift</span>
            </li>
            <li className="check-item">
              <span className="check-bullet">›</span>
              <span><strong>Per-Station Cache</strong> · Retrained every 20 readings</span>
            </li>
            <li className="check-item">
              <span className="check-bullet">›</span>
              <span><strong>Confidence Score</strong> · Calibrated from decision boundary</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
