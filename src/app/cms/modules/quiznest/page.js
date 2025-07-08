import QuizIcon from "@mui/icons-material/Quiz";
import ModuleLandingPage from "@/components/ModuleLandingPage";

const translations = {
  en: {
    title: "Quiznest – Single Player Quizzes",
    features: [
      "Create and share custom single-player quiz links.",
      "Players compete within a defined time frame.",
      "Rank participants on leaderboards by time or correct answers.",
      "Engaging countdowns, hints, and customizable quiz visuals.",
    ],
    ctaLabel: "Manage Quiz Games",
  },
  ar: {
    title: "كويزنيست – اختبارات فردية",
    features: [
      "أنشئ وشارك روابط اختبارات فردية مخصصة.",
      "يتنافس اللاعبون ضمن إطار زمني محدد.",
      "ترتيب المشاركين في لوحات الصدارة حسب الوقت أو الإجابات الصحيحة.",
      "عد تنازلي تفاعلي وتلميحات وتصميم اختبارات قابل للتخصيص.",
    ],
    ctaLabel: "إدارة الألعاب",
  },
};

export default function QuizNestHome() {
  return (
    <ModuleLandingPage
      moduleIcon={QuizIcon}
      ctaLabel="Manage Quiz Games"
      ctaHref="/cms/modules/quiznest/games"
      translations={translations}
    />
  );
}
