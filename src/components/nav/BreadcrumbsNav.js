"use client";

import { Breadcrumbs, Link, Box } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

import ICONS from "@/utils/iconUtil";
import { capitalize } from "@/utils/stringUtil";
import { useLanguage } from "@/contexts/LanguageContext";

const segmentMap = {
  dashboard: {
    en: "Dashboard",
    ar: "لوحة التحكم",
    icon: <ICONS.home fontSize="small" />,
  },
  whatsapp: {
    en: "WhatsApp",
    ar: "واتساب",
    icon: <ICONS.whatsapp fontSize="small" sx={{ mr: 0.5 }} />,
  },
  logs: {
    en: "Logs",
    ar: "السجلات",
    icon: <ICONS.history fontSize="small" sx={{ mr: 0.5 }} />,
  },
  payments: {
    en: "Payments",
    ar: "المدفوعات",
    icon: <ICONS.payment fontSize="small" sx={{ mr: 0.5 }} />,
  },
  inbox: {
    en: "Inbox",
    ar: "صندوق الوارد",
    icon: <ICONS.chat fontSize="small" sx={{ mr: 0.5 }} />,
  },
  downloads: {
    en: "Manage Files",
    ar: "إدارة الملفات",
    icon: <ICONS.cloud fontSize="small" sx={{ mr: 0.5 }} />,
  },
  "global-search": {
    en: "Global Search",
    ar: "بحث عام",
    icon: <ICONS.search fontSize="small" sx={{ mr: 0.5 }} />,
  },
  businesses: {
    en: "Businesses",
    ar: "الشركات",
    icon: <ICONS.business fontSize="small" sx={{ mr: 0.5 }} />,
  },
  insights: {
    en: "Intelligent Insights",
    ar: "التحليلات",
    icon: <ICONS.insights fontSize="small" sx={{ mr: 0.5 }} />,
  },
  polls: {
    en: "Polls",
    ar: "الاستفتاءات",
    icon: <ICONS.poll fontSize="small" sx={{ mr: 0.5 }} />,
  },
  manage: {
    en: "Manage Polls",
    ar: "إدارة الاستفتاءات",
    icon: <ICONS.poll fontSize="small" sx={{ mr: 0.5 }} />,
  },
  results: {
    en: "Results",
    ar: "النتائج",
    icon: <ICONS.results fontSize="small" sx={{ mr: 0.5 }} />,
  },
  users: {
    en: "Users",
    ar: "المستخدمين",
    icon: <ICONS.peopleAlt fontSize="small" sx={{ mr: 0.5 }} />,
  },
  games: {
    en: "Games",
    ar: "الألعاب",
    icon: <ICONS.games fontSize="small" sx={{ mr: 0.5 }} />,
  },
  questions: {
    en: "All Questions",
    ar: "جميع الأسئلة",
    icon: <ICONS.forum fontSize="small" sx={{ mr: 0.5 }} />,
  },
  queries: {
    en: "Queries",
    ar: "الاستفسارات",
    icon: <ICONS.info fontSize="small" sx={{ mr: 0.5 }} />,
  },
  "share-link": {
    en: "Share Link",
    ar: "رابط المشاركة",
    icon: <ICONS.share fontSize="small" sx={{ mr: 0.5 }} />,
  },
  visitors: {
    en: "Visitors",
    ar: "الزوار",
    icon: <ICONS.people fontSize="small" sx={{ mr: 0.5 }} />,
  },

  // CMS Modules
  modules: {
    en: "Modules",
    ar: "الوحدات",
    icon: <ICONS.module fontSize="small" sx={{ mr: 0.5 }} />,
  },

  quiznest: {
    en: "QuizNest",
    ar: "كويز نيست",
    icon: <ICONS.quiz fontSize="small" sx={{ mr: 0.5 }} />,
  },
  eventduel: {
    en: "EventDuel",
    ar: "مباراة الفعاليات",
    icon: <ICONS.games fontSize="small" sx={{ mr: 0.5 }} />,
  },
  tapmatch: {
    en: "TapMatch",
    ar: "تاب ماتش",
    icon: <ICONS.grid fontSize="small" sx={{ mr: 0.5 }} />,
  },
  votecast: {
    en: "VoteCast",
    ar: "التصويت",
    icon: <ICONS.poll fontSize="small" sx={{ mr: 0.5 }} />,
  },
  crosszero: {
    en: "CrossZero",
    ar: "تقاطع وصفر",
    icon: <ICONS.grid fontSize="small" sx={{ mr: 0.5 }} />,
  },
  stageq: {
    en: "StageQ",
    ar: "ستيج كيو",
    icon: <ICONS.forum fontSize="small" sx={{ mr: 0.5 }} />,
  },
  memorywall: {
    en: "MemoryWall",
    ar: "جدار الذكريات",
    icon: <ICONS.image fontSize="small" sx={{ mr: 0.5 }} />,
  },
  eventreg: {
    en: "Event Reg",
    ar: "تسجيل الفعالية",
    icon: <ICONS.assignment fontSize="small" sx={{ mr: 0.5 }} />,
  },
  checkin: {
    en: "Check-In",
    ar: "تسجيل الدخول",
    icon: <ICONS.checkin fontSize="small" sx={{ mr: 0.5 }} />,
  },
  eventwheel: {
    en: "Event Wheel",
    ar: "عجلة الفعالية",
    icon: <ICONS.trophy fontSize="small" sx={{ mr: 0.5 }} />,
  },
  surveyguru: {
    en: "SurveyGuru",
    ar: "استطلاعات",
    icon: <ICONS.email fontSize="small" sx={{ mr: 0.5 }} />,
  },
  digipass: {
    en: "DigiPass",
    ar: "بطاقة رقمية",
    icon: <ICONS.badge fontSize="small" sx={{ mr: 0.5 }} />,
  },

  // Staff pages
  verify: {
    en: "Verify",
    ar: "تحقق",
    icon: <ICONS.checkCircle fontSize="small" sx={{ mr: 0.5 }} />,
  },

  // Sub pages
  events: {
    en: "Events",
    ar: "الفعاليات",
    icon: <ICONS.event fontSize="small" sx={{ mr: 0.5 }} />,
  },
  registrations: {
    en: "Registrations",
    ar: "التسجيلات",
    icon: <ICONS.appRegister fontSize="small" sx={{ mr: 0.5 }} />,
  },
  walls: {
    en: "Media Walls",
    ar: "جدران الوسائط",
    icon: <ICONS.cast fontSize="small" sx={{ mr: 0.5 }} />,
  },
  uploads: {
    en: "Media Uploads",
    ar: "رفع الوسائط",
    icon: <ICONS.upload fontSize="small" sx={{ mr: 0.5 }} />,
  },
  host: {
    en: "Host",
    ar: "الاستضافة",
    icon: <ICONS.adminPanel fontSize="small" sx={{ mr: 0.5 }} />,
  },
  sessions: {
    en: "Sessions",
    ar: "الجلسات",
    icon: <ICONS.leaderboard fontSize="small" sx={{ mr: 0.5 }} />,
  },
  surveys: {
    en: "Surveys",
    ar: "الاستبيانات",
    icon: <ICONS.email fontSize="small" sx={{ mr: 0.5 }} />,
  },
  forms: {
    en: "Surveys Forms",
    ar: "نماذج الاستبيانات",
    icon: <ICONS.form fontSize="small" sx={{ mr: 0.5 }} />,
  },
  recipients: {
    en: "Survey Recipients",
    ar: "مستلمي الاستبيان",
    icon: <ICONS.people fontSize="small" sx={{ mr: 0.5 }} />,
  },
  responses: {
    en: "Survey Responses",
    ar: "إجابات الاستبيان",
    icon: <ICONS.results fontSize="small" sx={{ mr: 0.5 }} />,
  },
  trash: {
    en: "Recycle Bin",
    ar: "سلة المحذوفات",
    icon: <ICONS.delete fontSize="small" sx={{ mr: 0.5 }} />,
  },
  settings: {
    en: "Settings",
    ar: "الإعدادات",
    icon: <ICONS.settings fontSize="small" />,
  },
  participants: {
    en: "Participants",
    ar: "المشاركون",
    icon: <ICONS.people fontSize="small" />,
  },
  wheels: {
    en: "Wheels",
    ar: "العجلات",
    icon: <ICONS.trophy fontSize="small" />,
  },
  configs: {
    en: "Configurations",
    ar: "التكوينات",
    icon: <ICONS.settings fontSize="small" sx={{ mr: 0.5 }} />,
  },
};

