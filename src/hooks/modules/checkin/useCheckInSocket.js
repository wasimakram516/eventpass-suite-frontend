"use client";
import { useRef, useEffect, useMemo, useState } from "react";
import useSocket from "@/utils/useSocket";

export default function useCheckInSocket({
  eventId,
  onLoadingProgress,
  onUploadProgress,
  onEmailProgress,
  onNewRegistration,
  onPresenceConfirmed,
}) {
  const handlersRef = useRef({
    onLoadingProgress,
    onUploadProgress,
    onEmailProgress,
    onNewRegistration,
    onPresenceConfirmed,
  });

  const [uploadProgress, setUploadProgress] = useState(null);
  const [emailProgress, setEmailProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(null);

  useEffect(() => {
    handlersRef.current = {
      onLoadingProgress,
      onUploadProgress,
      onEmailProgress,
      onNewRegistration,
      onPresenceConfirmed,
    };
  }, [onLoadingProgress, onUploadProgress, onEmailProgress, onNewRegistration, onPresenceConfirmed]);

  const events = useMemo(() => {
    const eventIdStr = eventId?.toString();

    return {
      checkinRegistrationLoadingProgress: (data) => {
        if (data.eventId?.toString() !== eventIdStr) return;
        setLoadingProgress(data);
        handlersRef.current.onLoadingProgress?.(data);
      },

      checkinRegistrationUploadProgress: (data) => {
        if (data.eventId?.toString() !== eventIdStr) return;
        setUploadProgress(data);
        handlersRef.current.onUploadProgress?.(data);
      },

      checkinRegistrationEmailProgress: (data) => {
        if (data.eventId?.toString() !== eventIdStr) return;
        setEmailProgress(data);
        handlersRef.current.onEmailProgress?.(data);
      },

      checkinRegistrationNew: (data) => {
        if (data.eventId?.toString() !== eventIdStr) return;
        handlersRef.current.onNewRegistration?.(data);
      },

      checkinRegistrationPresenceConfirmed: (data) => {
        if (data.eventId?.toString() !== eventIdStr) return;
        handlersRef.current.onPresenceConfirmed?.(data);
      },
    };
  }, [eventId]);

  const { socket, connected, connectionError } = useSocket(events);

  return {
    socket,
    connected,
    connectionError,
    uploadProgress: uploadProgress || { uploaded: 0, total: 0 },
    emailProgress: emailProgress || {
      sent: 0,
      failed: 0,
      processed: 0,
      total: 0,
    },
    loadingProgress: loadingProgress || { loaded: 0, total: 0, data: null },
  };
}

