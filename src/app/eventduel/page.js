"use client";

import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getModuleIcon } from "@/utils/iconMapper";

const translations = {
  en: {
    title: "Welcome to EventDuel",
    subtitle:
      "Host exciting PvP quiz battles for events and teams.",
    description:
      "This platform allows you to host real-time PvP quiz battles for events and teams. Players join using room codes and compete head-to-head with live scoreboards, game sessions, and engaging duel-style gameplay with custom branding and countdowns.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحبًا بكم في EventDuel",
    subtitle: "استضف معارك اختبارات PvP مثيرة للفعاليات والفرق.",
    description:
      "تتيح هذه المنصة استضافة معارك اختبارات PvP مباشرة في الوقت الفعلي للفعاليات والفرق. ينضم اللاعبون باستخدام رموز الغرف ويتنافسون وجهاً لوجه مع لوحات نتائج مباشرة وجلسات لعب ونمط مبارزة مثير مع تصميم مخصص وعد تنازلي.",
    adminLogin: "تسجيل دخول المسؤول",
  },
};

export default function EventDuelPage() {
  const { t } = useI18nLayout(translations);

  return (
    <GeneralInfo
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      ctaText={t.adminLogin}
      ctaHref="/auth/login"
      moduleIcon={() => getModuleIcon('games')}
    />
  );
}