const formatSegment = (seg, lang, dir) => {
  if (segmentMap[seg]) {
    const { icon, en, ar } = segmentMap[seg];
    const label = lang === "ar" ? ar : en;
    return (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Box sx={{ display: "flex", mr: dir === "rtl" ? 0 : 0.5, ml: dir === "rtl" ? 0.5 : 0 }}>
          {icon}
        </Box>
        <span>{label}</span>
      </Box>
    );
  }
  return capitalize(seg.replace(/-/g, " "));
};

export default function BreadcrumbsNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage() || {};
  const lang = language === "ar" ? "ar" : "en";
  const dir = language === "ar" ? "rtl" : "ltr";

  const isStaffPath = pathname.startsWith("/staff");
  const basePath = isStaffPath ? "/staff" : "/cms";
  const baseLabel = lang === "ar"
    ? (isStaffPath ? "الوحدات" : "لوحة التحكم")
    : (isStaffPath ? "Modules" : "Dashboard");
  const filterSeg = isStaffPath ? "staff" : "cms";

  if (isStaffPath && pathname === "/staff") {
    return null;
  }

  const segments = pathname.split("/").filter((seg) => seg && seg !== filterSeg && seg !== "");

  const paths = segments.map((seg, i) => {
    if (isStaffPath && i === 0 && segments.length > 1 && segments[1] === "verify") {
      return {
        segment: seg,
        href: basePath,
      };
    }
    // Dynamic slugs (not in segmentMap) should link to their parent path
    if (!segmentMap[seg]) {
      return {
        segment: seg,
        href: basePath + "/" + segments.slice(0, i).join("/"),
      };
    }
    return {
      segment: seg,
      href: basePath + "/" + segments.slice(0, i + 1).join("/"),
    };
  });

  return (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs separator="›" aria-label="breadcrumb">
        <Link
          underline="hover"
          color="inherit"
          href={basePath}
          onClick={(e) => {
            e.preventDefault();
            router.push(basePath);
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ICONS.home fontSize="small" sx={{ mr: dir === "rtl" ? 0 : 0.5, ml: dir === "rtl" ? 0.5 : 0 }} />
            {baseLabel}
          </Box>
        </Link>

        {paths.map((p, i) => {
          const segment = formatSegment(p.segment, lang, dir);
          const isLast = i === paths.length - 1;

          return isLast ? (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "center",
                color: "text.primary",
                fontWeight: "bold",
              }}
            >
              {segment}
            </Box>
          ) : (
            <Link
              key={i}
              underline="hover"
              color="inherit"
              href={p.href}
              onClick={(e) => {
                e.preventDefault();
                router.push(p.href);
              }}
              sx={{ display: "flex", alignItems: "center" }}
            >
              {segment}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
