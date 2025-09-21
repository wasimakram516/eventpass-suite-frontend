import { useState, useMemo, useCallback } from "react";
import useSocket from "@/utils/useSocket";

const useEventRegSocket = ({ eventId, onProgress }) => {
  const [progress, setProgress] = useState({ uploaded: 0, total: 0 });

  // stable handler
  const handleProgress = useCallback(
    (data) => {
      if (data.eventId === eventId) {
        setProgress({ uploaded: data.uploaded, total: data.total });
        if (onProgress) onProgress(data);
      }
    },
    [eventId, onProgress]
  );

  // stable events object
  const events = useMemo(
    () => ({ registrationUploadProgress: handleProgress }),
    [handleProgress]
  );

  const { socket, connected, connectionError } = useSocket(events);

  return {
    socket,
    connected,
    connectionError,
    progress,
  };
};

export default useEventRegSocket;
