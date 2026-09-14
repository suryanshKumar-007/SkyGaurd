import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function TelemetryChart({ readings, anomalies, stationName, stationCode }) {
  const [showTemp, setShowTemp] = useState(true);
  const [showHum, setShowHum] = useState(true);
  const [showPres, setShowPres] = useState(true);

  const chartData = (readings || []).map((r) => ({
    time: formatTime(r.timestamp),
    timestamp: r.timestamp,
    temperature: r.temperature,
    pressure: r.pressure,
    humidity: r.humidity,
  }));

  // Find recent anomalies that match timestamps in chartData
  const anomalyPoints = (anomalies || []).slice(0, 5).map((a) => {
    const formatted = formatTime(a.timestamp);
    const reading = chartData.find((d) => d.time === formatted);
    if (!reading) return null;
    return {
      time: formatted,
      y: reading.temperature,
      label: a.anomaly_type,
    };
  }).filter(Boolean);

  return (
    <div className="telemetry-chart-card">
      <div className="chart-header-row">
        <div className="chart-title-group">
          <div className="title-with-icon">
            <span className="chart-icon">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><polyline points="2,12 5,7 8,9 11,4 14,6" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
            </span>
            <h3 className="chart-title">Live Telemetry</h3>
          </div>
          <p className="chart-subtitle">
            {stationName} ({stationCode}) · Temperature, Pressure & Humidity
          </p>
        </div>

        {/* Sensor Visibility Toggles */}
        <div className="sensor-toggles-bar">
          <button
            className={`sensor-toggle-btn toggle-temp ${showTemp ? "active" : "inactive"}`}
            onClick={() => setShowTemp(!showTemp)}
          >
            <span className="toggle-bullet bullet-temp" />
            <span>Temp (°C)</span>
          </button>

          <button
            className={`sensor-toggle-btn toggle-hum ${showHum ? "active" : "inactive"}`}
            onClick={() => setShowHum(!showHum)}
          >
            <span className="toggle-bullet bullet-hum" />
            <span>Humidity (%)</span>
          </button>

          <button
            className={`sensor-toggle-btn toggle-pres ${showPres ? "active" : "inactive"}`}
            onClick={() => setShowPres(!showPres)}
          >
            <span className="toggle-bullet bullet-pres" />
            <span>Pressure (hPa)</span>
          </button>
        </div>
      </div>

      <div className="chart-render-wrapper">
        {chartData.length === 0 ? (
          <div className="chart-loading-state">
            <span className="loading-spinner" />
            <p>Buffering telemetry…</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#333333"
                tick={{ fontSize: 11, fill: "#555555" }}
                minTickGap={30}
              />
              <YAxis
                stroke="#333333"
                tick={{ fontSize: 11, fill: "#555555" }}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161616",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "6px",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.5)",
                  color: "#e5e5e5",
                  fontSize: "12px",
                  fontFamily: "'Inter', sans-serif",
                }}
                formatter={(val, name) => [
                  `${typeof val === "number" ? val.toFixed(1) : val} ${
                    name === "temperature" ? "°C" : name === "humidity" ? "%" : "hPa"
                  }`,
                  name.charAt(0).toUpperCase() + name.slice(1),
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: 10, fontSize: "12px", fontFamily: "'Inter', sans-serif" }}
              />

              {showTemp && (
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature"
                  stroke="#fb923c"
                  dot={false}
                  strokeWidth={2.5}
                  activeDot={{ r: 5, fill: "#fb923c", stroke: "#fff", strokeWidth: 2 }}
                />
              )}

              {showHum && (
                <Line
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity"
                  stroke="#34d399"
                  dot={false}
                  strokeWidth={2}
                  activeDot={{ r: 5, fill: "#34d399", stroke: "#fff", strokeWidth: 2 }}
                />
              )}

              {showPres && (
                <Line
                  type="monotone"
                  dataKey="pressure"
                  name="Pressure"
                  stroke="#38bdf8"
                  dot={false}
                  strokeWidth={2}
                  activeDot={{ r: 5, fill: "#38bdf8", stroke: "#fff", strokeWidth: 2 }}
                />
              )}

              {/* Anomaly highlight dots */}
              {showTemp && anomalyPoints.map((pt, idx) => (
                <ReferenceDot
                  key={idx}
                  x={pt.time}
                  y={pt.y}
                  r={6}
                  fill="#f87171"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
