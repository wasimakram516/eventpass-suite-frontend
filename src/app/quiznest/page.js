"use client";

import { Quiz as QuizIcon } from "@mui/icons-material";
import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    title: "Welcome to QuizNest",
    subtitle:
      "A customizable quiz experience crafted for businesses and events.",
    description:
      "This platform is designed for businesses to engage users with interactive quizzes. If you're a player, your admin will provide you with a game link to get started.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحبًا بكم في كويزنيست",
    subtitle: "تجربة اختبار قابلة للتخصيص مصممة للشركات والفعاليات.",
    description:
      "تم تصميم هذه المنصة للشركات لإشراك المستخدمين من خلال الاختبارات التفاعلية. إذا كنت لاعبًا، فسيزودك المسؤول برابط اللعبة للبدء.",
    adminLogin: "تسجيل دخول المسؤول",
  },
};

export default function HomePage() {
  const { t } = useI18nLayout(translations);

  return (
    <GeneralInfo
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      ctaText={t.adminLogin}
      ctaHref="/auth/login"
      moduleIcon={QuizIcon}
    />
  );
}
