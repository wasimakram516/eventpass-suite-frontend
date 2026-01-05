import ModuleLandingPage from "@/components/ModuleLandingPage";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "CheckIn – Guest Attendance Tracking & Verification",
    features: [
      "Create check-in events with custom registration forms for guests and attendees.",
      "Generate shareable links or QR codes for quick and easy check-in.",
      "Guests mark their attendance and receive a confirmation message with their attendance status.",
      "Guests can download their QR code for easy access and verification at the event.",
    ],
    ctaLabel: "Manage CheckIn Events",
  },
  ar: {
    title: "CheckIn – تتبع وتأكيد دخول الضيوف",
    features: [
      "أنشئ فعاليات تسجيل حضور بنماذج تسجيل مخصصة للضيوف والحضور.",
      "أنشئ روابط قابلة للمشاركة أو رموز QR لتسجيل الحضور السريع والسهل.",
      "يقوم الضيوف بتسجيل حضورهم ويتلقون رسالة تأكيد مع حالة حضورهم.",
      "يمكن للضيوف تنزيل رمز QR الخاص بهم للوصول السهل والتحقق في الفعالية.",
    ],
    ctaLabel: "إدارة فعاليات CheckIn",
  },
};

export default function CheckInHome() {
  return (
    <ModuleLandingPage
      moduleIcon={ICONS.checkin}
      ctaLabel={translations.en.ctaLabel}
      ctaHref="/cms/modules/checkin/events"
      translations={translations}
    />
  );
}
