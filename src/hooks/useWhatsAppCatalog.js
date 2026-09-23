"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getWhatsAppPlaceholders,
  getWhatsAppTemplates,
} from "@/services/notifications/whatsAppTemplateService";

/**
 * Load the WhatsApp template library and the placeholders allowed for the
 * given event types, for the message editors.
 *
 * @param {string[]} eventTypes - e.g. ["closed"]
 * @param {boolean} [enabled] - Load only while true (e.g. while a modal is open)
 * @returns {{templates: Array, templatesById: Map<string, object>, placeholders: string[], loading: boolean, reload: () => void}}
 */
export default function useWhatsAppCatalog(eventTypes, enabled = true) {
  const [templates, setTemplates] = useState([]);
  const [placeholders, setPlaceholders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);
  const typesKey = [...eventTypes].sort().join(",");

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setLoading(true);
    Promise.all([getWhatsAppTemplates(), getWhatsAppPlaceholders(typesKey ? typesKey.split(",") : [])])
      .then(([templateList, placeholderList]) => {
        if (cancelled) return;
        setTemplates(Array.isArray(templateList) ? templateList : []);
        setPlaceholders(Array.isArray(placeholderList) ? placeholderList : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [typesKey, enabled, version]);

  const templatesById = useMemo(
    () => new Map(templates.map((template) => [String(template._id), template])),
    [templates]
  );

  return { templates, templatesById, placeholders, loading, reload: () => setVersion((v) => v + 1) };
}
