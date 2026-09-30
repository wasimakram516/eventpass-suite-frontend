import assert from "node:assert/strict";
import test from "node:test";

import {
  REGISTRATION_RECIPIENT_FILTER_PAYLOADS,
  SURVEY_DEFAULT_RECIPIENT_FILTER,
  SURVEY_RECIPIENT_FILTER_PAYLOADS,
  getNotificationRecipientFilterPayload,
} from "./notificationRecipientFilters.js";

test("maps a registration dropdown selection to the existing filter contract", () => {
  assert.deepEqual(
    getNotificationRecipientFilterPayload("emailNotSent", REGISTRATION_RECIPIENT_FILTER_PAYLOADS),
    { statusFilter: "all", emailSentFilter: "notSent", whatsappSentFilter: "all" },
  );
});

test("maps a SurveyGuru dropdown selection to recipientScope", () => {
  assert.deepEqual(
    getNotificationRecipientFilterPayload(
      "never_whatsapp",
      SURVEY_RECIPIENT_FILTER_PAYLOADS,
      SURVEY_DEFAULT_RECIPIENT_FILTER,
    ),
    { recipientScope: "never_whatsapp" },
  );
});

test("falls back to the module default for an unknown selection", () => {
  assert.deepEqual(
    getNotificationRecipientFilterPayload(
      "unknown",
      SURVEY_RECIPIENT_FILTER_PAYLOADS,
      SURVEY_DEFAULT_RECIPIENT_FILTER,
    ),
    { recipientScope: "not_responded" },
  );
});
