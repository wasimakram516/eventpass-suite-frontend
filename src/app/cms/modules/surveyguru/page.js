import { redirect } from "next/navigation";
import { FORMS_PATH } from "@/utils/surveyRecipientNavigation";

export default function SurveyGuruHome() {
  redirect(FORMS_PATH);
}
