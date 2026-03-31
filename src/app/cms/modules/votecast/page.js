import ModuleLandingPage from "@/components/ModuleLandingPage";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "VoteCast – Audience Polling",
    features: [
      "Create polls and link them to your event for registration-based access.",
      "Attendees verify their registration before voting to ensure one vote per person.",
      "View and analyze poll results instantly in real time.",
      "Share via QR code or link — works seamlessly at events and booths.",
    ],
    ctaLabel: "Manage Polls",
  },
  ar: {
    title: "VoteCast – استطلاعات الجمهور",
    features: [
      "أنشئ استطلاعات واربطها بفعاليتك للوصول المبني على التسجيل.",
      "يتحقق الحضور من تسجيلهم قبل التصويت لضمان صوت واحد لكل شخص.",
      "اعرض نتائج الاستطلاع وحللها فورًا في الوقت الفعلي.",
      "شارك عبر رمز QR أو رابط — يعمل بسلاسة في الفعاليات والأجنحة.",
    ],
    ctaLabel: "إدارة الاستطلاعات",
  },
};

export default function VoteCastHome() {
  return (
    <ModuleLandingPage
      moduleIcon={ICONS.poll}
      ctaLabel={translations.en.ctaLabel}
      ctaHref="/cms/modules/votecast/polls"
      translations={translations}
    />
  );
}
