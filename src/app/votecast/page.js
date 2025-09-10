"use client";

import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getModuleIcon } from "@/utils/iconMapper";

const translations = {
  en: {
    title: "Welcome to VoteCast",
    subtitle:
      "Create and manage audience polls for events and feedback.",
    description:
      "This platform allows you to create and share polls with the public effortlessly. Users can cast their votes anonymously without requiring login, and you can view and analyze poll results instantly. Perfect for events, booths, or real-time feedback collection.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحبًا بكم في VoteCast",
    subtitle: "أنشئ وأدر استطلاعات الجمهور للفعاليات والتعليقات.",
    description:
      "تتيح هذه المنصة إنشاء ومشاركة استطلاعات مع الجمهور بسهولة. يمكن للمستخدمين التصويت بشكل مجهول دون الحاجة لتسجيل الدخول، ويمكنك عرض وتحليل نتائج الاستطلاع فورًا. مثالية للفعاليات أو الأجنحة أو جمع التعليقات الفورية.",
    adminLogin: "تسجيل دخول المسؤول",
  },
};

export default function VoteCastPage() {
  const { t } = useI18nLayout(translations);

  return (
    <GeneralInfo
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      ctaText={t.adminLogin}
      ctaHref="/auth/login"
      moduleIcon={() => getModuleIcon('poll')}
    />
  );
}