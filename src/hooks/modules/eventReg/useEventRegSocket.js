import { useRef, useEffect, useMemo, useState } from "react";
import useSocket from "@/utils/useSocket";

export default function useEventRegSocket({
  eventId,
  onLoadingProgress,
  onUploadProgress,
  onEmailProgress,
}) {
  const handlersRef = useRef({
    onLoadingProgress,
    onUploadProgress,
    onEmailProgress,
  });

  const [uploadProgress, setUploadProgress] = useState(null);
  const [emailProgress, setEmailProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(null);

  // keep handlers fresh without changing events reference
  useEffect(() => {
    handlersRef.current = {
      onLoadingProgress,
      onUploadProgress,
      onEmailProgress,
    };
  }, [onLoadingProgress, onUploadProgress, onEmailProgress]);

  // STABLE events (critical)
  const events = useMemo(
    () => ({
      registrationLoadingProgress: (data) => {
        if (data.eventId !== eventId) return;

        setLoadingProgress(data);  
        handlersRef.current.onLoadingProgress?.(data);
      },

      registrationUploadProgress: (data) => {
        if (data.eventId !== eventId) return;

        setUploadProgress(data);   
        handlersRef.current.onUploadProgress?.(data);
      },

      registrationEmailProgress: (data) => {
        if (data.eventId !== eventId) return;

        setEmailProgress(data);    
        handlersRef.current.onEmailProgress?.(data);
      },
    }),
    [eventId]
  );

  const { socket, connected, connectionError } = useSocket(events);

  return {
    socket,
    connected,
    connectionError,
    uploadProgress: uploadProgress || { uploaded: 0, total: 0 },
    emailProgress: emailProgress || { sent: 0, failed: 0, processed: 0, total: 0 },
    loadingProgress: loadingProgress || { loaded: 0, total: 0, data: null },
  };
}
