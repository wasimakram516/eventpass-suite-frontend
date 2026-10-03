import { redirect } from "next/navigation";
import { FORMS_PATH } from "@/utils/surveyRecipientNavigation";

// Recipients are managed per form, addressed by slug under /recipients/[slug].
// A bare /recipients visit has no form context, so send it to the forms list.
export default function SurveyRecipientsIndexPage() {
  redirect(FORMS_PATH);
}
