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
          elevation={8}
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
            sx={{
              mb: 0.5,
              color: "#fff",
              textTransform: "capitalize",
              lineHeight: { xs: 1.2, sm: 1.3 },
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {game.title}
          </Typography>

          <Typography sx={{ color: "rgba(255,255,255,0.5)", mb: 3, fontSize: "0.9rem", fontWeight: 600 }}>
            {playerInfo.mode === "team" || game.isTeamMode
              ? `${t.yourTeam} ${playerInfo.teamName || "—"}`
              : playerInfo.selectedPlayer === "p1" ? t.player1 : t.player2}
          </Typography>

          <Typography sx={{ color: "rgba(255,255,255,0.75)", mb: 4, fontSize: "1rem" }}>
            {t.instructionsTitle}
          </Typography>

          <Stack spacing={2} sx={{ mb: 4 }} alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1.5}
              sx={{ px: 2, py: 1.5, borderRadius: 3, bgcolor: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", width: "100%" }}>
              <TimerIcon sx={{ color: "#00e5ff" }} />
              <Typography sx={{ color: "#fff", fontSize: "1rem" }}>
                {t.quizDuration}{" "}
                <Box component="span" fontWeight={700} sx={{ color: "#00e5ff" }}>
                  {game.gameSessionTimer} {t.seconds}
                </Box>
              </Typography>
            </Stack>
          </Stack>

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleStart}
            startIcon={<ICONS.next />}
            sx={{
              ...getStartIconSpacing(dir),
              py: 1.2,
              borderRadius: 999,
              fontWeight: 800,
              bgcolor: "#00e5ff",
              color: "#000",
              "&:hover": { filter: "brightness(1.15)", bgcolor: "#00e5ff" },
            }}
          >
            {t.startButton}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
