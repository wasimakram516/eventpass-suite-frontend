import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ModuleLandingPage from "@/components/ModuleLandingPage";

const translations = {
  en: {
    title: "CheckIn – Employee Event Check-In",
    features: [
      "Create private check-in events for your employees.",
      "Generate links or QR codes for employee check-in.",
      "Employees check in by entering their Employee ID.",
      "Display table number and location instantly after check-in.",
    ],
    ctaLabel: "Manage CheckIn Events",
  },
  ar: {
    title: "CheckIn – فعاليات تسجيل حضور الموظفين",
    features: [
      "أنشئ فعاليات CheckIn خاصة بالموظفين.",
      "أنشئ روابط أو رموز QR لتسجيل الحضور.",
      "يقوم الموظفون بتسجيل الحضور باستخدام رقم الموظف.",
      "عرض رقم الطاولة وموقعها مباشرة بعد تسجيل الحضور.",
    ],
    ctaLabel: "إدارة فعاليات CheckIn",
  },
};

export default function CheckInHome() {
  return (
    <ModuleLandingPage
      moduleIcon={EventAvailableIcon}
      ctaLabel={translations.en.ctaLabel}
      ctaHref="/cms/modules/checkin/events"
      translations={translations}
    />
  );
}
