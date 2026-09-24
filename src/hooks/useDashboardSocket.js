import { useEffect, useMemo, useRef, useState } from "react";
import useSocket from "@/utils/useSocket";

/**
 * Hook for dashboard metrics updates via socket
 */
const useDashboardSocket = ({ onMetricsUpdate }) => {
  const [lastUpdate, setLastUpdate] = useState(null);
  const onMetricsUpdateRef = useRef(onMetricsUpdate);

  useEffect(() => {
    onMetricsUpdateRef.current = onMetricsUpdate;
  }, [onMetricsUpdate]);

  // A dashboard update re-renders the page. Keep this listener stable so a
  // render never creates a gap in which a live metrics update is missed.
  const events = useMemo(() => ({
    metricsUpdated: (metrics) => {
      console.log("📊 Received metricsUpdated:", metrics);
      setLastUpdate(new Date());
      onMetricsUpdateRef.current?.(metrics);
    },
    metricsError: (msg) => {
      console.error("❌ Metrics error:", msg);
    },
  }), []);

  const { socket, connected, connectionError } = useSocket(events);

  return {
    socket,
    connected,
    connectionError,
    lastUpdate,
  };
};

export default useDashboardSocket;
