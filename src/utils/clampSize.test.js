/**
 * Run with: node --test src/utils/clampSize.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { clampSize } from "./clampSize.js";

const range = { min: 10, max: 100, fallback: 40 };

test("clampSize keeps a value inside the range and rounds it", () => {
  assert.equal(clampSize(50, range), 50);
  assert.equal(clampSize(49.6, range), 50);
  assert.equal(clampSize("60", range), 60);
});

test("clampSize pulls out of range values back to the nearest limit", () => {
  assert.equal(clampSize(3, range), 10);
  assert.equal(clampSize(9999, range), 100);
});

test("clampSize uses the fallback for missing, non numeric and non positive values", () => {
  assert.equal(clampSize(undefined, range), 40);
  assert.equal(clampSize("abc", range), 40);
  assert.equal(clampSize(0, range), 40);
  assert.equal(clampSize(-5, range), 40);
});
