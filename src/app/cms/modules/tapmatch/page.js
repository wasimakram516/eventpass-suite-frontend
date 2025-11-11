import ModuleLandingPage from "@/components/ModuleLandingPage";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "TapMatch – Memory Matching Game",
    features: [
      "Create and manage interactive card-matching games.",
      "Upload custom images and backgrounds directly from the CMS.",
      "Players flip and match identical cards in the shortest time.",
      "Track moves, accuracy, and completion times on leaderboards.",
    ],
    ctaLabel: "Manage TapMatch Games",
  },
  ar: {
    title: "TapMatch – لعبة مطابقة البطاقات",
    features: [
      "أنشئ وأدرِ ألعاب مطابقة البطاقات التفاعلية.",
      "قم برفع صور وخلفيات مخصصة مباشرة من لوحة التحكم.",
      "يقوم اللاعبون بقلب البطاقات لمطابقة الصور المتشابهة بأسرع وقت.",
      "تتبع الحركات، الدقة، وأوقات الإنهاء في لوحات الصدارة.",
    ],
    ctaLabel: "إدارة ألعاب TapMatch",
  },
};

export default function TapMatchHome() {
  return (
    <ModuleLandingPage
      moduleIcon={ICONS.grid} 
      ctaLabel={translations.en.ctaLabel}
      ctaHref="/cms/modules/tapmatch/games"
      translations={translations}
    />
  );
}
