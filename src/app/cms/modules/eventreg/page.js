import ModuleLandingPage from "@/components/ModuleLandingPage";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "EventReg – Public Event Registration",
    features: [
      "Create public event registration forms easily.",
      "Share event links via plain URL or QR code.",
      "Participants register by filling in their details.",
      "Automatically send WhatsApp confirmation messages after successful registration.",
    ],
    ctaLabel: "Manage Event Registrations",
  },
  ar: {
    title: "EventReg – التسجيل في الفعاليات العامة",
    features: [
      "أنشئ نماذج تسجيل فعاليات عامة بسهولة.",
      "شارك روابط الفعاليات عبر الرابط المباشر أو رمز QR.",
      "يسجل المشاركون عن طريق تعبئة بياناتهم.",
      "إرسال رسالة تأكيد تلقائيًا عبر WhatsApp بعد التسجيل الناجح.",
    ],
    ctaLabel: "إدارة التسجيلات",
  },
};

export default function EventRegHome() {
  return (
    <ModuleLandingPage
      moduleIcon={ICONS.event}
      ctaLabel={translations.en.ctaLabel}
      ctaHref="/cms/modules/eventreg/events"
      translations={translations}
    />
  );
}
