// Single place for every backend call. If your API URL/port ever changes,
// this is the only file you touch.
const BASE_URL = "http://127.0.0.1:8000";

async function handle(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getStations() {
  return handle(await fetch(`${BASE_URL}/stations`));
}

export async function getReadings(stationId, limit = 60) {
  return handle(await fetch(`${BASE_URL}/stations/${stationId}/readings?limit=${limit}`));
}

export async function getAnomalies(stationId) {
  return handle(await fetch(`${BASE_URL}/stations/${stationId}/anomalies`));
}

export async function getAlerts() {
  return handle(await fetch(`${BASE_URL}/alerts`));
}

export async function injectFault(stationId, faultType) {
  return handle(
    await fetch(`${BASE_URL}/simulate/inject?station_id=${stationId}&fault_type=${faultType}`, {
      method: "POST",
    })
  );
}
