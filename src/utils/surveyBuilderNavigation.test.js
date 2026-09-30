/**
 * Run with: node --test src/utils/surveyBuilderNavigation.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { getSurveyBuilderNavigation } from "./surveyBuilderNavigation.js";

test("survey builder navigation follows the visible tab order", () => {
  const tabs = [
    { id: "details" },
    { id: "options" },
    { id: "email" },
    { id: "whatsapp" },
    { id: "questions" },
  ];

  assert.deepEqual(getSurveyBuilderNavigation(tabs, "email"), {
    previousTabId: "options",
    nextTabId: "whatsapp",
    isLastTab: false,
  });
});

test("survey builder navigation skips disabled notification tabs", () => {
  const tabs = [
    { id: "details" },
    { id: "options" },
    { id: "questions" },
  ];

  assert.deepEqual(getSurveyBuilderNavigation(tabs, "options"), {
    previousTabId: "details",
    nextTabId: "questions",
    isLastTab: false,
  });
});

test("survey builder navigation identifies the final Questions tab", () => {
  const tabs = [{ id: "details" }, { id: "questions" }];

  assert.deepEqual(getSurveyBuilderNavigation(tabs, "questions"), {
    previousTabId: "details",
    nextTabId: null,
    isLastTab: true,
  });
});
