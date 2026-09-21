/**
 * Run with: node --test src/utils/richTextDom.test.js
 * Only the pure helpers run here. The Range based helpers need a real browser
 * selection and are verified in a browser.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { FONT_SIZE_LIMITS, ZERO_WIDTH_SPACE, clampFontSize } from "./richTextDom.js";

test("clampFontSize keeps sizes inside the supported range", () => {
  assert.equal(clampFontSize(1), FONT_SIZE_LIMITS.MIN);
  assert.equal(clampFontSize(500), FONT_SIZE_LIMITS.MAX);
  assert.equal(clampFontSize(22), 22);
});

test("clampFontSize accepts numeric strings and rounds", () => {
  assert.equal(clampFontSize("22"), 22);
  assert.equal(clampFontSize(21.6), 22);
});

test("clampFontSize falls back to the default for invalid input", () => {
  assert.equal(clampFontSize("abc"), FONT_SIZE_LIMITS.DEFAULT);
  assert.equal(clampFontSize(undefined), FONT_SIZE_LIMITS.DEFAULT);
  assert.equal(clampFontSize(-5), FONT_SIZE_LIMITS.DEFAULT);
});

test("the caret placeholder is the invisible zero width space", () => {
  assert.equal(ZERO_WIDTH_SPACE, "​");
});
