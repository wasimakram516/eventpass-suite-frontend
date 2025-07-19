import ModuleLandingPage from "@/components/ModuleLandingPage";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "Mosaic Wall",
    features: [
      "Create interactive wall configurations with mosaic or card mode.",
      "Easily generate and scan QR codes to access the photo capture page.",
      "Users can click and submit photos from their own devices.",
      "All submitted photos appear live on the big screen mosaic.",
    ],
    ctaLabel: "Manage Uploads",
  },
  ar: {
    title: "VoteCast – استطلاعات الجمهور",
    features: [
      "أنشئ جدارًا تفاعليًا بوضع الفسيفساء أو البطاقات.",
      "أنشئ رمز QR وامسحه للدخول إلى صفحة التقاط الصور.",
      "يمكن للمستخدمين التقاط صورهم وإرسالها بسهولة.",
      "تُعرض جميع الصور المرسلة مباشرةً على الشاشة الكبيرة.",
    ],
    ctaLabel: "إدارة الوسائط المرفوعة",
  },
};

export default function VoteCastHome() {
  return (
    <ModuleLandingPage
      moduleIcon={ICONS.image}
      ctaLabel={translations.en.ctaLabel}
      ctaHref="/cms/modules/mosaicwall/walls"
      translations={translations}
    />
  );
}
