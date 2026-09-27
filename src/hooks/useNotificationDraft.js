"use client";

import { useCallback, useEffect, useState } from "react";
import useCustomEmailComposer from "@/hooks/useCustomEmailComposer";

/**
 * The state every notification modal keeps while it is open: the chosen message
 * type, the attached file, and the custom email being composed. Everything
 * returns to its starting point when the modal closes.
 *
 * @param {object|null|undefined} event - The event the notification is for
 * @param {boolean} open - Whether the modal is open
 * @returns {{notificationType: string, setNotificationType: Function, attachedFile: File|null,
 *   setAttachedFile: Function, composer: object, reset: () => void}}
 */
export default function useNotificationDraft(event, open) {
  const [notificationType, setNotificationType] = useState("default");
  const [attachedFile, setAttachedFile] = useState(null);
  const composer = useCustomEmailComposer(event, open);

  const reset = useCallback(() => {
    setNotificationType("default");
    setAttachedFile(null);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  return { notificationType, setNotificationType, attachedFile, setAttachedFile, composer, reset };
}
