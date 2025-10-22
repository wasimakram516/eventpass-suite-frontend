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
import GroupIcon from "@mui/icons-material/Groups";
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
    teamMember: "Team Member",
    yourTeam: "Your Team:",
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
    teamMember: "عضو الفريق",
    yourTeam: "فريقك:",
  },
};

export default function InstructionsPage() {
  const router = useRouter();
  const { game, loading } = useGame();
  const { t, dir, align } = useI18nLayout(gameInstructionsTranslations);

  const [playerInfo, setPlayerInfo] = useState({});

  useEffect(() => {
    const stored = sessionStorage.getItem("selectedPlayer");
    const playerId = sessionStorage.getItem("playerId");
    const teamId = sessionStorage.getItem("selectedTeamId");
    const teamName = sessionStorage.getItem("selectedTeamName");
    const sessionId = sessionStorage.getItem("sessionId");

    if (stored === "p1" || stored === "p2") {
      // PvP mode
      setPlayerInfo({
        mode: "pvp",
        selectedPlayer: stored,
        playerId,
        sessionId,
      });
    } else if (teamId && teamName) {
      // Team mode
      setPlayerInfo({
        mode: "team",
        playerId,
        teamId,
        teamName,
        sessionId,
      });
    }
  }, []);

  const handleStart = () => {
    router.push(`/eventduel/${game.slug}/play`);
  };

  if (loading || !game) {
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
          onClick={() => router.push(`/eventduel/${game?.slug || ""}`)}
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
            <Typography variant="h5" gutterBottom>
              {t.welcome}
            </Typography>

            {/* Player or Team Display */}
            {playerInfo.mode === "team" || game.isTeamMode ? (
              <>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  gutterBottom
                  sx={{ color: "primary.dark" }}
                >
                  {t.teamMember}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  <GroupIcon
                    sx={{ fontSize: 22, verticalAlign: "middle", mr: 1 }}
                  />
                  {t.yourTeam}{" "}
                  <Box component="span" fontWeight={700}>
                    {playerInfo.teamName || "—"}
                  </Box>
                </Typography>
              </>
            ) : (
              <Typography
                variant="h3"
                fontWeight={700}
                gutterBottom
                sx={{ color: "primary.dark" }}
              >
                {playerInfo.selectedPlayer === "p1" ? t.player1 : t.player2}
              </Typography>
            )}

            <Typography variant="h6">{t.instructionsTitle}</Typography>
          </Box>

          <Stack spacing={2} sx={{ mb: 4 }} alignItems={align}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <QuizIcon color="primary" />
              <Typography variant="h5">
                {t.questionsCount}{" "}
                <Box component="span" fontWeight={600}>
                  {game.questions.length}
                </Box>
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TimerIcon color="primary" />
              <Typography variant="h5">
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
