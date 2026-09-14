import { useEffect, useState } from "react";

export default function Header({ stations, error, lastSync }) {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalStations = stations ? stations.length : 0;
  const isOnline = !error && stations !== null;

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand-icon-wrapper" title="SkyGuard — Weather Station Monitoring">
          <svg
            className="brand-svg-logo"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Shield Outline */}
            <path
              d="M16 3L5 7.5V15.2C5 22.3 9.7 28.9 16 30.5C22.3 28.9 27 22.3 27 15.2V7.5L16 3Z"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinejoin="round"
              fill="rgba(14, 165, 233, 0.1)"
            />
            {/* Radar Arc */}
            <path
              d="M11 14C12.3 12.2 14.1 11.2 16 11.2C17.9 11.2 19.7 12.2 21 14"
              stroke="#0ea5e9"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M13 17C13.8 15.8 14.9 15.2 16 15.2C17.1 15.2 18.2 15.8 19 17"
              stroke="#38bdf8"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Core Pulse */}
            <circle cx="16" cy="20" r="2.2" fill="#34d399" />
          </svg>
          <span className="brand-pulse-dot" />
        </div>

        <div className="brand-text">
          <div className="brand-title-row">
            <h1 className="brand-title">SkyGuard</h1>
            <span className="brand-badge">AI + ML</span>
          </div>
          <p className="brand-subtitle">
            Real-Time AWS Anomaly Detection · Haryana Network
          </p>
        </div>
      </div>

      <div className="header-right">
        <div className="system-pill data-source-pill">
          <span className="pill-dot source-dot" />
          <span className="pill-label">Data:</span>
          <span className="pill-value">Synthetic / Demo</span>
        </div>

        <div className="system-pill fleet-pill">
          <span className="pill-value">{totalStations} Stations</span>
        </div>

        <div className={`system-pill status-pill ${isOnline ? "status-online" : "status-offline"}`}>
          <span className="status-indicator-dot" />
          <span className="pill-value">{isOnline ? "Online" : "Offline"}</span>
        </div>

        <div className="clock-pill">
          <span className="clock-time numeric">{currentTime}</span>
          {lastSync && (
            <span className="clock-sync">Sync: {lastSync}</span>
          )}
        </div>
      </div>
    </header>
  );
}
