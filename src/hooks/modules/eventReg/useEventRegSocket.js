import { useState, useMemo, useCallback } from "react";
import useSocket from "@/utils/useSocket";

const useEventRegSocket = ({ eventId, onUploadProgress, onEmailProgress, onLoadingProgress } = {}) => {
  const [uploadProgress, setUploadProgress] = useState({ uploaded: 0, total: 0 });
  const [emailProgress, setEmailProgress] = useState({ sent: 0, total: 0 });
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });

  // ---- Loading Progress Handler ----
  const handleLoadingProgress = useCallback(
    (data) => {
      if (data.eventId === eventId) {
        setLoadingProgress({ loaded: data.loaded, total: data.total });
        if (onLoadingProgress) onLoadingProgress(data);
      }
    },
    [eventId, onLoadingProgress]
  );

  // ---- Upload Progress Handler ----
  const handleUploadProgress = useCallback(
    (data) => {
      if (data.eventId === eventId) {
        setUploadProgress({ uploaded: data.uploaded, total: data.total });
        if (onUploadProgress) onUploadProgress(data);
      }
    },
    [eventId, onUploadProgress]
  );

  // ---- Email Progress Handler ----
  const handleEmailProgress = useCallback(
    (data) => {
      if (data.eventId === eventId) {
        setEmailProgress({ sent: data.sent, total: data.total });
        if (onEmailProgress) onEmailProgress(data);
      }
    },
    [eventId, onEmailProgress]
  );

  // ---- Register socket events ----
  const events = useMemo(
    () => ({
      registrationUploadProgress: handleUploadProgress,
      registrationEmailProgress: handleEmailProgress,
      registrationLoadingProgress: handleLoadingProgress,
    }),
    [handleUploadProgress, handleEmailProgress, handleLoadingProgress]
  );

  const { socket, connected, connectionError } = useSocket(events);

  return {
    socket,
    connected,
    connectionError,
    uploadProgress,
    emailProgress,
    loadingProgress,
  };
};

export default useEventRegSocket;
