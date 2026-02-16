import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import useSocket from "@/utils/useSocket";

/**
 * Real-time socket hook for SurveyGuru module.
 * Tracks progress of syncing recipients, sending survey emails, and any async jobs.
 */
const useSurveyGuruSocket = ({
  formId,
  onSyncProgress,
  onEmailProgress,
} = {}) => {

  // ---- callback refs (prevent re-renders and loops) ----
  const syncCbRef = useRef(onSyncProgress);
  const emailCbRef = useRef(onEmailProgress);

  useEffect(() => { syncCbRef.current = onSyncProgress }, [onSyncProgress]);
  useEffect(() => { emailCbRef.current = onEmailProgress }, [onEmailProgress]);

  // ---- socket progress states ----
  const [syncProgress, setSyncProgress] = useState({
    synced: 0,
    total: 0,
  });

  const [emailProgress, setEmailProgress] = useState({
    sent: 0,
    failed: 0,
    processed: 0,
    total: 0,
  });

  // ---- Sync Progress Handler (stable, guarded) ----
  const handleSyncEvent = useCallback((data) => {
    if (String(data?.formId) !== String(formId)) return;

    setSyncProgress({
      synced: data.synced,
      total: data.total,
    });

    if (syncCbRef.current) syncCbRef.current(data);

  }, [formId]);

  // ---- Email Progress Handler (stable, guarded) ----
  const handleEmailEvent = useCallback((data) => {
    if (String(data?.formId) !== String(formId)) return;

    setEmailProgress({
      sent: data.sent,
      failed: data.failed,
      processed: data.processed,
      total: data.total,
    });

    if (emailCbRef.current) emailCbRef.current(data);

  }, [formId]);

  // ---- Stable event map ----
  const events = useMemo(
    () => ({
      surveySyncProgress: handleSyncEvent,
      surveyEmailProgress: handleEmailEvent,
    }),
    [handleSyncEvent, handleEmailEvent]
  );

  const { socket, connected, connectionError } = useSocket(events);

  return {
    socket,
    connected,
    connectionError,
    syncProgress,
    emailProgress,
  };
};

export default useSurveyGuruSocket;
