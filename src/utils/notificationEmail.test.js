/**
 * Run with: node --test src/utils/notificationEmail.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomTemplateForm,
  buildEmailSendFields,
  hasEventEmailTemplate,
  isCheckInEvent,
  isEventPaid,
  validateCustomTemplateForm,
} from "./notificationEmail.js";

const placeholderEvent = {
  name: "Tech Summit",
  logoUrl: "https://cdn.example.com/logo.png",
  defaultLanguage: "ar",
  useCustomFields: true,
  formFields: [{ inputName: "Company" }],
  useCustomEmailTemplate: true,
  emailTemplate: {
    subject: "Hi {Company}",
    body: "<p>{QR}</p>",
    usePlaceholders: true,
    header: "<p>{Logo}</p>",
    accentColor: "#112233",
    qrSize: 220,
    logoSize: 90,
    selectedFields: ["QR"],
  },
};

test("hasEventEmailTemplate needs the checkbox plus a subject and a body", () => {
  assert.equal(hasEventEmailTemplate(placeholderEvent), true);
  assert.equal(hasEventEmailTemplate({ ...placeholderEvent, useCustomEmailTemplate: false }), false);
  assert.equal(hasEventEmailTemplate({ ...placeholderEvent, emailTemplate: { subject: "S" } }), false);
  assert.equal(hasEventEmailTemplate(null), false);
});

test("isEventPaid is true for paid and Checkout events only", () => {
  assert.equal(isEventPaid({ isPaid: true }), true);
  assert.equal(isEventPaid({ eventType: "checkout" }), true);
  assert.equal(isEventPaid({ eventType: "public" }), false);
  assert.equal(isEventPaid(undefined), false);
});

test("buildCustomTemplateForm pre-fills every setting from the event's placeholder template", () => {
  const form = buildCustomTemplateForm(placeholderEvent);
  assert.equal(form.emailTemplateSubject, "Hi {Company}");
  assert.equal(form.emailTemplateBody, "<p>{QR}</p>");
  assert.equal(form.emailTemplateHeader, "<p>{Logo}</p>");
  assert.equal(form.emailTemplateAccentColor, "#112233");
  assert.equal(form.emailTemplateQrSize, 220);
  assert.equal(form.emailTemplateLogoSize, 90);
  assert.equal(form.emailTemplateUsePlaceholders, true);
});

test("buildCustomTemplateForm carries the event context the tab and preview need", () => {
  const form = buildCustomTemplateForm(placeholderEvent);
  assert.equal(form.name, "Tech Summit");
  assert.equal(form.logoPreview, "https://cdn.example.com/logo.png");
  assert.equal(form.defaultLanguage, "ar");
  assert.equal(form.useCustomFields, true);
  assert.deepEqual(form.formFields, [{ inputName: "Company" }]);
});

test("buildCustomTemplateForm does not copy a template saved in the older layout", () => {
  const legacy = { ...placeholderEvent, emailTemplate: { subject: "Old", body: "<p>Old</p>" } };
  const form = buildCustomTemplateForm(legacy);
  assert.equal(form.emailTemplateSubject, "");
  assert.equal(form.emailTemplateBody, "");
  assert.equal(form.emailTemplateUsePlaceholders, true);
});

test("buildCustomTemplateForm starts blank for an event with no template, and copes with no event", () => {
  const blank = buildCustomTemplateForm({ name: "E" });
  assert.equal(blank.emailTemplateSubject, "");
  assert.equal(blank.useCustomFields, false);
  const none = buildCustomTemplateForm(null);
  assert.equal(none.name, "");
  assert.equal(none.defaultLanguage, "en");
  assert.deepEqual(none.formFields, []);
});

test("validateCustomTemplateForm flags a missing subject and a blank body", () => {
  assert.deepEqual(validateCustomTemplateForm({ emailTemplateSubject: "  ", emailTemplateBody: "<p><br></p>" }), {
    subject: true,
    body: true,
  });
  assert.deepEqual(validateCustomTemplateForm({ emailTemplateSubject: "S", emailTemplateBody: "<p>Hi</p>" }), {
    subject: false,
    body: false,
  });
});

test("buildEmailSendFields: a default send carries only the filters", () => {
  assert.deepEqual(buildEmailSendFields({ type: "default" }), {
    statusFilter: "all",
    emailSentFilter: "all",
    whatsappSentFilter: "all",
  });
});

test("buildEmailSendFields: a custom send adds the one off template as JSON", () => {
  const template = { subject: "S", body: "<p>B</p>", usePlaceholders: true };
  const fields = buildEmailSendFields({ type: "custom", customTemplate: template, statusFilter: "approved" });
  assert.equal(fields.statusFilter, "approved");
  assert.deepEqual(JSON.parse(fields.customTemplate), template);
});

test("buildEmailSendFields: a custom type without a template sends nothing custom", () => {
  assert.equal("customTemplate" in buildEmailSendFields({ type: "custom" }), false);
});

test("isCheckInEvent is true only for closed (CheckIn) events", () => {
  assert.equal(isCheckInEvent({ eventType: "closed" }), true);
  assert.equal(isCheckInEvent({ eventType: "public" }), false);
  assert.equal(isCheckInEvent(null), false);
});
