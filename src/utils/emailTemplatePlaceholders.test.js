/**
 * Run with: node --test src/utils/emailTemplatePlaceholders.test.js
 * (Node's built in test runner, no extra dependencies.)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMAIL_TEMPLATE_WARNINGS,
  EMPTY_EMAIL_TEMPLATE_SETTINGS,
  getEmailTemplateSettings,
  buildEmailTemplatePayload,
  normalizePlaceholderKey,
  toPlaceholder,
  isRichTextEmpty,
  getTemplateFieldNames,
  getReservedPlaceholderNames,
  findPlaceholders,
  getPlaceholderGroups,
  getTemplateWarnings,
  hasTemplatePlaceholder,
  normalizeHeader,
  clampQrSize,
  clampLogoSize,
  getEventModalTabIndices,
} from "./emailTemplatePlaceholders.js";

const customFields = [
  { inputName: "Given Name", previousNames: ["First Name"] },
  { inputName: "Company" },
];

const warn = (overrides) =>
  getTemplateWarnings({
    subject: "Hi",
    body: "<p>{QR}</p>",
    useCustomFields: false,
    formFields: [],
    selectedFields: [],
    isPaid: false,
    ...overrides,
  });

test("toPlaceholder wraps a field name in braces", () => {
  assert.equal(toPlaceholder("First Name"), "{First Name}");
});

test("normalizePlaceholderKey matches the backend rule for case, spacing and nbsp", () => {
  assert.equal(normalizePlaceholderKey(" First&nbsp;Name "), "first name");
});

test("isRichTextEmpty treats empty editor markup as empty", () => {
  assert.equal(isRichTextEmpty("<p><br></p>"), true);
  assert.equal(isRichTextEmpty(""), true);
  assert.equal(isRichTextEmpty(undefined), true);
  assert.equal(isRichTextEmpty("<p>Hello</p>"), false);
  assert.equal(isRichTextEmpty("<div><br></div>"), true);
  assert.equal(isRichTextEmpty('<p><span style="font-size: 22px;">​</span></p>'), true);
  assert.equal(isRichTextEmpty('<p><img src="a.png"></p>'), false);
});

test("getTemplateFieldNames returns the classic fields when custom fields are off", () => {
  assert.deepEqual(getTemplateFieldNames({ useCustomFields: false, formFields: customFields }), [
    "Full Name",
    "Email",
    "Phone",
  ]);
});

test("getTemplateFieldNames returns unique custom field names and skips blanks", () => {
  const names = getTemplateFieldNames({
    useCustomFields: true,
    formFields: [{ inputName: "A" }, { inputName: " A " }, { inputName: "" }, {}],
  });
  assert.deepEqual(names, ["A"]);
});

test("getReservedPlaceholderNames offers Payment Summary only for paid events", () => {
  assert.deepEqual(getReservedPlaceholderNames({ isPaid: false }), ["Event Name", "Logo", "QR", "Token"]);
  assert.deepEqual(getReservedPlaceholderNames({ isPaid: true }), [
    "Event Name",
    "Logo",
    "QR",
    "Token",
    "Payment Summary",
  ]);
});

test("getPlaceholderGroups: splits placeholders into event details, QR and token, and attendee details", () => {
  assert.deepEqual(getPlaceholderGroups({ useCustomFields: false }), [
    { id: "eventDetails", names: ["Event Name", "Logo"] },
    { id: "qrToken", names: ["QR", "Token"] },
    { id: "attendeeDetails", names: ["Full Name", "Email", "Phone"] },
  ]);
});

test("getPlaceholderGroups: attendee details follow the event's custom fields", () => {
  const groups = getPlaceholderGroups({ useCustomFields: true, formFields: customFields });
  assert.deepEqual(groups.find((g) => g.id === "attendeeDetails").names, ["Given Name", "Company"]);
});

test("getPlaceholderGroups: a payment group appears only for paid events, and empty groups are dropped", () => {
  const free = getPlaceholderGroups({ useCustomFields: true, formFields: [] });
  assert.equal(free.some((g) => g.id === "payment"), false);
  assert.equal(free.some((g) => g.id === "attendeeDetails"), false);
  const paid = getPlaceholderGroups({ useCustomFields: false, isPaid: true });
  assert.deepEqual(paid.at(-1), { id: "payment", names: ["Payment Summary"] });
});

test("findPlaceholders lists every placeholder in order", () => {
  assert.deepEqual(findPlaceholders("<p>{ A } and {B}</p>{C}"), ["A", "B", "C"]);
  assert.deepEqual(findPlaceholders(undefined), []);
});

test("getTemplateWarnings: a clean template has no warnings", () => {
  assert.deepEqual(warn({ body: "<p>{Full Name}</p>{QR}" }), []);
});

test("getTemplateWarnings: warns when the body has no {QR}", () => {
  const result = warn({ body: "<p>{Full Name}</p>" });
  assert.deepEqual(result.map((w) => w.code), [EMAIL_TEMPLATE_WARNINGS.MISSING_QR]);
});

test("getTemplateWarnings: warns about a placeholder that matches no field", () => {
  const result = warn({ body: "{QR}{Nickname}" });
  assert.deepEqual(result, [
    { code: EMAIL_TEMPLATE_WARNINGS.UNKNOWN_PLACEHOLDER, placeholders: ["Nickname"] },
  ]);
});

test("getTemplateWarnings: a removed field still referenced in the body is reported as unknown", () => {
  const result = warn({ useCustomFields: true, formFields: [{ inputName: "Company" }], body: "{QR}{Given Name}" });
  assert.equal(result[0].code, EMAIL_TEMPLATE_WARNINGS.UNKNOWN_PLACEHOLDER);
  assert.deepEqual(result[0].placeholders, ["Given Name"]);
});

test("getTemplateWarnings: a renamed field's old name is not flagged because the backend still resolves it", () => {
  const result = warn({ useCustomFields: true, formFields: customFields, body: "{QR}{First Name}" });
  assert.deepEqual(result, []);
});

test("getTemplateWarnings: {Payment Summary} is unknown on a free event and known on a paid one", () => {
  assert.equal(warn({ body: "{QR}{Payment Summary}", isPaid: false })[0].code, EMAIL_TEMPLATE_WARNINGS.UNKNOWN_PLACEHOLDER);
  assert.deepEqual(warn({ body: "{QR}{Payment Summary}", isPaid: true }), []);
});

test("getTemplateWarnings: {QR}, {Logo} and {Payment Summary} in the subject are flagged as unsupported", () => {
  const result = warn({ subject: "Ticket {QR} {Logo} {Payment Summary}", isPaid: true });
  assert.deepEqual(result, [
    { code: EMAIL_TEMPLATE_WARNINGS.SUBJECT_UNSUPPORTED, placeholders: ["QR", "Logo", "Payment Summary"] },
  ]);
});

test("getTemplateWarnings: {Event Name} works in the subject and the body without a warning", () => {
  assert.deepEqual(warn({ subject: "Welcome to {Event Name}", body: "{QR}{Event Name}{Logo}" }), []);
});

test("clampSize helpers keep sizes inside the supported range and default invalid input", () => {
  assert.equal(clampQrSize("9999"), 400);
  assert.equal(clampQrSize(10), 80);
  assert.equal(clampQrSize("abc"), 180);
  assert.equal(clampLogoSize(5), 40);
  assert.equal(clampLogoSize("999"), 300);
  assert.equal(clampLogoSize(undefined), 140);
});

test("getTemplateWarnings: ticked fields that no longer exist are reported as removed", () => {
  const result = warn({ selectedFields: ["Email", "Badge Name"] });
  assert.deepEqual(result, [{ code: EMAIL_TEMPLATE_WARNINGS.REMOVED_FIELD, placeholders: ["Badge Name"] }]);
});

test("hasTemplatePlaceholder: finds a placeholder ignoring case and spacing", () => {
  assert.equal(hasTemplatePlaceholder("<p>{ qr }</p>", "QR"), true);
  assert.equal(hasTemplatePlaceholder("<p>{Token}</p>", "QR"), false);
  assert.equal(hasTemplatePlaceholder(undefined, "QR"), false);
});

test("getTemplateWarnings: ticking QR, Token or Payment Summary is never reported as a removed field", () => {
  assert.deepEqual(warn({ selectedFields: ["QR", "Token", "Email"] }), []);
  assert.deepEqual(warn({ selectedFields: ["Payment Summary"], isPaid: true }), []);
});

test("getEmailTemplateSettings: an event with no saved template starts in placeholder mode with defaults", () => {
  assert.deepEqual(getEmailTemplateSettings(undefined), { ...EMPTY_EMAIL_TEMPLATE_SETTINGS });
  assert.equal(getEmailTemplateSettings({ subject: "S", body: "" }).emailTemplateUsePlaceholders, true);
});

test("getEmailTemplateSettings: a saved body without usePlaceholders stays legacy so re-saving never changes old emails", () => {
  const settings = getEmailTemplateSettings({ subject: "S", body: "<p>Hi</p>" });
  assert.equal(settings.emailTemplateUsePlaceholders, false);
  assert.equal(settings.emailTemplateAccentColor, "#004aad");
});

test("getEmailTemplateSettings: reads every saved placeholder setting", () => {
  assert.deepEqual(
    getEmailTemplateSettings({
      subject: "S",
      body: "B",
      usePlaceholders: true,
      selectedFields: ["Email"],
      qrSize: 300,
      logoSize: 200,
      accentColor: "#112233",
      header: "{Logo}",
    }),
    {
      emailTemplateUsePlaceholders: true,
      emailTemplateSelectedFields: ["Email"],
      emailTemplateQrSize: 300,
      emailTemplateLogoSize: 200,
      emailTemplateAccentColor: "#112233",
      emailTemplateHeader: "{Logo}",
    },
  );
});

test("buildEmailTemplatePayload: maps form state to the API shape and clamps the QR size", () => {
  const payload = buildEmailTemplatePayload({
    emailTemplateSubject: "S",
    emailTemplateBody: "B",
    emailTemplateUsePlaceholders: true,
    emailTemplateSelectedFields: ["Email"],
    emailTemplateQrSize: "9999",
    emailTemplateLogoSize: "5",
    emailTemplateAccentColor: "#112233",
    emailTemplateHeader: "  <p>{Logo}</p><p>{Event Name}</p>  ",
  });
  assert.deepEqual(payload, {
    subject: "S",
    body: "B",
    usePlaceholders: true,
    selectedFields: ["Email"],
    qrSize: 400,
    logoSize: 40,
    accentColor: "#112233",
    header: "<p>{Logo}</p><p>{Event Name}</p>",
  });
});

test("buildEmailTemplatePayload: a legacy template is sent back as legacy", () => {
  const payload = buildEmailTemplatePayload({ ...getEmailTemplateSettings({ subject: "S", body: "B" }), emailTemplateSubject: "S", emailTemplateBody: "B" });
  assert.equal(payload.usePlaceholders, false);
});

test("normalizeHeader: no header when unset or when the editor is blank", () => {
  assert.equal(normalizeHeader(undefined), "");
  assert.equal(normalizeHeader("  \n "), "");
  assert.equal(normalizeHeader("<p><br></p>"), "");
  assert.equal(normalizeHeader("<div><br></div>"), "");
  assert.equal(normalizeHeader("<p>&nbsp;</p>"), "");
});

test("normalizeHeader: keeps trimmed rich text, including a lone placeholder or image", () => {
  assert.equal(normalizeHeader(' <p style="text-align: right;">Hi</p> '), '<p style="text-align: right;">Hi</p>');
  assert.equal(normalizeHeader("<p>{Logo}</p>"), "<p>{Logo}</p>");
  assert.equal(normalizeHeader('<p><img src="x.png"></p>'), '<p><img src="x.png"></p>');
});

test("getTemplateWarnings: a {QR} in the header counts, so no missing QR warning", () => {
  assert.deepEqual(warn({ body: "<p>Hi</p>", header: "{QR}" }), []);
});

test("getTemplateWarnings: an unknown placeholder in the header is reported", () => {
  const result = warn({ header: "{Logo} {Nickname}" });
  assert.deepEqual(result, [
    { code: EMAIL_TEMPLATE_WARNINGS.UNKNOWN_PLACEHOLDER, placeholders: ["Nickname"] },
  ]);
});

test("getEmailTemplateSettings: a saved template without a header has no header", () => {
  assert.equal(getEmailTemplateSettings({ subject: "S", body: "B", usePlaceholders: true }).emailTemplateHeader, "");
});

test("getEventModalTabIndices: classic fields, no extras", () => {
  assert.deepEqual(getEventModalTabIndices({}), {
    uploads: 3,
    customFields: -1,
    emailTemplate: -1,
    badge: 4,
    customQr: -1,
    last: 4,
  });
});

test("getEventModalTabIndices: the email tab follows the custom fields tab and precedes the badge tab", () => {
  assert.deepEqual(
    getEventModalTabIndices({ useCustomFields: true, useCustomEmailTemplate: true, useCustomQrCode: true }),
    { uploads: 3, customFields: 4, emailTemplate: 5, badge: 6, customQr: 7, last: 7 },
  );
});

test("getEventModalTabIndices: with classic fields the email tab follows Uploads", () => {
  const tabs = getEventModalTabIndices({ useCustomEmailTemplate: true });
  assert.equal(tabs.emailTemplate, 4);
  assert.equal(tabs.badge, 5);
});
