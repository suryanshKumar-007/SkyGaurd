import { useEffect, useRef, useState } from "react";

/**
 * Calls `fetchFn` immediately, then every `intervalMs`.
 * Re-polls automatically whenever `deps` change (e.g. selected station id).
 */
export function usePolling(fetchFn, deps = [], intervalMs = 3000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function tick() {
      try {
        const result = await fetchFnRef.current();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading };
}
