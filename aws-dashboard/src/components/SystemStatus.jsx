export default function SystemStatus({ isOnline }) {
  return (
    <footer className="system-status-bar">
      <div className="status-item">
        <span className="status-tag-label">Backend:</span>
        <span className={`status-tag-val ${isOnline ? "text-ok" : "text-fault"}`}>
          {isOnline ? "● Connected (127.0.0.1:8000)" : "● Disconnected"}
        </span>
      </div>

      <div className="status-item">
        <span className="status-tag-label">Database:</span>
        <span className="status-tag-val text-ok">● SQLite (aws.db)</span>
      </div>

      <div className="status-item">
        <span className="status-tag-label">ML Engine:</span>
        <span className="status-tag-val text-ml">Isolation Forest · Per-Station</span>
      </div>

      <div className="status-item">
        <span className="status-tag-label">Data Stream:</span>
        <span className="status-tag-val text-info">Synthetic · 3s Poll</span>
      </div>

      <div className="status-item">
        <span className="status-tag-label">Project:</span>
        <span className="status-tag-val text-muted">Weather Station Monitoring · MoES/IMD (PS 26073)</span>
      </div>
    </footer>
  );
}
