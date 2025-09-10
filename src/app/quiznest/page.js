"use client";

import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getModuleIcon } from "@/utils/iconMapper";

const translations = {
  en: {
    title: "Welcome to QuizNest",
    subtitle:
      "A customizable quiz experience crafted for businesses and events.",
    description:
      "This platform is designed for businesses to engage users with interactive quizzes. Create and share custom single-player quiz links where players compete within a defined time frame, with participants ranked on leaderboards by time or correct answers, featuring engaging countdowns, hints, and customizable quiz visuals.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحبًا بكم في كويزنيست",
    subtitle: "تجربة اختبار قابلة للتخصيص مصممة للشركات والفعاليات.",
    description:
      "تم تصميم هذه المنصة للشركات لإشراك المستخدمين من خلال الاختبارات التفاعلية. أنشئ وشارك روابط اختبارات فردية مخصصة حيث يتنافس اللاعبون ضمن إطار زمني محدد، مع ترتيب المشاركين في لوحات الصدارة حسب الوقت أو الإجابات الصحيحة، مع عد تنازلي تفاعلي وتلميحات وتصميم اختبارات قابل للتخصيص.",
    adminLogin: "تسجيل دخول المسؤول",
  },
};

export default function QuizNestPage() {
  const { t } = useI18nLayout(translations);

  return (
    <GeneralInfo
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      ctaText={t.adminLogin}
      ctaHref="/auth/login"
      moduleIcon={() => getModuleIcon('quiz')}
    />
  );
}