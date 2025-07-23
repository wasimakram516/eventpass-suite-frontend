import ModuleLandingPage from "@/components/ModuleLandingPage";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "EventDuel – PvP Quiz Battles",
    features: [
      "Host real-time PvP quiz battles for events and teams.",
      "Players join using room codes and compete head-to-head.",
      "Live scoreboards, game sessions, and duel-style gameplay.",
      "Custom branding, countdowns, and engaging player experience.",
    ],
    ctaLabel: "Manage PvP Games",
  },
  ar: {
    title: "EventDuel – معارك اختبارات مباشرة",
    features: [
      "استضف معارك اختبارات مباشرة في الوقت الفعلي للفعاليات والفرق.",
      "ينضم اللاعبون باستخدام رموز الغرف ويتنافسون وجهاً لوجه.",
      "لوحات نتائج مباشرة وجلسات لعب ونمط مبارزة مثير.",
      "تصميم مخصص وعد تنازلي وتجربة تفاعلية للاعب.",
    ],
    ctaLabel: "إدارة ألعاب PvP",
  },
};

export default function EventDuelHome() {
  return (
    <ModuleLandingPage
      moduleIcon={ICONS.games}
      ctaLabel={translations.en.ctaLabel}
      ctaHref="/cms/modules/eventduel/games"
      translations={translations}
    />
  );
}
