import ModuleLandingPage from "@/components/ModuleLandingPage";
import ICONS from "@/utils/iconUtil";

const translations = {
  en: {
    title: "Memory Wall",
    features: [
      "Create interactive wall configurations with mosaic, card, or bubble mode.",
      "Easily generate and scan QR codes to access the photo capture page.",
      "Users can click and submit photos from their own devices.",
      "All submitted photos appear live on the big screen.",
    ],
    ctaLabel: "Manage Uploads",
  },
  ar: {
    title: "Memory Wall - جدار الذكريات",
    features: [
      "أنشئ جدارًا تفاعليًا بوضع الفسيفساء أو البطاقات أو الفقاعات.",
      "قم بإنشاء رمز QR ومسحه للوصول إلى صفحة التقاط الصور.",
      "يمكن للمستخدمين التقاط صورهم وإرسالها بسهولة من أجهزتهم.",
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
      ctaHref="/cms/modules/memorywall/walls"
      translations={translations}
    />
  );
}
