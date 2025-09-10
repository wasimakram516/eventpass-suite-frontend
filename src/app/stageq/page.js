"use client";

import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getModuleIcon } from "@/utils/iconMapper";

const translations = {
  en: {
    title: "Welcome to StageQ",
    subtitle:
      "Interactive audience engagement for presentations and events.",
    description:
      "This platform allows you to share your business link or QR code with your audience for instant engagement. Audience members can scan the QR to submit new questions or vote on existing ones, with all questions displayed live on the big screen during your presentation, creating interactive sessions where your audience drives the conversation.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحبًا بكم في StageQ",
    subtitle: "تفاعل تفاعلي مع الجمهور للعروض التقديمية والفعاليات.",
    description:
      "تتيح هذه المنصة مشاركة رابط عملك أو رمز QR مع الجمهور للتفاعل الفوري. يمكن لأفراد الجمهور مسح الرمز لإرسال أسئلة جديدة أو التصويت على الأسئلة الموجودة، مع عرض جميع الأسئلة مباشرة على الشاشة الكبيرة أثناء عرضك التقديمي، مما يخلق جلسات تفاعلية حيث يقود الجمهور المحادثة.",
    adminLogin: "تسجيل دخول المسؤول",
  },
};

export default function StageQPage() {
  const { t } = useI18nLayout(translations);

  return (
    <GeneralInfo
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      ctaText={t.adminLogin}
      ctaHref="/auth/login"
      moduleIcon={() => getModuleIcon('forum')}
    />
  );
}