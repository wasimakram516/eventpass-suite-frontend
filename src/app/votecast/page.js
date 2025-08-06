"use client";

import { Poll as PollIcon } from "@mui/icons-material";
import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    title: "Welcome to VoteCast",
    subtitle:
      "A collaborative voting platform designed for business decision-making and feedback.",
    description:
      "This platform enables businesses to ask questions and gather votes from other businesses. Submit your questions, cast your votes, and view real-time results on full-screen displays.",
    adminLogin: "Business Login",
  },
  ar: {
    title: "مرحبًا بكم في فوتكاست",
    subtitle: "منصة تصويت تعاونية مصممة لاتخاذ القرارات التجارية والتغذية الراجعة.",
    description:
      "تمكّن هذه المنصة الشركات من طرح الأسئلة وجمع الأصوات من الشركات الأخرى. اطرح أسئلتك، امنح أصواتك، وشاهد النتائج المباشرة على شاشات العرض الكاملة.",
    adminLogin: "تسجيل دخول الشركة",
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
      moduleIcon={PollIcon}
    />
  );
}
