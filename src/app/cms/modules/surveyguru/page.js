import ModuleLandingPage from "@/components/ModuleLandingPage";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "SurveyGuru – Thank You & Surveys",
    features: [
      "Send thank-you emails to all attendees of a specific event.",
      "Dry-run preview and test email before sending.",
      "Role-guarded actions for admins/business only.",
    ],
    ctaLabel: "Open SurveyGuru",
  },
  ar: {
    title: "SurveyGuru – رسائل الشكر والاستبيانات",
    features: [
      "أرسل رسالة شكر لجميع حضور فعالية محددة.",
      "معاينة تجريبية وإرسال اختبار قبل الإرسال الفعلي.",
      "إجراءات محمية بالصلاحيات للمسؤولين وأصحاب الأعمال فقط.",
    ],
    ctaLabel: "فتح سيرفي جورو",
  },
};

export default function SurveyGuruHome() {
  return (
    <ModuleLandingPage
      moduleIcon={ICONS.email}  
      ctaHref="/cms/modules/surveyguru/surveys"
      translations={translations}
    />
  );
}
