/**
 * Run with: node --test src/utils/surveyNotificationSettings.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSurveyNotificationPayload,
  createSurveyNotificationSettings,
  validateSurveyNotificationSettings,
} from "./surveyNotificationSettings.js";

const savedForm = {
  defaultLanguage: "ar",
  useCustomEmailTemplate: true,
  emailTemplate: {
    subject: "Survey {Survey Link}",
    body: "<p>{Survey Button}</p>",
    usePlaceholders: true,
    selectedFields: ["Survey Button", "Survey Link"],
    accentColor: "#123456",
  },
  useCustomWhatsAppMessages: true,
  whatsappMessages: [
    {
      _id: "message-1",
      label: "Invitation",
      template: "template-1",
      variables: [
        { position: "1", source: "placeholder", value: "Survey Link", fallback: "" },
      ],
    },
  ],
};

const linkedEvent = {
  name: "Tech Summit",
  logoUrl: "https://cdn.example.com/logo.png",
  useCustomFields: true,
  formFields: [{ inputName: "Department" }],
};

test("createSurveyNotificationSettings restores saved email, WhatsApp, language, and event context", () => {
  const settings = createSurveyNotificationSettings(savedForm, linkedEvent);

  assert.equal(settings.useCustomEmailTemplate, true);
  assert.equal(settings.emailTemplateSubject, "Survey {Survey Link}");
  assert.equal(settings.emailTemplateBody, "<p>{Survey Button}</p>");
  assert.equal(settings.useCustomWhatsAppMessages, true);
  assert.equal(settings.whatsappMessages[0].variables[0].value, "Survey Link");
  assert.equal(settings.defaultLanguage, "ar");
  assert.equal(settings.name, "Tech Summit");
  assert.deepEqual(settings.formFields, [{ inputName: "Department" }]);
});

test("validateSurveyNotificationSettings requires both custom email fields", () => {
  const settings = createSurveyNotificationSettings(savedForm, linkedEvent);
  const catalog = { templatesById: new Map(), placeholders: [] };

  assert.equal(
    validateSurveyNotificationSettings({ ...settings, emailTemplateSubject: "" }, catalog, false),
    "Custom email subject and body are required.",
  );
  assert.equal(
    validateSurveyNotificationSettings({ ...settings, emailTemplateBody: "<p><br></p>" }, catalog, false),
    "Custom email subject and body are required.",
  );
});

test("disabled WhatsApp settings ignore incomplete draft messages", () => {
  const settings = {
    ...createSurveyNotificationSettings(savedForm, linkedEvent),
    useCustomWhatsAppMessages: false,
    whatsappMessages: [{ label: "", template: "", variables: [] }],
  };
  const catalog = {
    templatesById: new Map([["template-1", { _id: "template-1", variables: [] }]]),
    placeholders: [],
  };

  assert.equal(validateSurveyNotificationSettings(settings, catalog, false), null);
  const payload = buildSurveyNotificationPayload(settings, catalog);
  assert.equal(payload.useCustomWhatsAppMessages, false);
  assert.equal(Object.hasOwn(payload, "whatsappMessages"), false);
});

test("buildSurveyNotificationPayload includes both enabled template configurations", () => {
  const settings = createSurveyNotificationSettings(savedForm, linkedEvent);
  const catalog = {
    templatesById: new Map([
      ["template-1", { _id: "template-1", variables: ["1"] }],
    ]),
  };
  const payload = buildSurveyNotificationPayload(settings, catalog);

  assert.equal(payload.useCustomEmailTemplate, true);
  assert.equal(payload.emailTemplate.subject, "Survey {Survey Link}");
  assert.equal(payload.emailTemplate.body, "<p>{Survey Button}</p>");
  assert.equal(payload.useCustomWhatsAppMessages, true);
  assert.deepEqual(payload.whatsappMessages, [
    {
      _id: "message-1",
      label: "Invitation",
      template: "template-1",
      variables: [
        { position: "1", source: "placeholder", value: "Survey Link", fallback: "" },
      ],
    },
  ]);
});
