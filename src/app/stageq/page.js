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
      "This platform allows you to join a live Q&A session at your event. Scan the QR code or open the link provided by the organizer, verify your registration if required, and start submitting questions or upvoting others. Questions are displayed live on the big screen, letting your audience drive the conversation.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحبًا بكم في StageQ",
    subtitle: "تفاعل تفاعلي مع الجمهور للعروض التقديمية والفعاليات.",
    description:
      "تتيح هذه المنصة الانضمام إلى جلسة أسئلة وأجوبة مباشرة في فعاليتك. امسح رمز QR أو افتح الرابط الذي قدمه المنظم، تحقق من تسجيلك إذا لزم الأمر، وابدأ في إرسال الأسئلة أو التصويت على أسئلة الآخرين. تُعرض الأسئلة مباشرة على الشاشة الكبيرة، مما يجعل الجمهور يقود الحوار.",
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