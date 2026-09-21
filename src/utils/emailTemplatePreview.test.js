/**
 * Run with: node --test src/utils/emailTemplatePreview.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildEmailPreview,
  escapeHtml,
  getReadableTextColor,
  getSampleFieldValue,
  renderPlaceholders,
} from "./emailTemplatePreview.js";

const build = (template, extra = {}) =>
  buildEmailPreview({
    template: { subject: "Hi", body: "<p>Body</p>", ...template },
    useCustomFields: false,
    formFields: [],
    ...extra,
  });

test("escapeHtml escapes markup characters", () => {
  assert.equal(escapeHtml(`<b>"A" & 'B'</b>`), "&lt;b&gt;&quot;A&quot; &amp; &#39;B&#39;&lt;/b&gt;");
  assert.equal(escapeHtml(null), "");
});

test("getReadableTextColor picks white on dark and dark on light backgrounds", () => {
  assert.equal(getReadableTextColor("#004aad"), "#ffffff");
  assert.equal(getReadableTextColor("#f5e663"), "#111111");
});

test("renderPlaceholders fills known placeholders, leaves unknown ones, and escapes plain values", () => {
  const entries = new Map([["name", { value: "<b>A</b>" }]]);
  assert.equal(renderPlaceholders("{Name} {Nope}", entries), "&lt;b&gt;A&lt;/b&gt; {Nope}");
  assert.equal(renderPlaceholders("{Name}", entries, { escape: false }), "<b>A</b>");
});

test("getSampleFieldValue uses believable classic samples and labelled samples for custom fields", () => {
  assert.equal(getSampleFieldValue("Full Name"), "Sara Al Balushi");
  assert.equal(getSampleFieldValue("Company"), "Sample Company");
});

test("buildEmailPreview: fills attendee, token and event name placeholders with samples", () => {
  const { subject, html } = build({ subject: "{Event Name} for {Full Name}", body: "<p>{Email} / {Token}</p>" }, { eventName: "Tech Summit" });
  assert.equal(subject, "Tech Summit for Sara Al Balushi");
  assert.match(html, /sara@example\.com \/ A1B2C3D4E5/);
});

test("buildEmailPreview: custom field placeholders get labelled sample values", () => {
  const { html } = build(
    { body: "<p>{Company}</p>" },
    { useCustomFields: true, formFields: [{ inputName: "Company" }] },
  );
  assert.match(html, /<p>Sample Company<\/p>/);
});

test("buildEmailPreview: falls back to a sample event name until one is typed", () => {
  const { html } = build({ body: "<p>{Event Name}</p>" });
  assert.match(html, /<p>Your Event<\/p>/);
});

test("buildEmailPreview: no header band without a header, and a blank editor counts as none", () => {
  assert.doesNotMatch(build({}).html, /padding:24px;color:/);
  assert.doesNotMatch(build({ header: "<p><br></p>" }).html, /padding:24px;color:/);
});

test("buildEmailPreview: a header is filled and shown in the accent color band with readable text", () => {
  const dark = build({ header: "<p>{Event Name}</p>", accentColor: "#112233" }, { eventName: "Summit" });
  assert.match(dark.html, /background:#112233;padding:24px;color:#ffffff/);
  assert.match(dark.html, /<p>Summit<\/p>/);
  const light = build({ header: "<p>Hi</p>", accentColor: "#f5f5f5" });
  assert.match(light.html, /color:#111111/);
});

test("buildEmailPreview: an invalid accent color falls back to the default blue", () => {
  assert.match(build({ header: "<p>Hi</p>", accentColor: "red;x" }).html, /background:#004aad/);
});

test("buildEmailPreview: {Logo} uses the event logo at the chosen size, or a labelled stand in", () => {
  const withLogo = build({ body: "{Logo}", logoSize: 90 }, { logoUrl: "https://cdn.example.com/logo.png" });
  assert.match(withLogo.html, /<img src="https:\/\/cdn\.example\.com\/logo\.png"[^>]*width="90"/);
  const without = build({ body: "{Logo}", logoSize: 90 });
  assert.match(without.html, /width:90px[^>]*>Event logo</);
});

test("buildEmailPreview: {QR} uses the sample QR at the chosen size, or a labelled stand in until it is ready", () => {
  const ready = build({ body: "{QR}", qrSize: 250 }, { qrDataUrl: "data:image/png;base64,AAA" });
  assert.match(ready.html, /<img src="data:image\/png;base64,AAA"[^>]*width="250"/);
  const pending = build({ body: "{QR}", qrSize: 250 });
  assert.match(pending.html, /width:250px[^>]*>QR code</);
});

test("buildEmailPreview: the QR and logo carry no alignment of their own, so the editor's alignment applies", () => {
  const { html } = build(
    { body: '<div style="text-align: right;">{QR}</div>' },
    { qrDataUrl: "data:image/png;base64,AAA" },
  );
  assert.match(html, /<div style="text-align: right;"><img src="data:image\/png/);
});

test("buildEmailPreview: {QR}, {Logo} and {Payment Summary} are blank in the subject", () => {
  const { subject } = build({ subject: "A{QR}B{Logo}C{Payment Summary}D" }, { isPaid: true });
  assert.equal(subject, "ABCD");
});

test("buildEmailPreview: paid events show the sample payment summary at the placeholder or at the bottom, colored with the accent", () => {
  const placed = build({ body: "<p>Top</p>{Payment Summary}<p>Bottom</p>", accentColor: "#aa2200" }, { isPaid: true });
  assert.equal(placed.html.match(/Payment Summary:/g).length, 1);
  assert.ok(placed.html.indexOf("Payment Summary:") < placed.html.indexOf("Bottom"));
  assert.match(placed.html, /color:#aa2200;">Payment Summary:/);
  const appended = build({ body: "<p>Top</p>" }, { isPaid: true });
  assert.ok(appended.html.indexOf("Payment Summary:") > appended.html.indexOf("Top"));
});

test("buildEmailPreview: free events show no payment summary", () => {
  assert.doesNotMatch(build({ body: "{Payment Summary}<p>Body</p>" }).html, /Payment Summary:/);
});

test("buildEmailPreview: sample values are escaped and Arabic sets right to left direction", () => {
  const { html } = build({ body: "<p>{Company}</p>" }, {
    useCustomFields: true,
    formFields: [{ inputName: "<i>Company</i>" }],
    language: "ar",
  });
  assert.match(html, /dir="rtl"/);
  assert.doesNotMatch(html, /<p>Sample <i>/);
});
