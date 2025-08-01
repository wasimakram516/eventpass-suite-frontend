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
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const gameInstructionsTranslations = {
  en: {
    welcome: "Welcome",
    instructionsTitle: "Here's what you need to know",
    questionsCount: "Number of questions:",
    quizDuration: "Quiz duration:",
    seconds: "seconds",
    startButton: "Get Ready",
    player1: "Player 1",
    player2: "Player 2",
  },
  ar: {
    welcome: "أهلاً بك",
    instructionsTitle: "هذا ما تحتاج معرفته",
    questionsCount: "عدد الأسئلة:",
    quizDuration: "مدة الإختبار:",
    seconds: "ثانية",
    startButton: "استعد",
    player1: "اللاعب الأول",
    player2: "اللاعب الثاني",
  },
};

export default function InstructionsPage() {
  const router = useRouter();
  const { game, loading } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const { t, dir, align, language } = useI18nLayout(
    gameInstructionsTranslations
  );

  useEffect(() => {
    const stored = sessionStorage.getItem("selectedPlayer");
    if (stored === "p1" || stored === "p2") {
      setSelectedPlayer(stored);
    }
  }, []);

  const handleStart = () => {
    router.push(`/eventduel/${game.slug}/play`);
  };

  if (loading || !game || !selectedPlayer) {
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
        <IconButton
          onClick={() => router.push(`/eventduel/${game.slug}`)}
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
      >
        <IconButton
          onClick={() => router.push(`/eventduel/${game.slug}`)}
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
          dir={dir}
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
            sx={{
              mb: 3,
              color: "primary.main",
              textTransform: "capitalize",
              fontSize: (() => {
                const titleLength = game.title?.length || 0;
                if (titleLength <= 20) {
                  return { xs: "2rem", sm: "2.5rem", md: "3rem" };
                } else if (titleLength <= 40) {
                  return { xs: "1.5rem", sm: "2rem", md: "2.5rem" };
                } else if (titleLength <= 60) {
                  return { xs: "1.25rem", sm: "1.75rem", md: "2rem" };
                } else {
                  return { xs: "1rem", sm: "1.5rem", md: "1.75rem" };
                }
              })(),
              lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
              wordBreak: "break-word",
              overflowWrap: "break-word",
              fontWeight: "bold",
            }}
          >
            {game.title}
          </Typography>

          <Box dir={dir} sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontSize: (() => {
                  const welcomeLength = t.welcome?.length || 0;
                  if (welcomeLength <= 10) {
                    return { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" };
                  } else if (welcomeLength <= 20) {
                    return { xs: "1rem", sm: "1.25rem", md: "1.5rem" };
                  } else {
                    return { xs: "0.875rem", sm: "1.125rem", md: "1.25rem" };
                  }
                })(),
                lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {t.welcome}
            </Typography>

            <Typography
              variant="h3"
              fontWeight={700}
              gutterBottom
              sx={{
                fontSize: (() => {
                  const playerText =
                    selectedPlayer === "p1" ? t.player1 : t.player2;
                  const playerLength = playerText?.length || 0;
                  if (playerLength <= 15) {
                    return { xs: "1.5rem", sm: "2rem", md: "2.5rem" };
                  } else if (playerLength <= 25) {
                    return { xs: "1.25rem", sm: "1.75rem", md: "2rem" };
                  } else {
                    return { xs: "1rem", sm: "1.5rem", md: "1.75rem" };
                  }
                })(),
                lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {selectedPlayer === "p1" ? t.player1 : t.player2}
            </Typography>

            <Typography
              variant="h6"
              sx={{
                fontSize: (() => {
                  const instructionsLength = t.instructionsTitle?.length || 0;
                  if (instructionsLength <= 30) {
                    return { xs: "1rem", sm: "1.25rem", md: "1.5rem" };
                  } else if (instructionsLength <= 50) {
                    return { xs: "0.875rem", sm: "1.125rem", md: "1.25rem" };
                  } else {
                    return { xs: "0.75rem", sm: "1rem", md: "1.125rem" };
                  }
                })(),
                lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {t.instructionsTitle}
            </Typography>
          </Box>

          <Stack spacing={2} sx={{ mb: 4 }} alignItems={align}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <QuizIcon color="primary" />
              <Typography
                variant="h5"
                sx={{
                  fontSize: (() => {
                    const questionsText = `${t.questionsCount} ${game.questions.length}`;
                    const questionsLength = questionsText?.length || 0;
                    if (questionsLength <= 25) {
                      return { xs: "1rem", sm: "1.25rem", md: "1.5rem" };
                    } else if (questionsLength <= 40) {
                      return { xs: "0.875rem", sm: "1.125rem", md: "1.25rem" };
                    } else {
                      return { xs: "0.75rem", sm: "1rem", md: "1.125rem" };
                    }
                  })(),
                  lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {t.questionsCount}{" "}
                <Box component="span" fontWeight={600}>
                  {game.questions.length}
                </Box>
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TimerIcon color="primary" />
              <Typography
                variant="h5"
                sx={{
                  fontSize: (() => {
                    const durationText = `${t.quizDuration} ${game.gameSessionTimer} ${t.seconds}`;
                    const durationLength = durationText?.length || 0;
                    if (durationLength <= 30) {
                      return { xs: "1rem", sm: "1.25rem", md: "1.5rem" };
                    } else if (durationLength <= 50) {
                      return { xs: "0.875rem", sm: "1.125rem", md: "1.25rem" };
                    } else {
                      return { xs: "0.75rem", sm: "1rem", md: "1.125rem" };
                    }
                  })(),
                  lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {t.quizDuration}{" "}
                <Box component="span" fontWeight={600}>
                  {game.gameSessionTimer} {t.seconds}
                </Box>
              </Typography>
            </Stack>
          </Stack>

          <Button
            variant="contained"
            size="large"
            onClick={handleStart}
            startIcon={<ICONS.next />}
            sx={{
              ...getStartIconSpacing(dir),
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {t.startButton}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
