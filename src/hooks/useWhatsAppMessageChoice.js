"use client";

import { useEffect, useState } from "react";
import {
  getEventWhatsAppMessages,
  previewEventWhatsAppMessage,
} from "@/services/notifications/whatsAppTemplateService";
import { moduleKeyForEventType, pickDefaultMessageId } from "@/utils/whatsappMessages";

/**
 * The WhatsApp message a send dialog will send: the event's messages (or the
 * platform defaults), the chosen one, and its rendered preview.
 *
 * @param {object} params
 * @param {object|null} params.event - Event with slug and eventType
 * @param {boolean} params.enabled - Load only while the dialog is open and WhatsApp can be sent
 * @param {string} [params.registrationId] - Preview for this registration instead of the first one
 * @returns {{messages: Array, messageId: string, setMessageId: Function, loading: boolean, preview: object|null, previewLoading: boolean}}
 */
export default function useWhatsAppMessageChoice({ event, enabled, registrationId }) {
  const moduleKey = moduleKeyForEventType(event?.eventType);
  const slug = event?.slug;
  const [messages, setMessages] = useState([]);
  const [messageId, setMessageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !moduleKey || !slug) return undefined;
    let cancelled = false;
    setLoading(true);
    getEventWhatsAppMessages(moduleKey, slug)
      .then((list) => {
        if (!cancelled) setMessages(Array.isArray(list) ? list : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, moduleKey, slug]);

  useEffect(() => {
    setMessageId(pickDefaultMessageId(messages));
  }, [messages]);

  useEffect(() => {
    if (!enabled || !messageId || !moduleKey || !slug) {
      setPreview(null);
      return undefined;
    }
    let cancelled = false;
    setPreviewLoading(true);
    previewEventWhatsAppMessage(moduleKey, slug, { messageId, registrationId })
      .then((result) => {
        if (!cancelled) setPreview(result?.error ? null : result);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, messageId, moduleKey, slug, registrationId]);

  return { messages, messageId, setMessageId, loading, preview, previewLoading };
}
