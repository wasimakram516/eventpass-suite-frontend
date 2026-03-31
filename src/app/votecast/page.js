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
      "This platform allows you to participate in event polls shared by the organizer. Scan the QR code or open the link provided at the event, verify your registration if required, and cast your vote instantly. Results are displayed in real time, making every voice count.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحبًا بكم في VoteCast",
    subtitle: "أنشئ وأدر استطلاعات الجمهور للفعاليات والتعليقات.",
    description:
      "تتيح هذه المنصة المشاركة في استطلاعات الفعاليات التي يشاركها المنظم. امسح رمز QR أو افتح الرابط المقدم في الفعالية، تحقق من تسجيلك إذا لزم الأمر، وصوّت فورًا. تُعرض النتائج في الوقت الفعلي ليكون لكل صوت أثره.",
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