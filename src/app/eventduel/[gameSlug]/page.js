"use client";

import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useGame } from "@/contexts/GameContext";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

import useWebSocketData from "@/hooks/modules/eventduel/useEventDuelWebSocketData";
import { startGameSession } from "@/services/eventduel/gameSessionService";
import { useState } from "react";

const gameStartTranslations = {
  en: { startButton: "Start Game" },
  ar: { startButton: "بدء اللعبة" },
};

export default function GameHomePage() {
  const { game, loading } = useGame();
  const router = useRouter();
  const { t, dir } = useI18nLayout(gameStartTranslations);

  // Grab sessions so we can detect an existing pending one
  const { sessions, requestAllSessions } = useWebSocketData(game?.slug);

  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    if (!game?.slug || starting) return;

    // 1) If a pending session already exists, skip API calls and navigate
    const alreadyPending = sessions?.some((s) => s.status === "pending");
    if (alreadyPending) {
      router.replace(`/eventduel/${game.slug}/player`);
      return;
    }

    // 2) Otherwise, create a new session, refresh, then navigate
    try {
      setStarting(true);
      await startGameSession(game.slug);
      await requestAllSessions?.(game.slug); // pass slug explicitly
      router.replace(`/eventduel/${game.slug}/player`);
    } finally {
      setStarting(false);
    }
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
          backgroundColor: "#f0f0f0",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <LanguageSelector top={20} right={20} />
      <Box dir={dir} sx={{ position: "relative" }}>
        <Box
          sx={{
            height: "100vh",
            width: "100vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: `url(${game.coverImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            px: 2,
          }}
        >
          <Paper
            elevation={6}
            sx={{
              textAlign: "center",
              p: { xs: 3, sm: 4 },
              maxWidth: 480,
              width: "100%",
              backdropFilter: "blur(10px)",
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              borderRadius: 6,
              mt: { xs: 10, sm: "15vh" },
              mx: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <Typography
              variant="h3"
              fontWeight={700}
              gutterBottom
              sx={{ mb: 3, color: "primary.main", textTransform: "capitalize" }}
            >
              {game.title}
            </Typography>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleStart}
              startIcon={<ICONS.play />}
              disabled={starting}
              sx={getStartIconSpacing(dir)}
            >
              {starting ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : t.startButton}
            </Button>
          </Paper>
        </Box>
      </Box>
    </>
  );
}
