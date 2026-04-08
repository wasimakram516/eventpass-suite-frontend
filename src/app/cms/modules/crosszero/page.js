import ModuleLandingPage from "@/components/ModuleLandingPage";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "CrossZero – Tic-Tac-Toe Game",
    features: [
      "Create and manage Tic-Tac-Toe games for your events.",
      "Solo mode: players challenge an AI with easy, medium, or hard difficulty.",
      "Multiplayer mode: two players compete head-to-head in real time via WebSocket.",
      "Configure per-move timers and track full session history from the CMS.",
    ],
    ctaLabel: "Manage CrossZero Games",
  },
  ar: {
    title: "CrossZero – لعبة إكس أو",
    features: [
      "أنشئ وأدرِ ألعاب إكس أو لفعالياتك.",
      "الوضع الفردي: يواجه اللاعبون ذكاءً اصطناعياً بمستويات سهل أو متوسط أو صعب.",
      "وضع اللاعبين المتعددين: يتنافس لاعبان مباشرةً في الوقت الفعلي عبر WebSocket.",
      "اضبط مؤقت كل حركة وتتبع سجل الجلسات الكامل من لوحة التحكم.",
    ],
    ctaLabel: "إدارة ألعاب CrossZero",
  },
};

export default function CrossZeroHome() {
  return (
    <ModuleLandingPage
      moduleIcon={ICONS.grid}
      ctaLabel={translations.en.ctaLabel}
      ctaHref="/cms/modules/crosszero/games"
      translations={translations}
    />
  );
}
