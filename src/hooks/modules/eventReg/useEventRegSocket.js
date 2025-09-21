import { useState } from "react";
import useSocket from "@/utils/useSocket";

/**
 * Hook for listening to registration upload progress
 */
const useEventRegSocket = ({ eventId, onProgress }) => {
  const [progress, setProgress] = useState({ uploaded: 0, total: 0 });

  const { socket, connected, connectionError } = useSocket({
    registrationUploadProgress: (data) => {
      if (data.eventId === eventId) {
        setProgress({ uploaded: data.uploaded, total: data.total });
        if (onProgress) onProgress(data);
      }
    },
  });

  return {
    socket,
    connected,
    connectionError,
    progress,
  };
};

export default useEventRegSocket;
