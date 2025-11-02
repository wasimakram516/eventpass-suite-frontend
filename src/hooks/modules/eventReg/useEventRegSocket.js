import { useState, useMemo, useCallback } from "react";
import useSocket from "@/utils/useSocket";

const useEventRegSocket = ({ eventId, onUploadProgress, onEmailProgress } = {}) => {
  const [uploadProgress, setUploadProgress] = useState({ uploaded: 0, total: 0 });
  const [emailProgress, setEmailProgress] = useState({ sent: 0, total: 0 });

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
    }),
    [handleUploadProgress, handleEmailProgress]
  );

  const { socket, connected, connectionError } = useSocket(events);

  return {
    socket,
    connected,
    connectionError,
    uploadProgress,
    emailProgress,
  };
};

export default useEventRegSocket;
