import ModuleLandingPage from "@/components/ModuleLandingPage";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "Event Wheel",
    features: [
      "Create spinning wheels with three setup options: 'Participant enter Names' , 'Admin Write Names' or 'Sync From Event Registrations'.",
      "Share wheel links via plain URL or QR code for easy access.",
      "Interactive spinning animation with random winner selection.",
      "Display winning results with celebration effects.",
    ],
    ctaLabel: "Create Spinning Wheels",
  },
  ar: {
    title: "Event Wheel – عجلة الأحداث",
    features: [
      "أنشئ عجلات دوارة مع ثلاثة خيارات للإعداد: 'المشاركون يدخلون الأسماء' ، 'الإدارة تكتب الأسماء' أو 'المزامنة من تسجيلات الأحداث'.",
      "شارك روابط العجلة عبر الرابط المباشر أو رمز QR للوصول السهل.",
      "رسوم متحركة تفاعلية للدوران مع اختيار عشوائي للفائز.",
      "عرض نتائج الفوز مع تأثيرات احتفالية.",
    ],
    ctaLabel: "إنشاء عجلات دوارة",
  },
};

export default function EventRegHome() {
  return (
    <ModuleLandingPage
      moduleIcon={ICONS.trophy}
      ctaLabel={translations.en.ctaLabel}
      ctaHref="/cms/modules/eventwheel/wheels"
      translations={translations}
    />
  );
}
