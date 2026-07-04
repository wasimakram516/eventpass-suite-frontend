"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSocket from "@/utils/useSocket";

const FLUSH_DELAY_MS = 200;

export default function usePaymentsSocket() {
  const [latestPayments, setLatestPayments] = useState([]);
  const [removedPayments, setRemovedPayments] = useState([]);
  const queueRef = useRef([]);
  const flushTimeoutRef = useRef(null);

  const flush = useCallback(() => {
    if (queueRef.current.length === 0) return;
    setLatestPayments([...queueRef.current]);
    queueRef.current = [];
  }, []);

  const events = useMemo(
    () => ({
      paymentUpdated: ({ payment }) => {
        if (!payment) return;
        queueRef.current = [payment, ...queueRef.current.filter((p) => p._id !== payment._id)];
        if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
        flushTimeoutRef.current = setTimeout(flush, FLUSH_DELAY_MS);
      },
      // A permanently removed payment (e.g. cancelled paid checkout). Also drop
      // any still-queued update for it so a pending card can't slip back in.
      paymentRemoved: ({ registrationId, paymentIds }) => {
        if (!registrationId && !(paymentIds?.length)) return;
        const ids = paymentIds || [];
        queueRef.current = queueRef.current.filter(
          (p) =>
            !ids.includes(p._id) &&
            (!registrationId || p.registrationId?.toString() !== registrationId.toString())
        );
        setRemovedPayments((prev) => [...prev, { registrationId, paymentIds: ids }]);
      },
    }),
    [flush]
  );

  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
    };
  }, []);

  const clearLatestPayments = useCallback(() => {
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }
    queueRef.current = [];
    setLatestPayments([]);
  }, []);

  const clearRemovedPayments = useCallback(() => setRemovedPayments([]), []);

  const { socket, connected, connectionError } = useSocket(events);

  return {
    socket,
    connected,
    connectionError,
    latestPayments,
    clearLatestPayments,
    removedPayments,
    clearRemovedPayments,
  };
}
