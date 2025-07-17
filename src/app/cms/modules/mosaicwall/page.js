import ModuleLandingPage from "@/components/ModuleLandingPage";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "Mosaic Wall",
    features: [
      "Create and share polls with the public effortlessly.",
      "Users can cast their votes anonymously – no login required.",
      "View and analyze poll results instantly.",
      "Ideal for events, booths, or real-time feedback collection.",
    ],
    ctaLabel: "Manage Polls",
  },
  ar: {
    title: "VoteCast – استطلاعات الجمهور",
    features: [
      "أنشئ وشارك استطلاعات مع الجمهور بسهولة.",
      "يمكن للمستخدمين التصويت بشكل مجهول دون تسجيل الدخول.",
      "اعرض نتائج الاستطلاع فورًا وحللها.",
      "مثالية للفعاليات أو الأجنحة أو جمع التعليقات الفورية.",
    ],
    ctaLabel: "إدارة الاستطلاعات",
  },
};

export default function VoteCastHome() {
  return (
    <ModuleLandingPage
      moduleIcon={ICONS.poll}
      ctaLabel={translations.en.ctaLabel}
      ctaHref="/cms/modules/mosaicwall/walls-setup"
      translations={translations}
    />
  );
}
