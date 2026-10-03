const RECIPIENTS_PATH = "/cms/modules/surveyguru/surveys/recipients";
const FORMS_PATH = "/cms/modules/surveyguru/surveys/forms";

export const SURVEY_RECIPIENT_FORM_STATES = Object.freeze({
  READY: "ready",
  MISSING: "missing",
  DENIED: "denied",
  DELETED: "deleted",
});

/** Returns whether a SurveyGuru viewer can open the recipients action. */
export const canManageSurveyRecipients = (canView) => Boolean(canView);

/** Resolves the safe recipient-page state from a survey-form request result. */
export const getSurveyRecipientFormState = (result) => {
  const form = result?.data || result;
  if (result?.error || !form?._id) {
    return result?.status === 403
      ? SURVEY_RECIPIENT_FORM_STATES.DENIED
      : SURVEY_RECIPIENT_FORM_STATES.MISSING;
  }

  return form.isDeleted
    ? SURVEY_RECIPIENT_FORM_STATES.DELETED
    : SURVEY_RECIPIENT_FORM_STATES.READY;
};

/** Builds the recipient breadcrumb trail with the selected form as its final item. */
export const getSurveyRecipientBreadcrumbItems = ({
  surveyGuruLabel,
  surveyFormsLabel,
  formTitle,
  recipientsLabel,
}) => [
  { label: surveyGuruLabel, href: FORMS_PATH },
  { label: surveyFormsLabel, href: FORMS_PATH },
  { label: formTitle || recipientsLabel },
];

/** Builds the direct recipient URL for a survey form. */
export const getSurveyRecipientUrl = (formSlug, search = "") => {
  if (!formSlug) return FORMS_PATH;

  const base = `${RECIPIENTS_PATH}/${encodeURIComponent(String(formSlug))}`;
  if (!search) return base;
  return `${base}?${new URLSearchParams({ search: String(search) }).toString()}`;
};

export { FORMS_PATH, RECIPIENTS_PATH };
