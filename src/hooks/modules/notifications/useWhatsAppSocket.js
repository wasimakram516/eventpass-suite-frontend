"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import useSocket from "@/utils/useSocket";

export default function useWhatsAppSocket({
  eventId,
  onInboundMessage,
  onStatusUpdate,
}) {
  const handlersRef = useRef({
    onInboundMessage,
    onStatusUpdate,
  });

  const [lastInbound, setLastInbound] = useState(null);
  const [lastStatus, setLastStatus] = useState(null);

  /* =========================
     KEEP HANDLERS STABLE
  ========================= */

  useEffect(() => {
    handlersRef.current = {
      onInboundMessage,
      onStatusUpdate,
    };
  }, [onInboundMessage, onStatusUpdate]);

  /* =========================
     SOCKET EVENT MAP
  ========================= */

  const events = useMemo(() => {
    const eventIdStr = eventId?.toString();

    return {
      /* =========================
         INBOUND MESSAGE
      ========================= */
      whatsappInboundMessage: (data) => {
        if (data.eventId?.toString() !== eventIdStr) return;

        setLastInbound(data);
        handlersRef.current.onInboundMessage?.(data);
      },

      /* =========================
         STATUS UPDATE
      ========================= */
      whatsappStatusUpdate: (data) => {
        if (data.eventId?.toString() !== eventIdStr) return;

        setLastStatus(data);
        handlersRef.current.onStatusUpdate?.(data);
      },
    };
  }, [eventId]);

  /* =========================
     CONNECT SOCKET
  ========================= */

  const { socket, connected, connectionError } = useSocket(events);

  return {
    socket,
    connected,
    connectionError,

    // optional reactive state
    lastInbound,
    lastStatus,
  };
}
