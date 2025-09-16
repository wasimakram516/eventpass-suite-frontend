"use client";

import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getModuleIcon } from "@/utils/iconMapper";

const translations = {
  en: {
    title: "Welcome to EventReg",
    subtitle:
      "Create and manage public event registration forms with ease.",
    description:
      "This platform allows you to create public event registration forms, share them via links or QR codes, and automatically send WhatsApp confirmation messages to participants after successful registration.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحبًا بكم في EventReg",
    subtitle: "أنشئ وأدر نماذج تسجيل الفعاليات العامة بسهولة.",
    description:
      "تتيح هذه المنصة إنشاء نماذج تسجيل فعاليات عامة ومشاركتها عبر الروابط أو رموز QR وإرسال رسائل تأكيد تلقائية عبر WhatsApp للمشاركين بعد التسجيل الناجح.",
    adminLogin: "تسجيل دخول المسؤول",
  },
};

export default function EventRegPage() {
  const { t } = useI18nLayout(translations);

  return (
    <GeneralInfo
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      ctaText={t.adminLogin}
      ctaHref="/auth/login"
      moduleIcon={() => getModuleIcon('event')}
    />
  );
}