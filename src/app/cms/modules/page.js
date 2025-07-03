"use client";

import { Box, Typography, Grid, Container, Divider } from "@mui/material";
import DashboardCard from "@/components/DashboardCard";
import { useLanguage } from "@/contexts/LanguageContext";

// Icons
import QuizIcon from "@mui/icons-material/Quiz";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import PollIcon from "@mui/icons-material/Poll";
import ForumIcon from "@mui/icons-material/Forum";
import ImageIcon from "@mui/icons-material/Image";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

export default function Modules() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const align = isArabic ? "right" : "left";

  const translations = {
    en: {
      title: "Modules",
      subtitle:
        "Manage all your interactive event tools in one place — quizzes, polls, audience engagement, registration, and more.",
      modules: [
        {
          title: "Quiznest",
          description: "Create and manage single-player quiz games.",
          buttonLabel: "Manage Quizzes",
        },
        {
          title: "Event Duel",
          description: "Run real-time 1v1 quiz competitions.",
          buttonLabel: "Launch Duels",
        },
        {
          title: "VoteCast",
          description: "Create and track audience polls.",
          buttonLabel: "View Polls",
        },
        {
          title: "StageQ",
          description: "Display visitor-submitted questions as bubbles.",
          buttonLabel: "Open Questions",
        },
        {
          title: "MosaicWall",
          description: "Show photo & text submissions in real time.",
          buttonLabel: "View Submissions",
        },
        {
          title: "Event Reg",
          description: "Build custom registration forms for events.",
          buttonLabel: "Manage Forms",
        },
        {
          title: "Check-In",
          description: "Track and verify guest entries.",
          buttonLabel: "Start Check-In",
        },
        {
          title: "Event Wheel",
          description: "Spin-to-win prize game for attendees.",
          buttonLabel: "Run Spin Wheel",
        },
      ],
    },
    ar: {
      title: "الوحدات",
      subtitle:
        "قم بإدارة جميع أدوات الفعاليات التفاعلية في مكان واحد — الاختبارات، الاستطلاعات، تفاعل الجمهور، التسجيل والمزيد.",
      modules: [
        {
          title: "كويز نيست",
          description: "أنشئ وأدرِ اختبارات فردية تفاعلية.",
          buttonLabel: "إدارة الاختبارات",
        },
        {
          title: "مبارزة الفعالية",
          description: "تشغيل مسابقات مباشرة بين لاعبين.",
          buttonLabel: "تشغيل المبارزات",
        },
        {
          title: "تصويت كاست",
          description: "إنشاء وتتبع استطلاعات الجمهور.",
          buttonLabel: "عرض التصويتات",
        },
        {
          title: "ستيج كيو",
          description: "عرض الأسئلة المقدمة من الزوار على الشاشة.",
          buttonLabel: "فتح الأسئلة",
        },
        {
          title: "جدار الفسيفساء",
          description: "عرض المشاركات النصية والصور في الوقت الفعلي.",
          buttonLabel: "عرض المشاركات",
        },
        {
          title: "تسجيل الفعالية",
          description: "إنشاء نماذج مخصصة لتسجيل الحضور.",
          buttonLabel: "إدارة النماذج",
        },
        {
          title: "تسجيل الدخول",
          description: "تتبع وتأكيد دخول الضيوف.",
          buttonLabel: "بدء تسجيل الدخول",
        },
        {
          title: "عجلة الجوائز",
          description: "تشغيل لعبة السحب للفوز بجوائز.",
          buttonLabel: "تشغيل العجلة",
        },
      ],
    },
  };

  const moduleRoutes = [
    "/cms/modules/quiznest",
    "/cms/modules/eventduel",
    "/cms/modules/votecast",
    "/cms/modules/stageq",
    "/cms/modules/mosaicwall",
    "/cms/modules/eventreg",
    "/cms/modules/checkin",
    "/cms/modules/eventwheel",
  ];

  const moduleColors = [
    "#0d47a1",
    "#5e35b1",
    "#00695c",
    "#ef6c00",
    "#4e342e",
    "#006064",
    "#0277bd",
    "#c62828",
  ];

  const moduleIcons = [
    <QuizIcon />,
    <SportsEsportsIcon />,
    <PollIcon />,
    <ForumIcon />,
    <ImageIcon />,
    <AssignmentIcon />,
    <HowToRegIcon />,
    <EmojiEventsIcon />,
  ];

  const { title, subtitle, modules } = translations[language];

  return (
    <Box dir={dir} sx={{ pb: 8, bgcolor: "background.default" }}>
      <Container>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" fontWeight="bold" gutterBottom textAlign={align}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign={align}>
            {subtitle}
          </Typography>
          <Divider sx={{ my: 2 }} />
        </Box>

        <Grid container spacing={3} justifyContent="center">
          {modules.map((mod, i) => (
            <DashboardCard
              key={mod.title || i}
              title={mod.title}
              description={mod.description}
              buttonLabel={mod.buttonLabel}
              icon={moduleIcons[i]}
              color={moduleColors[i]}
              route={moduleRoutes[i]}
            />
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
