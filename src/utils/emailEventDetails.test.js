/**
 * Run with: node --test src/utils/emailEventDetails.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  eventInfoFromEvent,
  eventInfoFromEventForm,
  formatEventDate,
  formatEventDateRange,
  formatEventTime,
  getEventDetailSamples,
  getSampleDescriptionHtml,
} from "./emailEventDetails.js";

const valueOf = (samples, name) => samples.find((entry) => entry.name === name).value;

test("formatEventDate: a form date reads as a local day and formats long", () => {
  assert.equal(formatEventDate("2026-10-05", "en"), "Monday, October 5, 2026");
  assert.equal(formatEventDate(null, "en"), "");
  assert.equal(formatEventDate("not a date", "en"), "");
  assert.match(formatEventDate("2026-10-05", "ar"), /[؀-ۿ]/);
});

test("formatEventDateRange: one date for a one day event, a dash range otherwise, and the joiner is changeable", () => {
  assert.equal(formatEventDateRange({ startDate: "2026-10-05", endDate: "2026-10-05" }, "en"), "Monday, October 5, 2026");
  assert.equal(formatEventDateRange({ startDate: "2026-10-05" }, "en"), "Monday, October 5, 2026");
  assert.equal(
    formatEventDateRange({ startDate: "2026-10-05", endDate: "2026-10-07" }, "en"),
    "Monday, October 5, 2026 – Wednesday, October 7, 2026",
  );
  assert.equal(
    formatEventDateRange({ startDate: "2026-10-05", endDate: "2026-10-07" }, "en", " to "),
    "Monday, October 5, 2026 to Wednesday, October 7, 2026",
  );
  assert.equal(formatEventDateRange({}, "en"), "");
});

test("formatEventTime: stored HH:mm as a 12 hour clock", () => {
  assert.equal(formatEventTime("09:05", "en"), "9:05 AM");
  assert.equal(formatEventTime("17:30", "en"), "5:30 PM");
  assert.equal(formatEventTime("", "en"), "");
  assert.equal(formatEventTime("late", "en"), "");
});

test("getEventDetailSamples: uses what the admin entered", () => {
  const samples = getEventDetailSamples({
    eventInfo: {
      startDate: "2026-10-05",
      endDate: "2026-10-07",
      venue: "Muscat Hall",
      organizerName: "Acme",
      organizerOtherDetails: "Parking",
    },
  });
  assert.equal(valueOf(samples, "Event Start and End Date"), "Monday, October 5, 2026 – Wednesday, October 7, 2026");
  assert.equal(valueOf(samples, "Start Date"), "Monday, October 5, 2026");
  assert.equal(valueOf(samples, "End Date"), "Wednesday, October 7, 2026");
  assert.equal(valueOf(samples, "Venue"), "Muscat Hall");
  assert.equal(valueOf(samples, "Organizer Name"), "Acme");
  assert.equal(valueOf(samples, "Organizer Other Details"), "Parking");
});

test("getEventDetailSamples: falls back to sample values for anything not entered yet", () => {
  const samples = getEventDetailSamples({ eventInfo: {} });
  assert.equal(valueOf(samples, "Venue"), "Sample venue");
  assert.equal(valueOf(samples, "Organizer Email"), "organizer@example.com");
  assert.ok(valueOf(samples, "Event Start and End Date").length > 0);
  assert.ok(valueOf(samples, "Start Date").length > 0);
});

test("getEventDetailSamples: start and end time exist only for CheckIn events", () => {
  const eventInfo = { startTime: "09:00", endTime: "17:30" };
  const other = getEventDetailSamples({ eventInfo, isCheckIn: false });
  assert.equal(valueOf(other, "Start Time"), "");
  assert.equal(valueOf(other, "End Time"), "");
  const checkIn = getEventDetailSamples({ eventInfo, isCheckIn: true });
  assert.equal(valueOf(checkIn, "Start Time"), "9:00 AM");
  assert.equal(valueOf(checkIn, "End Time"), "5:30 PM");
  assert.equal(valueOf(getEventDetailSamples({ eventInfo: {}, isCheckIn: true }), "Start Time"), "9:00 AM");
});

test("getSampleDescriptionHtml: the written description, or a sample until there is one", () => {
  assert.equal(getSampleDescriptionHtml({ description: "<p>Real</p>" }), "<p>Real</p>");
  assert.match(getSampleDescriptionHtml({}), /Sample event description/);
  assert.match(getSampleDescriptionHtml(undefined), /Sample event description/);
});

test("eventInfoFromEvent: picks the details from a saved event", () => {
  const info = eventInfoFromEvent({ startDate: "d", venue: "V", organizerName: "O", startTime: "10:00", extra: "ignored" });
  assert.deepEqual(Object.keys(info).sort(), [
    "description",
    "endDate",
    "endTime",
    "organizerAddress",
    "organizerEmail",
    "organizerName",
    "organizerOtherDetails",
    "organizerPhone",
    "organizerWebsite",
    "startDate",
    "startTime",
    "venue",
  ]);
  assert.equal(info.startTime, "10:00");
  assert.equal(info.venue, "V");
});

test("eventInfoFromEventForm: reads the modal form, and drops times outside CheckIn", () => {
  const form = {
    startDate: "2026-10-05",
    endDate: "2026-10-07",
    startTime: "09:00",
    endTime: "17:00",
    timezone: undefined,
    venue: "Hall",
    description: "<p>x</p>",
    organizerName: "Acme",
  };
  const checkIn = eventInfoFromEventForm(form, true);
  assert.equal(checkIn.startTime, "09:00");
  assert.equal(checkIn.endTime, "17:00");
  assert.equal(checkIn.venue, "Hall");
  assert.equal(checkIn.organizerName, "Acme");

  const other = eventInfoFromEventForm(form, false);
  assert.equal(other.startTime, "");
  assert.equal(other.endTime, "");
  assert.equal(other.startDate, "2026-10-05");
});
