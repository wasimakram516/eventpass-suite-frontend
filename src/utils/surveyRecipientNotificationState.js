/**
 * Resolve response and per-channel delivery state for a SurveyGuru recipient.
 * The generic notified status is treated as legacy email delivery only when no
 * explicit channel flag exists.
 *
 * @param {object|null|undefined} recipient Survey recipient API record.
 * @returns {{responded: boolean, emailSent: boolean, whatsappSent: boolean}}
 */
export function getSurveyRecipientNotificationState(recipient) {
  const normalizedStatus = String(recipient?.status || "").toLowerCase();
  const whatsappSent = recipient?.whatsappSent === true;
  const explicitEmailSent = recipient?.notificationSent === true || recipient?.emailSent === true;
  const legacyEmailSent = normalizedStatus === "notified" && !whatsappSent && !explicitEmailSent;

  return {
    responded: normalizedStatus === "responded" || Boolean(recipient?.respondedAt),
    emailSent: explicitEmailSent || legacyEmailSent,
    whatsappSent,
  };
}
