/**
 * Run with: node --test src/utils/whatsappMessages.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildVariableRows,
  describeTemplateBody,
  matchesSearch,
  moduleKeyForEventType,
  pickDefaultMessageId,
  splitTemplateBody,
  templateIdOf,
  templateLabel,
  toEditableMessages,
  toMessagesPayload,
  validateWhatsAppMessage,
  validateWhatsAppMessages,
  whatsappEventTypeFor,
} from "./whatsappMessages.js";

const template = { _id: "t1", body: "Hello {{1}}, RSVP: {{2}}", variables: ["1", "2"] };
const templatesById = new Map([["t1", template]]);
const options = {
  templatesById,
  placeholders: ["Attendee Name", "Confirmation Link"],
  fieldNames: ["Full Name", "Email", "Phone"],
};

const message = (overrides = {}) => ({
  label: "Invitation",
  template: "t1",
  variables: [
    { position: "1", source: "field", value: "Full Name", fallback: "Guest" },
    { position: "2", source: "placeholder", value: "Confirmation Link", fallback: "" },
  ],
  ...overrides,
});

test("whatsappEventTypeFor: maps the event modal mode to an event type", () => {
  assert.equal(whatsappEventTypeFor({ isClosed: true }), "closed");
  assert.equal(whatsappEventTypeFor({ moduleKey: "eventreg" }), "public");
  assert.equal(whatsappEventTypeFor({ moduleKey: "checkout" }), "checkout");
});

test("buildVariableRows: one row per slot, keeping existing rows", () => {
  const rows = buildVariableRows(template, [{ position: "2", source: "text", value: "x", fallback: "" }]);
  assert.deepEqual(rows, [
    { position: "1", source: "text", value: "", fallback: "" },
    { position: "2", source: "text", value: "x", fallback: "" },
  ]);
  assert.deepEqual(buildVariableRows(null), []);
});

test("toEditableMessages and toMessagesPayload: round trip, trimmed, only template slots", () => {
  const editable = toEditableMessages([
    { _id: "m1", label: " Invitation ", template: { _id: "t1" }, variables: [...message().variables, { position: "9", source: "text", value: "x" }] },
  ]);
  assert.equal(editable[0].template, "t1");
  const payload = toMessagesPayload(editable, templatesById);
  assert.equal(payload[0]._id, "m1");
  assert.equal(payload[0].label, "Invitation");
  assert.deepEqual(payload[0].variables.map((v) => v.position), ["1", "2"]);
});

test("validateWhatsAppMessage: accepts a complete message", () => {
  assert.equal(validateWhatsAppMessage(message(), options), null);
});

test("validateWhatsAppMessage: reports the first problem", () => {
  assert.match(validateWhatsAppMessage(message({ label: "" }), options), /needs a name/);
  assert.match(validateWhatsAppMessage(message({ template: "" }), options), /choose a template/);
  assert.match(validateWhatsAppMessage(message({ variables: [message().variables[0]] }), options), /\{\{2\}\}: a value is required/);
  assert.match(
    validateWhatsAppMessage(message({ variables: [{ position: "1", source: "field", value: "Company" }, message().variables[1]] }), options),
    /not a registration field/
  );
  assert.match(
    validateWhatsAppMessage(message(), { ...options, placeholders: ["Attendee Name"] }),
    /not available for this event type/
  );
  assert.match(validateWhatsAppMessage(message(), { ...options, fieldNames: null }), /registration fields are not available/);
});

test("validateWhatsAppMessages: names must be unique", () => {
  assert.equal(validateWhatsAppMessages([message(), message({ label: "Reminder" })], options), null);
  assert.match(validateWhatsAppMessages([message(), message({ label: "invitation " })], options), /Two WhatsApp messages/);
});

test("describeTemplateBody: shows mappings in place of slots", () => {
  assert.equal(describeTemplateBody(template.body, message().variables), "Hello [Full Name], RSVP: [Confirmation Link]");
  assert.equal(
    describeTemplateBody(template.body, [{ position: "1", source: "text", value: "Sara" }]),
    "Hello Sara, RSVP: {{2}}"
  );
});

test("templateIdOf: reads ids and populated templates", () => {
  assert.equal(templateIdOf("t1"), "t1");
  assert.equal(templateIdOf({ _id: "t1" }), "t1");
  assert.equal(templateIdOf(null), "");
});

test("moduleKeyForEventType: maps event types to registration modules", () => {
  assert.equal(moduleKeyForEventType("closed"), "checkin");
  assert.equal(moduleKeyForEventType("public"), "eventreg");
  assert.equal(moduleKeyForEventType("checkout"), "checkout");
  assert.equal(moduleKeyForEventType("digipass"), null);
});

test("pickDefaultMessageId: prefers the message named Default, else the first", () => {
  const messages = [{ _id: "a", label: "Invitation" }, { _id: "b", label: "Reminder" }, { _id: "c", label: "Default" }];
  assert.equal(pickDefaultMessageId(messages), "c");
  assert.equal(pickDefaultMessageId(messages.slice(0, 2)), "a");
  assert.equal(pickDefaultMessageId([]), "");
});

test("matchesSearch: case insensitive across fields, empty query matches all", () => {
  assert.equal(matchesSearch(["checkin_invite", "Hello {{1}}"], "INVITE"), true);
  assert.equal(matchesSearch(["checkin_invite", null], "reminder"), false);
  assert.equal(matchesSearch(["x"], "  "), true);
});

test("splitTemplateBody: separates slots from text", () => {
  assert.deepEqual(splitTemplateBody("Hi {{1}}, see {{ 2 }}"), [
    { text: "Hi ", slot: false },
    { text: "{{1}}", slot: true },
    { text: ", see ", slot: false },
    { text: "{{ 2 }}", slot: true },
  ]);
  assert.deepEqual(splitTemplateBody(""), []);
});

test("templateLabel: the EventPass name wins, else the Twilio name", () => {
  assert.equal(templateLabel({ name: "eventtexttest", displayName: "Fori RSVP text" }), "Fori RSVP text");
  assert.equal(templateLabel({ name: "eventtexttest", displayName: "" }), "eventtexttest");
  assert.equal(templateLabel(null), "");
});
