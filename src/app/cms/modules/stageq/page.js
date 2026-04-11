"use client";

import ModuleLandingPage from "@/components/ModuleLandingPage";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "StageQ",
    features: [
      "Create Q&A sessions and link them to your event for registration-based access.",
      "Attendees verify their registration before submitting or upvoting questions.",
      "All questions are displayed live on the big screen during your presentation.",
      "Manage submitted questions in real time — mark as answered or remove as needed.",
    ],
    ctaLabel: "Manage Event Queries",
  },
  ar: {
    title: "StageQ",
    features: [
      "أنشئ جلسات أسئلة وأجوبة واربطها بفعاليتك للوصول المبني على التسجيل.",
      "يتحقق الحضور من تسجيلهم قبل إرسال الأسئلة أو التصويت عليها.",
      "تُعرض جميع الأسئلة مباشرة على الشاشة الكبيرة أثناء عرضك التقديمي.",
      "أدِر الأسئلة المقدَّمة في الوقت الفعلي — ضعها علامة مجاب عليها أو احذفها حسب الحاجة.",
    ],
    ctaLabel: "إدارة استفسارات الفعاليات",
  },
};
export default function VoteCastHome() {
  return (
    <ModuleLandingPage
      moduleIcon={ICONS.forum}
      ctaLabel={translations.en.ctaLabel}
      ctaHref="/cms/modules/stageq/sessions"
      translations={translations}
    />
  );
}
