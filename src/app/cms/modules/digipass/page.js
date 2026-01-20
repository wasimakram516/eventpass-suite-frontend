import ModuleLandingPage from "@/components/ModuleLandingPage";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "DigiPass – Digital Pass Management & Activity Tracking",
    features: [
      "Create digital pass events with custom registration forms.",
      "Track user activity completion with task-based system.",
      "Set minimum and maximum tasks per user for engagement control.",
      "Generate shareable links or QR codes for easy access.",
    ],
    ctaLabel: "Manage Passes",
  },
  ar: {
    title: "DigiPass – إدارة التذاكر الرقمية وتتبع الأنشطة",
    features: [
      "أنشئ فعاليات تذاكر رقمية بنماذج تسجيل مخصصة.",
      "تتبع إتمام أنشطة المستخدمين بنظام قائم على المهام.",
      "حدد الحد الأدنى والأقصى للمهام لكل مستخدم للتحكم في المشاركة.",
      "أنشئ روابط قابلة للمشاركة أو رموز QR للوصول السهل.",
    ],
    ctaLabel: "إدارة التذاكر",
  },
};

export default function DigiPassHome() {
  return (
    <ModuleLandingPage
      moduleIcon={ICONS.badge}
      ctaLabel={translations.en.ctaLabel}
      ctaHref="/cms/modules/digipass/events"
      translations={translations}
    />
  );
}

