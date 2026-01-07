"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import useSocket from "@/utils/useSocket";

export default function useWhatsAppSocket({
  eventId,
  onInboundMessage,
  onStatusUpdate,
  onOutboundMessage,
}) {
  const handlersRef = useRef({
    onInboundMessage,
    onStatusUpdate,
    onOutboundMessage,
  });

  const [lastInbound, setLastInbound] = useState(null);
  const [lastStatus, setLastStatus] = useState(null);
  const [lastOutBound, setLastOutBound] = useState(null);

  /* =========================
     KEEP HANDLERS STABLE
  ========================= */

  useEffect(() => {
    handlersRef.current = {
      onInboundMessage,
      onStatusUpdate,
      onOutboundMessage,
    };
  }, [onInboundMessage, onStatusUpdate, onOutboundMessage]);

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

      /* =========================
          OUTBOUND MESSAGE
          ========================= */

      whatsappOutboundMessage: (data) => {
        if (data.eventId?.toString() !== eventIdStr) return;
        handlersRef.current.onOutboundMessage?.(data);
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
    lastOutBound
  };
}
