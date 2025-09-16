"use client";

import GeneralInfo from "@/components/GeneralInfo";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getModuleIcon } from "@/utils/iconMapper";

const translations = {
  en: {
    title: "Welcome to Mosaic Wall",
    subtitle:
      "Create interactive photo walls for events and gatherings.",
    description:
      "This platform allows you to create interactive wall configurations with mosaic or card mode. Easily generate and scan QR codes to access the photo capture page, where users can click and submit photos from their own devices. All submitted photos appear live on the big screen mosaic.",
    adminLogin: "Admin Login",
  },
  ar: {
    title: "مرحبًا بكم في Mosaic Wall",
    subtitle: "أنشئ جدران صور تفاعلية للفعاليات والتجمعات.",
    description:
      "تتيح هذه المنصة إنشاء تكوينات جدران تفاعلية بوضع الفسيفساء أو البطاقات. أنشئ وامسح رموز QR بسهولة للوصول إلى صفحة التقاط الصور، حيث يمكن للمستخدمين النقر وإرسال صور من أجهزتهم الخاصة. تظهر جميع الصور المرسلة مباشرةً على فسيفساء الشاشة الكبيرة.",
    adminLogin: "تسجيل دخول المسؤول",
  },
};

export default function MosaicWallPage() {
  const { t } = useI18nLayout(translations);

  return (
    <GeneralInfo
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      ctaText={t.adminLogin}
      ctaHref="/auth/login"
      moduleIcon={() => getModuleIcon('image')}
    />
  );
}