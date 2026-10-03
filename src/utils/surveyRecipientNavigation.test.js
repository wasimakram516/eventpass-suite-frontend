import test from "node:test";
import assert from "node:assert/strict";
import {
  canManageSurveyRecipients,
  FORMS_PATH,
  getSurveyRecipientBreadcrumbItems,
  getSurveyRecipientFormState,
  getSurveyRecipientUrl,
  SURVEY_RECIPIENT_FORM_STATES,
} from "./surveyRecipientNavigation.js";

test("getSurveyRecipientUrl routes a recipient through its form", () => {
  assert.equal(
    getSurveyRecipientUrl("form-123", "sam@example.com"),
    "/cms/modules/surveyguru/surveys/recipients?formId=form-123&search=sam%40example.com",
  );
});

test("getSurveyRecipientUrl sends contextless recipients to the forms list", () => {
  assert.equal(getSurveyRecipientUrl(), FORMS_PATH);
});

test("FORMS_PATH is the canonical destination for legacy SurveyGuru navigation", () => {
  assert.equal(FORMS_PATH, "/cms/modules/surveyguru/surveys/forms");
});

test("canManageSurveyRecipients mirrors SurveyGuru view permission", () => {
  assert.equal(canManageSurveyRecipients(true), true);
  assert.equal(canManageSurveyRecipients(false), false);
});

test("getSurveyRecipientFormState handles direct, denied, missing, and deleted forms", () => {
  assert.equal(
    getSurveyRecipientFormState({ _id: "form-123" }),
    SURVEY_RECIPIENT_FORM_STATES.READY,
  );
  assert.equal(
    getSurveyRecipientFormState({ error: true, status: 403 }),
    SURVEY_RECIPIENT_FORM_STATES.DENIED,
  );
  assert.equal(
    getSurveyRecipientFormState({ error: true, status: 404 }),
    SURVEY_RECIPIENT_FORM_STATES.MISSING,
  );
  assert.equal(
    getSurveyRecipientFormState({ _id: "form-123", isDeleted: true }),
    SURVEY_RECIPIENT_FORM_STATES.DELETED,
  );
});

test("getSurveyRecipientBreadcrumbItems keeps the selected form context visible", () => {
  assert.deepEqual(
    getSurveyRecipientBreadcrumbItems({
      surveyGuruLabel: "SurveyGuru",
      surveyFormsLabel: "Survey Forms",
      formTitle: "Post-event survey",
      recipientsLabel: "Manage Recipients",
    }),
    [
      { label: "SurveyGuru", href: FORMS_PATH },
      { label: "Survey Forms", href: FORMS_PATH },
      { label: "Post-event survey" },
    ],
  );
});
