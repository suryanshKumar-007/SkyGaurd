import { useEffect, useRef } from "react";
import L from "leaflet";

const HARYANA_CENTER = [29.15, 76.4];
const DEFAULT_ZOOM = 8;

export default function StationMap({ stations, selectedId, onSelect }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const referenceLayersRef = useRef([]);

  // Initialize Leaflet map instance once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: HARYANA_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      minZoom: 6,
      maxZoom: 14,
    });

    // Dark-styled OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync station markers with live stations data and selectedId
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !stations) return;

    stations.forEach((s) => {
      const isSelected = s.id === selectedId;
      const statusClass = s.status === "red" ? "status-red" : "status-green";
      const selectedClass = isSelected ? "is-selected" : "";

      const html = `
        <div class="custom-station-pin">
          <div class="pin-ring ${statusClass} ${selectedClass}">
            <div class="pin-core"></div>
          </div>
          <span class="pin-label">${s.name}</span>
        </div>
      `;

      const icon = L.divIcon({
        className: "station-map-div-icon",
        html: html,
        iconSize: [36, 48],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });

      const temp = s.latest_reading?.temperature != null ? `${s.latest_reading.temperature.toFixed(1)}°C` : "—";
      const hum = s.latest_reading?.humidity != null ? `${s.latest_reading.humidity.toFixed(0)}%` : "—";
      const pres = s.latest_reading?.pressure != null ? `${s.latest_reading.pressure.toFixed(0)} hPa` : "—";
      const statusLabel = s.status === "red" ? "Fault Detected" : "Operational";
      const statusBadgeClass = s.status === "red" ? "badge-fault" : "badge-ok";

      const popupContent = `
        <div class="map-popup-card">
          <div class="popup-header">
            <strong>${s.name}</strong>
            <span class="popup-code">(${s.station_code})</span>
          </div>
          <div class="popup-status ${statusBadgeClass}">${statusLabel}</div>
          <div class="popup-grid">
            <div class="popup-metric">
              <span class="p-label">Temp</span>
              <span class="p-val">${temp}</span>
            </div>
            <div class="popup-metric">
              <span class="p-label">Humidity</span>
              <span class="p-val">${hum}</span>
            </div>
            <div class="popup-metric">
              <span class="p-label">Pressure</span>
              <span class="p-val">${pres}</span>
            </div>
          </div>
          <button class="popup-btn" id="popup-btn-${s.id}">Inspect Station →</button>
        </div>
      `;

      if (markersRef.current[s.id]) {
        // Update existing marker
        const marker = markersRef.current[s.id];
        marker.setIcon(icon);
        marker.setPopupContent(popupContent);
      } else {
        // Create new marker
        const marker = L.marker([s.latitude, s.longitude], { icon })
          .addTo(map)
          .bindPopup(popupContent);

        marker.on("click", () => {
          onSelect(s.id);
        });

        markersRef.current[s.id] = marker;
      }
    });

    // Delegate click inside popup button to onSelect
    const container = mapContainerRef.current;
    const handlePopupClick = (e) => {
      const btn = e.target.closest(".popup-btn");
      if (btn && btn.id) {
        const id = parseInt(btn.id.replace("popup-btn-", ""), 10);
        if (!isNaN(id)) {
          onSelect(id);
          map.closePopup();
        }
      }
    };
    container.addEventListener("click", handlePopupClick);

    return () => {
      container.removeEventListener("click", handlePopupClick);
    };
  }, [stations, selectedId, onSelect]);

  // Draw regional network context connector lines & local reference radius
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !stations) return;

    // Clean up previous reference layers
    referenceLayersRef.current.forEach((layer) => layer.remove());
    referenceLayersRef.current = [];

    if (!selectedId) return;

    const selected = stations.find((s) => s.id === selectedId);
    if (!selected) return;

    // Subtle reference area halo around selected station (~45km)
    const halo = L.circle([selected.latitude, selected.longitude], {
      radius: 45000,
      color: "#0ea5e9",
      weight: 1.5,
      dashArray: "5, 7",
      fillColor: "#0ea5e9",
      fillOpacity: 0.04,
    }).addTo(map);
    referenceLayersRef.current.push(halo);

    // Subtle reference lines connecting selected station to nearby stations
    const nearby = stations.filter((s) => s.id !== selectedId);
    nearby.forEach((ns) => {
      const line = L.polyline(
        [
          [selected.latitude, selected.longitude],
          [ns.latitude, ns.longitude],
        ],
        {
          color: "#38bdf8",
          weight: 1.5,
          dashArray: "6, 8",
          opacity: 0.5,
        }
      ).addTo(map);
      referenceLayersRef.current.push(line);
    });
  }, [stations, selectedId]);

  // Center on selected station if selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedId || !stations) return;

    const selected = stations.find((s) => s.id === selectedId);
    if (selected && markersRef.current[selectedId]) {
      map.panTo([selected.latitude, selected.longitude], { animate: true, duration: 0.6 });
    }
  }, [selectedId, stations]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(HARYANA_CENTER, DEFAULT_ZOOM, { animate: true });
    }
  };

  return (
    <div className="station-map-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">AWS Network Map</h2>
          <p className="panel-subtitle">Station locations and health status across Haryana</p>
        </div>
        <div className="map-toolbar">
          <button className="btn-map-control" onClick={handleResetView} title="Reset to Haryana view">
            ↻ Reset View
          </button>
        </div>
      </div>

      <div className="map-wrapper">
        <div ref={mapContainerRef} className="leaflet-map-element" style={{ height: "380px", width: "100%" }} />
      </div>

      <div className="map-legend-bar">
        <div className="legend-item">
          <span className="legend-dot status-green" />
          <span>Operational</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot status-red" />
          <span>Fault Detected</span>
        </div>
        <div className="legend-item">
          <span className="legend-ring is-selected" />
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <span className="legend-line-dashed" />
          <span>Reference Link</span>
        </div>
      </div>
    </div>
  );
}
