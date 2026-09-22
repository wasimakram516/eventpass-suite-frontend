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

const EVENT_DETAILS_SHARED = ["Event Name", "Logo", "Event Start and End Date", "Start Date", "End Date", "Venue", "Event Description"];
const ORGANIZER_DETAILS = [
  "Organizer Name",
  "Organizer Email",
  "Organizer Phone",
  "Organizer Address",
  "Organizer Website",
  "Organizer Other Details",
];

test("getPlaceholderGroups: every module gets the same event and organizer details from the event modal", () => {
  const groups = getPlaceholderGroups({ useCustomFields: false });
  assert.deepEqual(groups, [
    { id: "eventDetails", names: EVENT_DETAILS_SHARED },
    { id: "organizerDetails", names: ORGANIZER_DETAILS },
    { id: "qrToken", names: ["QR", "Token"] },
    { id: "attendeeDetails", names: ["Full Name", "Email", "Phone", "Registration Details"] },
    { id: "customMedia", names: ["Custom Image", "Custom Link"] },
  ]);
});

test("getPlaceholderGroups: start and end time appear only for CheckIn events, like the event modal", () => {
  const eventDetails = (isCheckIn) =>
    getPlaceholderGroups({ useCustomFields: false, isCheckIn }).find((group) => group.id === "eventDetails").names;

  assert.equal(eventDetails(false).includes("Start Time"), false);
  assert.equal(eventDetails(false).includes("End Time"), false);
  assert.deepEqual(eventDetails(true), [
    "Event Name",
    "Logo",
    "Event Start and End Date",
    "Start Date",
    "End Date",
    "Start Time",
    "End Time",
    "Venue",
    "Event Description",
  ]);
});

test("getPlaceholderGroups: the confirmation button is a Links group that only CheckIn events have", () => {
  assert.equal(getPlaceholderGroups({ useCustomFields: false }).some((group) => group.id === "links"), false);
  assert.deepEqual(getPlaceholderGroups({ useCustomFields: false, isCheckIn: true }).at(-1), {
    id: "links",
    names: ["Confirmation Button"],
  });
});

test("getPlaceholderGroups: attendee details follow the event's custom fields and keep the registration details table", () => {
  const groups = getPlaceholderGroups({ useCustomFields: true, formFields: customFields });
  assert.deepEqual(groups.find((g) => g.id === "attendeeDetails").names, [
    "Given Name",
    "Company",
    "Registration Details",
  ]);
});

test("getPlaceholderGroups: a payment group appears only for paid events", () => {
  assert.equal(getPlaceholderGroups({ useCustomFields: false }).some((g) => g.id === "payment"), false);
  const groups = getPlaceholderGroups({ useCustomFields: false, isPaid: true });
  assert.deepEqual(groups.find((g) => g.id === "payment"), { id: "payment", names: ["Payment Summary"] });
});

test("getPlaceholderGroups: the custom image and link group is offered to every module", () => {
  const groups = getPlaceholderGroups({ useCustomFields: false });
  assert.deepEqual(groups.find((g) => g.id === "customMedia"), {
    id: "customMedia",
    names: ["Custom Image", "Custom Link"],
  });
});

test("getReservedPlaceholderNames: lists every built in name once, following the same rules as the groups", () => {
  const base = getReservedPlaceholderNames({});
  assert.deepEqual(base, [
    ...EVENT_DETAILS_SHARED,
    ...ORGANIZER_DETAILS,
    "QR",
    "Token",
    "Registration Details",
    "Custom Image",
    "Custom Link",
  ]);
  assert.equal(new Set(base).size, base.length);
  assert.ok(getReservedPlaceholderNames({ isPaid: true }).includes("Payment Summary"));
  assert.ok(getReservedPlaceholderNames({ isCheckIn: true }).includes("Confirmation Button"));
  assert.ok(getReservedPlaceholderNames({ isCheckIn: true }).includes("Start Time"));
  assert.equal(base.includes("Start Time"), false);
});

test("getTemplateWarnings: the new event, organizer and registration placeholders are known, not flagged", () => {
  const body = "{QR}{Event Start and End Date}{Start Date}{End Date}{Venue}{Event Description}{Organizer Name}{Organizer Other Details}{Registration Details}";
  assert.deepEqual(warn({ body }), []);
});

test("getTemplateWarnings: start time and the confirmation button are unknown outside CheckIn, known inside it", () => {
  const body = "{QR}{Start Time}{Confirmation Button}";
  const outside = warn({ body, isCheckIn: false });
  assert.deepEqual(outside, [
    { code: EMAIL_TEMPLATE_WARNINGS.UNKNOWN_PLACEHOLDER, placeholders: ["Start Time", "Confirmation Button"] },
  ]);
  assert.deepEqual(warn({ body, isCheckIn: true }), []);
});

test("getTemplateWarnings: plain details work in the subject, but description, registration details and the button do not", () => {
  assert.deepEqual(warn({ subject: "{Venue} on {Start Date}", isCheckIn: true }), []);
  const result = warn({ subject: "{Event Description}{Registration Details}{Confirmation Button}", isCheckIn: true });
  assert.deepEqual(result, [
    {
      code: EMAIL_TEMPLATE_WARNINGS.SUBJECT_UNSUPPORTED,
      placeholders: ["Event Description", "Registration Details", "Confirmation Button"],
    },
  ]);
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
      customImage: { url: "https://cdn.example.com/banner.png", width: 480 },
      customLink: "https://example.com/agenda",
    }),
    {
      emailTemplateUsePlaceholders: true,
      emailTemplateSelectedFields: ["Email"],
      emailTemplateQrSize: 300,
      emailTemplateLogoSize: 200,
      emailTemplateAccentColor: "#112233",
      emailTemplateHeader: "{Logo}",
      emailTemplateCustomImageUrl: "https://cdn.example.com/banner.png",
      emailTemplateCustomImageWidth: 480,
      emailTemplateCustomLink: "https://example.com/agenda",
    },
  );
});

test("getEmailTemplateSettings: a saved template without a custom image or link defaults to none", () => {
  const settings = getEmailTemplateSettings({ subject: "S", body: "B", usePlaceholders: true });
  assert.equal(settings.emailTemplateCustomImageUrl, "");
  assert.equal(settings.emailTemplateCustomImageWidth, 320);
  assert.equal(settings.emailTemplateCustomLink, "");
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
    emailTemplateCustomImageUrl: "https://cdn.example.com/banner.png",
    emailTemplateCustomImageWidth: "9999",
    emailTemplateCustomLink: "https://example.com/agenda",
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
    customImage: { url: "https://cdn.example.com/banner.png", width: 600 },
    customLink: "https://example.com/agenda",
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
    tickets: -1,
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
    { tickets: -1, uploads: 3, customFields: 4, emailTemplate: 5, badge: 6, customQr: 7, last: 7 },
  );
});

test("getEventModalTabIndices: with classic fields the email tab follows Uploads", () => {
  const tabs = getEventModalTabIndices({ useCustomEmailTemplate: true });
  assert.equal(tabs.emailTemplate, 4);
  assert.equal(tabs.badge, 5);
});

test("getEventModalTabIndices: paid events insert Tickets & Fees after Options", () => {
  const tabs = getEventModalTabIndices({ hasTicketsTab: true });
  assert.equal(tabs.tickets, 3);
  assert.equal(tabs.uploads, 4);
  assert.equal(tabs.badge, 5);
  assert.equal(tabs.last, 5);
});
