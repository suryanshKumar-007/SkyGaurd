import { useState } from "react";
import { injectFault } from "../api";

export default function DemoControls({ stationId, stationName }) {
  const [loadingFault, setLoadingFault] = useState(null);
  const [feedback, setFeedback] = useState(null);

  async function handleTrigger(faultType, label) {
    if (!stationId || loadingFault) return;

    setLoadingFault(faultType);
    setFeedback(`Injecting ${label} into ${stationName}…`);

    try {
      const repeats = faultType === "spike" || faultType === "normal" ? 1 : 5;
      for (let i = 0; i < repeats; i++) {
        await injectFault(stationId, faultType);
        if (i < repeats - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
      setFeedback(`${label} injected successfully. Updating telemetry…`);
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      setFeedback(`Failed: ${err.message}`);
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setLoadingFault(null);
    }
  }

  return (
    <div className="simulation-controls-panel">
      <div className="sim-header">
        <div className="sim-title-group">
          <div className="title-with-pill">
            <h3 className="sim-title">Anomaly Simulation</h3>
            <span className="demo-mode-badge">Demo</span>
          </div>
          <p className="sim-subtitle">
            Inject synthetic faults to test detection in real-time
          </p>
        </div>
      </div>

      <div className="demo-warning-banner">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" fill="none"/><line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11.5" r="0.7" fill="currentColor"/></svg>
        <p className="warning-text">
          <strong>Demo mode:</strong> These controls inject synthetic sensor data to test Tier 1 rules and Tier 2 Isolation Forest detection.
        </p>
      </div>

      <div className="sim-actions-grid">
        {/* Inject Spike */}
        <button
          className="sim-btn btn-spike"
          disabled={loadingFault !== null}
          onClick={() => handleTrigger("spike", "Temperature Spike")}
        >
          <div className="btn-top">
            <span className="btn-icon">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><polyline points="2,12 6,4 8,10 10,2 14,12" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
            </span>
            <strong className="btn-name">Inject Spike</strong>
          </div>
          <p className="btn-desc">+20°C sudden surge · Triggers Tier 1 Step Check</p>
          {loadingFault === "spike" && <span className="btn-loading-bar" />}
        </button>

        {/* Frozen Sensor */}
        <button
          className="sim-btn btn-frozen"
          disabled={loadingFault !== null}
          onClick={() => handleTrigger("frozen", "Frozen Sensor")}
        >
          <div className="btn-top">
            <span className="btn-icon">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><line x1="8" y1="1" x2="8" y2="15" stroke="#38bdf8" strokeWidth="1.3"/><line x1="1" y1="8" x2="15" y2="8" stroke="#38bdf8" strokeWidth="1.3"/><line x1="3" y1="3" x2="13" y2="13" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2"/><line x1="13" y1="3" x2="3" y2="13" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2"/></svg>
            </span>
            <strong className="btn-name">Simulate Frozen</strong>
          </div>
          <p className="btn-desc">5 identical readings · Triggers Tier 1 Persistence</p>
          {loadingFault === "frozen" && <span className="btn-loading-bar" />}
        </button>

        {/* Drift */}
        <button
          className="sim-btn btn-drift"
          disabled={loadingFault !== null}
          onClick={() => handleTrigger("drift", "Sensor Drift (ML)")}
        >
          <div className="btn-top">
            <span className="btn-icon">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 12C4 10 6 8 8 7C10 6 12 5.5 14 4" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
            </span>
            <strong className="btn-name">Simulate Drift</strong>
          </div>
          <p className="btn-desc">5 subtle +3°C increments · Caught by Isolation Forest</p>
          {loadingFault === "drift" && <span className="btn-loading-bar" />}
        </button>

        {/* Restore Normal */}
        <button
          className="sim-btn btn-normal"
          disabled={loadingFault !== null}
          onClick={() => handleTrigger("normal", "Normal Telemetry")}
        >
          <div className="btn-top">
            <span className="btn-icon">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <strong className="btn-name">Restore Normal</strong>
          </div>
          <p className="btn-desc">Clean baseline (~28°C) · Returns station to green</p>
          {loadingFault === "normal" && <span className="btn-loading-bar" />}
        </button>
      </div>

      {feedback && (
        <div className="sim-feedback-toast">
          <span className="loading-spinner" style={{ width: 14, height: 14 }} />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}
