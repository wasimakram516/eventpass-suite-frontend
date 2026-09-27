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
  onLoadingProgress,
} = {}) => {

  // ---- callback refs ----
  const syncCbRef = useRef(onSyncProgress);
  const uploadCbRef = useRef(onUploadProgress);
  const loadingCbRef = useRef(onLoadingProgress);
  useEffect(() => {
    syncCbRef.current = onSyncProgress;
    uploadCbRef.current = onUploadProgress;
    loadingCbRef.current = onLoadingProgress;
  }, [onSyncProgress, onUploadProgress, onLoadingProgress]);

  // ---- progress state ----
  const [syncProgress, setSyncProgress] = useState({
    synced: 0,
    total: 0,
  });

  const [uploadProgress, setUploadProgress] = useState({
    uploaded: 0,
    total: 0,
  });

  const [loadingProgress, setLoadingProgress] = useState({
    loaded: 0,
    total: 0,
    data: null,
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

  const handleLoadingEvent = useCallback(
    (data) => {
      if (data.spinWheelId !== spinWheelId) return;

      setLoadingProgress({
        loaded: data.loaded ?? 0,
        total: data.total ?? 0,
        data: data.data ?? null,
      });

      if (loadingCbRef.current) loadingCbRef.current(data);
    },
    [spinWheelId]
  );

  // ---- event map (MATCH BACKEND) ----
  const events = useMemo(
    () => ({
      spinWheelSync: handleSyncEvent,
      spinWheelUploadProgress: handleUploadEvent,
      spinWheelLoadingProgress: handleLoadingEvent,
    }),
    [handleSyncEvent, handleUploadEvent, handleLoadingEvent]
  );

  const { socket, connected, connectionError } = useSocket(events);

  return {
    socket,
    connected,
    connectionError,
    syncProgress,
    uploadProgress,
    loadingProgress,
  };
};

export default useSpinWheelSocket;
