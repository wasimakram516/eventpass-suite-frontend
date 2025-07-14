"use client";

import { Box, Typography, Grid, Container } from "@mui/material";
import StatsCard from "@/components/StatsCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
import { useAuth } from "@/contexts/AuthContext";
import BusinessAlertModal from "@/components/BusinessAlertModal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllBusinesses } from "@/services/businessService";

export default function HomePage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const { globalConfig } = useGlobalConfig();

  const isArabic = language === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const align = isArabic ? "right" : "left";

  const translations = {
    en: {
      subtitle:
        "Manage all your interactive event tools in one place — quizzes, polls, audience engagement, registration, and more.",
      stats: [
        {
          title: "Quiznest",
          subtitle: "Games Played",
          centerValue: 230,
          data: [
            { name: "Active Games", value: 40 },
            { name: "Archived", value: 90 },
          ],
        },
        {
          title: "VoteCast",
          subtitle: "Poll Participation",
          centerValue: "65%",
          data: [
            { name: "Active", value: 30 },
            { name: "Archived", value: 60 },
          ],
        },
        {
          title: "StageQ",
          subtitle: "Questions Submitted",
          centerValue: 48,
          data: [
            { name: "Answered", value: 30 },
            { name: "Pending", value: 18 },
          ],
        },
        {
          title: "MosaicWall",
          subtitle: "Live Submissions",
          centerValue: 120,
          data: [
            { name: "Photos", value: 90 },
            { name: "Photos with Text", value: 30 },
          ],
        },
        {
          title: "Event Reg",
          subtitle: "Registrations Collected",
          centerValue: 340,
          data: [
            { name: "Events", value: 10 },
            { name: "Registrations", value: 70 },
          ],
        },
        {
          title: "Check-In",
          subtitle: "Guests Checked In",
          centerValue: 282,
          data: [
            { name: "Events", value: 10 },
            { name: "Check-ins", value: 70 },
          ],
        },
        {
          title: "Event Duel",
          subtitle: "Duels Played",
          centerValue: 74,
          data: [
            { name: "Total", value: 40 },
            { name: "Wins", value: 20 },
            { name: "Losses", value: 14 },
          ],
        },
        {
          title: "Event Wheel",
          subtitle: "Spins Completed",
          centerValue: 212,
          data: [{ name: "Total Spins", value: 212 }],
        },
      ],
    },

    ar: {
      subtitle:
        "قم بإدارة جميع أدوات الفعاليات التفاعلية في مكان واحد — الاختبارات، الاستطلاعات، تفاعل الجمهور، التسجيل والمزيد.",
      stats: [
        {
          title: "كويز نيست",
          subtitle: "عدد الألعاب المنفذة",
          centerValue: 230,
          data: [
            { name: "ألعاب نشطة", value: 40 },
            { name: "مؤرشفة", value: 90 },
          ],
        },
        {
          title: "تصويت كاست",
          subtitle: "مشاركة الجمهور",
          centerValue: "65%",
          data: [
            { name: "نشطة", value: 30 },
            { name: "مؤرشفة", value: 60 },
          ],
        },
        {
          title: "ستيج كيو",
          subtitle: "الأسئلة المقدمة",
          centerValue: 48,
          data: [
            { name: "تمت الإجابة", value: 30 },
            { name: "قيد الانتظار", value: 18 },
          ],
        },
        {
          title: "جدار الفسيفساء",
          subtitle: "المشاركات الحية",
          centerValue: 120,
          data: [
            { name: "صور", value: 90 },
            { name: "صور مع نص", value: 30 },
          ],
        },
        {
          title: "تسجيل الفعالية",
          subtitle: "طلبات التسجيل",
          centerValue: 340,
          data: [
            { name: "الفعاليات", value: 10 },
            { name: "التسجيلات", value: 70 },
          ],
        },
        {
          title: "تسجيل الدخول",
          subtitle: "الضيوف المسجلين",
          centerValue: 282,
          data: [
            { name: "الفعاليات", value: 10 },
            { name: "عمليات الدخول", value: 70 },
          ],
        },
        {
          title: "المبارزة",
          subtitle: "عدد المبارزات",
          centerValue: 74,
          data: [
            { name: "الإجمالي", value: 40 },
            { name: "فوز", value: 20 },
            { name: "خسارة", value: 14 },
          ],
        },
        {
          title: "عجلة الفعالية",
          subtitle: "مرات التدوير",
          centerValue: 212,
          data: [{ name: "إجمالي التدوير", value: 212 }],
        },
      ],
    },
  };

  const { subtitle, stats } = translations[language];

  useEffect(() => {
    if (user?.role === "business") {
      checkBusinessExists();
    }
  }, [user]);

  const checkBusinessExists = async () => {
    const businesses = await getAllBusinesses();
    const myBusiness = businesses.find((b) => {
      const ownerId = typeof b.owner === "string" ? b.owner : b.owner?._id;
      return ownerId === user?.id;
    });
    if (!myBusiness) {
      setShowBusinessModal(true);
    }
  };

  return (
    <Box sx={{ pb: 4, bgcolor: "background.default" }} dir={dir}>
      <Container>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h2" fontWeight="bold" gutterBottom>
            {globalConfig?.appName || "EventPass Suite"}
          </Typography>

          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>

        {/* Stat Cards */}
        <Grid container spacing={3} justifyContent="center">
          {stats.map((s, i) => (
            <Grid item xs={12} sm={6} md={4} key={i} justifyContent="center" sx={{ display: "flex", width: {xs:"100%", sm:"20rem"} }}>
              <StatsCard {...s} />
            </Grid>
          ))}
        </Grid>
      </Container>
      <BusinessAlertModal
        open={showBusinessModal}
        onClose={() => setShowBusinessModal(false)}
        onNavigate={() => {
          router.push("/cms/settings/business");
          setShowBusinessModal(false);
        }}
      />
    </Box>
  );
}
