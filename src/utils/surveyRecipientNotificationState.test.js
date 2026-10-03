/**
 * Run with: node --test src/utils/surveyRecipientNotificationState.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { getSurveyRecipientNotificationState } from "./surveyRecipientNotificationState.js";

test("reads current email and WhatsApp delivery flags independently", () => {
  assert.deepEqual(
    getSurveyRecipientNotificationState({
      status: "notified",
      notificationSent: true,
      whatsappSent: true,
    }),
    { responded: false, emailSent: true, whatsappSent: true },
  );
});

test("recognizes existing WhatsApp-only records that remain queued", () => {
  assert.deepEqual(
    getSurveyRecipientNotificationState({ status: "queued", whatsappSent: true }),
    { responded: false, emailSent: false, whatsappSent: true },
  );
});

test("recognizes legacy email records from either emailSent or notified status", () => {
  assert.equal(getSurveyRecipientNotificationState({ emailSent: true }).emailSent, true);
  assert.equal(getSurveyRecipientNotificationState({ status: "notified" }).emailSent, true);
});

test("keeps channel history visible after a recipient responds", () => {
  assert.deepEqual(
    getSurveyRecipientNotificationState({
      status: "responded",
      respondedAt: "2026-10-01T09:00:00.000Z",
      notificationSent: true,
      whatsappSent: true,
    }),
    { responded: true, emailSent: true, whatsappSent: true },
  );
});
