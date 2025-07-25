"use client";

import ModuleLandingPage from "@/components/ModuleLandingPage";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "StageQ",
    features: [
      "Share your business link or QR code with your audience for instant engagement",
      "Audience members scan the QR to submit new questions or vote on existing ones",
      "All questions are displayed live on the big screen during your presentation",
      "Create interactive sessions where your audience drives the conversation",
    ],
    ctaLabel: "Manage Event Queries",
  },
  ar: {
    title: "StageQ",
    features: [
      "شارك رابط عملك أو رمز الاستجابة السريعة مع الجمهور للتفاعل الفوري",
      "يقوم أفراد الجمهور بمسح الرمز لإرسال أسئلة جديدة أو التصويت على الأسئلة الموجودة",
      "يتم عرض جميع الأسئلة مباشرة على الشاشة الكبيرة أثناء عرضك التقديمي",
      "أنشئ جلسات تفاعلية حيث يقود الجمهور المحادثة",
    ],
    ctaLabel: " إدارة استفسارات الفعاليات",
  },
};
export default function VoteCastHome() {
  return (
    <ModuleLandingPage
      moduleIcon={ICONS.forum}
      ctaLabel={translations.en.ctaLabel}
      ctaHref="/cms/modules/stageq/queries"
      translations={translations}
    />
  );
}
