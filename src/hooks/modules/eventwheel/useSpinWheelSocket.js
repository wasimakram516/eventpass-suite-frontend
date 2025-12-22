import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import useSocket from "@/utils/useSocket";

/**
 * Real-time socket hook for SpinWheel syncing.
 * Matches backend emitSpinWheelSync
 */
const useSpinWheelSocket = ({
  spinWheelId,
  onSyncProgress,
} = {}) => {

  // ---- callback ref ----
  const syncCbRef = useRef(onSyncProgress);
  useEffect(() => {
    syncCbRef.current = onSyncProgress;
  }, [onSyncProgress]);

  // ---- progress state ----
  const [syncProgress, setSyncProgress] = useState({
    synced: 0,
    total: 0,
  });

  // ---- socket handler ----
  const handleSyncEvent = useCallback(
    (data) => {
      if (data.spinWheelId !== spinWheelId) return;

      setSyncProgress({
        synced: data.synced ?? 0,
        total: data.total ?? 0,
      });

      if (syncCbRef.current) syncCbRef.current(data);
    },
    [spinWheelId]
  );

  // ---- event map (MATCH BACKEND) ----
  const events = useMemo(
    () => ({
      spinWheelSync: handleSyncEvent,
    }),
    [handleSyncEvent]
  );

  const { socket, connected, connectionError } = useSocket(events);

  return {
    socket,
    connected,
    connectionError,
    syncProgress,
  };
};

export default useSpinWheelSocket;
