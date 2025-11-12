import { useState, useMemo, useCallback } from "react";
import useSocket from "@/utils/useSocket";

/**
 * Real-time socket hook for SurveyGuru module.
 * Tracks progress of syncing recipients, sending survey emails, and any other async jobs.
 *
 * @param {object} options
 * @param {string} options.formId - The current Survey Form ID
 * @param {function} [options.onSyncProgress] - Callback for recipient sync progress
 * @param {function} [options.onEmailProgress] - Callback for email sending progress
 */
const useSurveyGuruSocket = ({
  formId,
  onSyncProgress,
  onEmailProgress,
} = {}) => {
  // Sync (import) progress
  const [syncProgress, setSyncProgress] = useState({ synced: 0, total: 0 });

  // Email sending progress
  const [emailProgress, setEmailProgress] = useState({ sent: 0, total: 0 });

  // ---- Recipient Sync Progress Handler ----
  const handleSyncProgress = useCallback(
    (data) => {
      if (data.formId === formId) {
        setSyncProgress({ synced: data.synced, total: data.total });
        if (onSyncProgress) onSyncProgress(data);
      }
    },
    [formId, onSyncProgress]
  );

  // ---- Email Progress Handler ----
  const handleEmailProgress = useCallback(
    (data) => {
      if (data.formId === formId) {
        setEmailProgress({ sent: data.sent, total: data.total });
        if (onEmailProgress) onEmailProgress(data);
      }
    },
    [formId, onEmailProgress]
  );

  // ---- Register socket events ----
  const events = useMemo(
    () => ({
      surveySyncProgress: handleSyncProgress, // optional if you emit during sync
      surveyEmailProgress: handleEmailProgress,
    }),
    [handleSyncProgress, handleEmailProgress]
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
