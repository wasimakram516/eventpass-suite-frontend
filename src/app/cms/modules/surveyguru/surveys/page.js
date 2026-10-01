import { redirect } from "next/navigation";
import { FORMS_PATH } from "@/utils/surveyRecipientNavigation";

/** Redirects the legacy SurveyGuru hub to the survey forms list. */
export default function SurveyGuruDashboard() {
  redirect(FORMS_PATH);
}
