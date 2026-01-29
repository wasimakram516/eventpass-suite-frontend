import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import useSocket from "@/utils/useSocket";

/**
 * Real-time socket hook for SpinWheel syncing and upload progress.
 * Matches backend emitSpinWheelSync and emitUploadProgress
 */
const useSpinWheelSocket = ({
  spinWheelId,
  onSyncProgress,
  onUploadProgress,
} = {}) => {

  // ---- callback refs ----
  const syncCbRef = useRef(onSyncProgress);
  const uploadCbRef = useRef(onUploadProgress);
  useEffect(() => {
    syncCbRef.current = onSyncProgress;
    uploadCbRef.current = onUploadProgress;
  }, [onSyncProgress, onUploadProgress]);

  // ---- progress state ----
  const [syncProgress, setSyncProgress] = useState({
    synced: 0,
    total: 0,
  });

  const [uploadProgress, setUploadProgress] = useState({
    uploaded: 0,
    total: 0,
  });

  // ---- socket handlers ----
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

  const handleUploadEvent = useCallback(
    (data) => {
      if (data.spinWheelId !== spinWheelId) return;

      setUploadProgress({
        uploaded: data.uploaded ?? 0,
        total: data.total ?? 0,
      });

      if (uploadCbRef.current) uploadCbRef.current(data);
    },
    [spinWheelId]
  );

  // ---- event map (MATCH BACKEND) ----
  const events = useMemo(
    () => ({
      spinWheelSync: handleSyncEvent,
      spinWheelUploadProgress: handleUploadEvent,
    }),
    [handleSyncEvent, handleUploadEvent]
  );

  const { socket, connected, connectionError } = useSocket(events);

  return {
    socket,
    connected,
    connectionError,
    syncProgress,
    uploadProgress,
  };
};

export default useSpinWheelSocket;
