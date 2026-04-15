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
    const stored = sessionStorage.getItem("playerInfo");
    if (stored) setPlayerInfo(JSON.parse(stored));
  }, []);

  const handleStart = () => {
    router.push(`/quiznest/${game.slug}/play`);
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
      <LanguageSelector top={20} right={20} />
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
        dir={dir}
      >
        <IconButton
          onClick={() => router.push(`/quiznest/${game.slug}`)}
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
          elevation={8}
          dir={dir}
          sx={{
            p: { xs: 3, sm: 4 },
            maxWidth: 800,
            width: "100%",
            textAlign: "center",
            backdropFilter: "blur(16px)",
            backgroundColor: "rgba(10,10,20,0.85)",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          }}
        >
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ mb: 0.5, color: "#fff", textTransform: "capitalize", wordBreak: "break-word" }}
          >
            {game.title}
          </Typography>

          <Typography sx={{ color: "rgba(255,255,255,0.75)", mb: 4, fontSize: "1rem" }}>
            {gameInstructionsTranslations[language].welcome}{" "}
            <Box component="span" fontWeight={700} sx={{ color: "#00e5ff" }}>
              {playerInfo.name}
            </Box>
            {" — "}{gameInstructionsTranslations[language].instructionsTitle}
          </Typography>

          <Stack spacing={2} sx={{ mb: 4 }} alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1.5}
              sx={{ px: 2, py: 1.5, borderRadius: 3, bgcolor: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", width: "100%" }}>
              <TimerIcon sx={{ color: "#00e5ff" }} />
              <Typography sx={{ color: "#fff", fontSize: "1rem", textAlign: align, direction: dir }}>
                {gameInstructionsTranslations[language].quizDuration}{" "}
                <Box component="span" fontWeight={700} sx={{ color: "#00e5ff" }}>
                  {game.gameSessionTimer}{" "}
                  {gameInstructionsTranslations[language].seconds}
                </Box>
              </Typography>
            </Stack>
          </Stack>

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleStart}
            sx={{
              py: 1.2,
              borderRadius: 999,
              fontWeight: 800,
              bgcolor: "#00e5ff",
              color: "#000",
              "&:hover": { filter: "brightness(1.15)", bgcolor: "#00e5ff" },
            }}
          >
            {gameInstructionsTranslations[language].startButton}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
