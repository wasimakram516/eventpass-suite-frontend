"use client";

import { useCallback, useEffect, useState } from "react";
import { buildEmailTemplatePayload } from "@/utils/emailTemplatePlaceholders";
import { buildCustomTemplateForm, validateCustomTemplateForm } from "@/utils/notificationEmail";

const NO_ERRORS = Object.freeze({ subject: false, body: false });

/**
 * State for composing a one off custom email in a notification modal. It starts
 * from the event's own template and restarts each time the modal opens, so edits
 * made for one send never leak into the next. Nothing here is saved to the event.
 *
 * @param {object|null|undefined} event - The event the notification is for
 * @param {boolean} open - Whether the modal is open
 * @returns {{form: object, setForm: Function, errors: {subject: boolean, body: boolean},
 *   clearError: (field: "subject"|"body") => void, validate: () => boolean,
 *   buildTemplate: () => object}}
 */
export default function useCustomEmailComposer(event, open) {
  const [form, setForm] = useState(() => buildCustomTemplateForm(event));
  const [errors, setErrors] = useState(NO_ERRORS);

  useEffect(() => {
    if (open) {
      setForm(buildCustomTemplateForm(event));
      setErrors(NO_ERRORS);
    }
    // Restart when the modal opens or a different event is loaded, not on every event refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event?._id]);

  const clearError = useCallback((field) => {
    setErrors((previous) => ({ ...previous, [field]: false }));
  }, []);

  const validate = useCallback(() => {
    const found = validateCustomTemplateForm(form);
    setErrors(found);
    return !found.subject && !found.body;
  }, [form]);

  const buildTemplate = useCallback(() => buildEmailTemplatePayload(form), [form]);

  return { form, setForm, errors, clearError, validate, buildTemplate };
}
