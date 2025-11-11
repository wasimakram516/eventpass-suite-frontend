"use client";

import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getModuleIcon } from "@/utils/iconMapper";

const translations = {
  en: {
    title: "Welcome to TapMatch",
    subtitle: "A fun and interactive memory-matching challenge.",
    description:
      "TapMatch lets businesses and event hosts engage users through exciting card-matching games. Upload your own images, set timers, and watch participants compete to find all pairs in the fewest moves and fastest time. Perfect for boosting engagement and creating a playful experience on kiosks or web.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحبًا بكم في تـاب ماتش",
    subtitle: "تحدي الذاكرة التفاعلي والممتع.",
    description:
      "تتيح لك تـاب ماتش إشراك المستخدمين من خلال ألعاب مطابقة البطاقات الشيقة. قم برفع صورك الخاصة، وحدد المؤقتات، ودع المشاركين يتنافسون لإيجاد جميع الأزواج بأقل عدد من المحاولات وأسرع وقت. مثالية لزيادة التفاعل وخلق تجربة مرحة على الأكشاك أو الويب.",
    adminLogin: "تسجيل دخول المسؤول",
  },
};

export default function TapMatchPage() {
  const { t } = useI18nLayout(translations);

  return (
    <GeneralInfo
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      ctaText={t.adminLogin}
      ctaHref="/auth/login"
      moduleIcon={() => getModuleIcon("grid")}
    />
  );
}
