"use client";

import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import QuizIcon from "@mui/icons-material/Quiz";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import TimerIcon from "@mui/icons-material/Timer";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
 const gameInstructionsTranslations = {
   en: {
     welcome: "Welcome",
     instructionsTitle: "Here's what you need to know",
     questionsCount: "Number of questions:",
     quizDuration: "Quiz duration:",
     seconds: "seconds",
     startButton: "Start Game",
     backButton: "Back",
   },
   ar: {
     welcome: "أهلاً بك",
     instructionsTitle: "هذا ما تحتاج معرفته",
     questionsCount: "عدد الأسئلة:",
     quizDuration: "مدة الإختبار:",
     seconds: "ثانية",
     startButton: "ابدأ اللعبة",
     backButton: "رجوع",
   },
 };
export default function InstructionsPage() {
  const router = useRouter();
  const { game, loading } = useGame();
  const [playerInfo, setPlayerInfo] = useState(null);
 const { t, dir, align, language } = useI18nLayout(
   gameInstructionsTranslations
 );
  useEffect(() => {
    const stored = localStorage.getItem("playerInfo");
    if (stored) setPlayerInfo(JSON.parse(stored));
  }, []);

  const handleStart = () => {
    router.push(`/quiznest/game/${game.slug}/play`);
  };

  if (loading || !game || !playerInfo) {
    return (
      <Box
        sx={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `url(${game?.backgroundImage || ""})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

 
  return (
    <Box sx={{ position: "relative" }}>
      <LanguageSelector />
      <Box
        sx={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `url(${game.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          px: 2,
          position: "relative",
        }}
      >
        {/* زر العودة */}
        <IconButton
          onClick={() => router.push(`/game/${game.slug}`)}
          sx={{
            position: "fixed",
            top: 20,
            left: 20,
            bgcolor: "primary.main",
            color: "white",
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 4 },
            maxWidth: 800,
            width: "100%",
            textAlign: "center",
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255,255,255,0.6)",
            borderRadius: 6,
            mt: { xs: 10, sm: "15vh" },
            mx: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          <Typography
            variant="h1"
            gutterBottom
            sx={{ mb: 3, color: "primary.main", textTransform: "capitalize" }}
          >
            {game.title}
          </Typography>

          <Typography variant="h4" sx={{ mb: 4 }}dir={language === "ar" ? "rtl" : "ltr"}>
            {gameInstructionsTranslations[language].welcome}{" "}
            <Box component="span" fontWeight={600}>
              {playerInfo.name}
            </Box>{" "}
            {gameInstructionsTranslations[language].instructionsTitle}
          </Typography>

          <Stack
            spacing={2}
            sx={{ mb: 4 }}
            alignItems={language === "en" ? "left" : "right"}
          >
            <Stack
              direction={language === "ar" ? "row-reverse" : "row"}
              alignItems="center"
              spacing={1}
            >
              <QuizIcon color="primary" />
              <Typography variant="h5">
                {gameInstructionsTranslations[language].questionsCount}{" "}
                <Box component="span" fontWeight={600}>
                  {game.questions.length}
                </Box>
              </Typography>
            </Stack>
            <Stack
              direction={language === "ar" ? "row-reverse" : "row"}
              alignItems="center"
              spacing={1}
            >
              <TimerIcon color="primary" />
              <Typography variant="h5">
                {gameInstructionsTranslations[language].quizDuration}{" "}
                <Box component="span" fontWeight={600}>
                  {game.gameSessionTimer}{" "}
                  {gameInstructionsTranslations[language].seconds}
                </Box>
              </Typography>
            </Stack>
          </Stack>

          <Button
            variant="contained"
            size="large"
            onClick={handleStart}
            sx={{
              px: 6,
              py: 2,
              fontSize: "1.25rem",
              fontWeight: 600,
              borderRadius: 8,
              textTransform: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.3)",
              },
            }}
          >
            {gameInstructionsTranslations[language].startButton}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
