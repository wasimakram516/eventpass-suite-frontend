import { useRef, useEffect, useMemo, useState } from "react";
import useSocket from "@/utils/useSocket";

export default function useEventRegSocket({
  eventId,
  onLoadingProgress,
  onUploadProgress,
  onEmailProgress,
  onNewRegistration,
}) {
  const handlersRef = useRef({
    onLoadingProgress,
    onUploadProgress,
    onEmailProgress,
    onNewRegistration,
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
      onNewRegistration,
    };
  }, [onLoadingProgress, onUploadProgress, onEmailProgress, onNewRegistration]);

  // STABLE events (critical)
  const events = useMemo(
    () => {
      const eventIdStr = eventId?.toString();

      return {
        registrationLoadingProgress: (data) => {
          if (data.eventId?.toString() !== eventIdStr) return;

          setLoadingProgress(data);
          handlersRef.current.onLoadingProgress?.(data);
        },

        registrationUploadProgress: (data) => {
          if (data.eventId?.toString() !== eventIdStr) return;

          setUploadProgress(data);
          handlersRef.current.onUploadProgress?.(data);
        },

        registrationEmailProgress: (data) => {
          if (data.eventId?.toString() !== eventIdStr) return;

          setEmailProgress(data);
          handlersRef.current.onEmailProgress?.(data);
        },

        registrationNew: (data) => {
          if (data.eventId?.toString() !== eventIdStr) return;

          handlersRef.current.onNewRegistration?.(data);
        },
      };
    },
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
