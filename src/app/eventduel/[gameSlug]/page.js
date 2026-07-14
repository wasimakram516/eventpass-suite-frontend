"use client";

import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  useTheme
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
  const theme = useTheme();
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
          backgroundColor: theme.palette.background.default,
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
            elevation={8}
            sx={{
              textAlign: "center",
              p: { xs: 3, sm: 4 },
              maxWidth: 800,
              width: "100%",
              backdropFilter: "blur(16px)",

              borderRadius: 6,
              backgroundColor: theme.palette.overlay.cardTransparent,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.palette.shadow.card,
            }}
          >
            <Typography
              variant="h3"
              gutterBottom
              sx={{
                fontWeight: 800,
                mb: 3,
                color: theme.palette.text.primary,
                textTransform: "capitalize",
                wordBreak: "break-word"
              }}>
              {game.title}
            </Typography>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleStart}
              startIcon={<ICONS.play />}
              disabled={starting}
              sx={{
                ...getStartIconSpacing(dir),
                py: 1.2,
                borderRadius: 999,
                fontWeight: 800,
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                "&:hover": {
                  filter: "brightness(1.15)",
                  bgcolor: theme.palette.primary.main,
                },
              }}
            >
              {starting ? <CircularProgress size={22} sx={{ color: theme.palette.primary.contrastText }} /> : t.startButton}
            </Button>
          </Paper>
        </Box>
      </Box>
    </>
  );
}
