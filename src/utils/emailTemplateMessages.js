/**
 * The "required" messages for a custom email template. One source shared by the
 * event setup toast and the inline errors in the Custom Email tab, so the wording
 * cannot drift between them.
 */
export const EMAIL_TEMPLATE_REQUIRED_MESSAGES = Object.freeze({
  en: Object.freeze({
    subject: "Email subject is required when using custom email template.",
    body: "Email body is required when using custom email template.",
  }),
  ar: Object.freeze({
    subject: "موضوع البريد الإلكتروني مطلوب عند استخدام قالب بريد إلكتروني مخصص.",
    body: "نص البريد الإلكتروني مطلوب عند استخدام قالب بريد إلكتروني مخصص.",
  }),
});
