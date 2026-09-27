"use client";

import { useCallback } from "react";
import { buildEmailSendFields } from "@/utils/notificationEmail";

/**
 * The handler both registrations pages use when the notification modal sends
 * email: close the modal, start the send, and report a failure. The modules
 * differ only in which service call they use and how they track "sending".
 *
 * @param {object} params
 * @param {(slug: string, fields: object, file?: File|null) => Promise<{error?: boolean, message?: string}>} params.sendEmails - The module's bulk email service call
 * @param {string} params.eventSlug - The event being notified about
 * @param {(sending: boolean) => void} params.setSending - Marks a send as running or finished
 * @param {() => void} params.closeModal - Closes the notification modal
 * @param {(message: string, severity: string) => void} params.showMessage - Shows a toast
 * @returns {(data: object) => Promise<void>} Handler for the modal's onSendEmail
 */
export default function useEmailNotificationSender({ sendEmails, eventSlug, setSending, closeModal, showMessage }) {
  return useCallback(
    async (data) => {
      setSending(true);
      closeModal();

      const result = await sendEmails(eventSlug, buildEmailSendFields(data), data.file);
      if (result?.error) {
        setSending(false);
        showMessage(result.message || "Failed to send notifications", "error");
      }
      // On success, progress arrives over the socket and finishes the job.
    },
    [sendEmails, eventSlug, setSending, closeModal, showMessage],
  );
}
