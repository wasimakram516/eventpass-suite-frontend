"use client";

import { Box, Typography, Button, CircularProgress, Paper, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useGame } from "@/contexts/GameContext";
import CrossZeroFloatingControls from "@/components/crosszero/CrossZeroFloatingControls";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import useCrossZeroWebSocketData from "@/hooks/modules/crosszero/useCrossZeroWebSocketData";
import { startGameSession } from "@/services/crosszero/gameSessionService";
import { useState } from "react";

const translations = {
  en: {
    playAI: "Play vs AI",
    startPvP: "Start Game",
    aiMode: "Solo vs AI",
    pvpMode: "Multiplayer · 1v1",
    loading: "Loading...",
  },
  ar: {
    playAI: "العب ضد الذكاء الاصطناعي",
    startPvP: "ابدأ اللعبة",
    aiMode: "فردي · ضد الذكاء الاصطناعي",
    pvpMode: "متعدد اللاعبين · ١ مقابل ١",
    loading: "جارٍ التحميل...",
  },
};

export default function CrossZeroLobby() {
  const { game, loading } = useGame();
  const router = useRouter();
  const { t, dir } = useI18nLayout(translations);
  const { sessions, requestAllSessions } = useCrossZeroWebSocketData(game?.slug);
  const [starting, setStarting] = useState(false);

  const handleAI = () => {
    router.replace(`/crosszero/${game.slug}/name`);
  };

  const handlePvP = async () => {
    if (!game?.slug || starting) return;

    // Single screen mode: go directly to play page — onboarding happens there
    if (game.pvpScreenMode === "single") {
      router.replace(`/crosszero/${game.slug}/play`);
      return;
    }

    // Dual screen mode: create session then send player to join page
    const alreadyPending = sessions?.some((s) => s.status === "pending");
    if (alreadyPending) {
      router.replace(`/crosszero/${game.slug}/player`);
      return;
    }
    try {
      setStarting(true);
      await startGameSession(game.slug);
      await requestAllSessions?.();
      router.replace(`/crosszero/${game.slug}/player`);
    } finally {
      setStarting(false);
    }
  };

  if (loading || !game) {
    return (
      <Box sx={{ height: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <CrossZeroFloatingControls top={20} right={20} />
      <Box
        dir={dir}
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
            p: { xs: 3, sm: 5 },
            maxWidth: 480,
            width: "100%",
            backdropFilter: "blur(16px)",
            backgroundColor: (theme) =>
              alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.88 : 0.92),
            borderRadius: 6,
            border: "1px solid",
            borderColor: "divider",
           boxShadow: (theme) => theme.palette.shadow.paper,
          }}
        >
          {/* X O decorative */}
          <Stack
            direction="row"
            spacing={2}
            sx={{
              justifyContent: "center",
              mb: 2
            }}>
            {game.xImage ? (
              <Box component="img" src={game.xImage} alt="X" sx={{ width: 48, height: 48, objectFit: "contain", filter: (theme) => `drop-shadow(0 0 10px ${alpha(theme.palette.primary.main, 0.7)})` }} />
            ) : (
              <Typography sx={{ fontSize: "2.5rem", fontWeight: 900, color: "primary.main", textShadow: (theme) => `0 0 20px ${alpha(theme.palette.primary.main, 0.8)}`, lineHeight: 1 }}>✕</Typography>
            )}
            {game.oImage ? (
              <Box component="img" src={game.oImage} alt="O" sx={{ width: 48, height: 48, objectFit: "contain", filter: (theme) => `drop-shadow(0 0 10px ${alpha(theme.palette.error.main, 0.7)})` }} />
            ) : (
              <Typography sx={{ fontSize: "2.5rem", fontWeight: 900, color: "error.main", textShadow: (theme) => `0 0 20px ${alpha(theme.palette.error.main, 0.8)}`, lineHeight: 1 }}>○</Typography>
            )}
          </Stack>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "text.primary",
              mb: 0.5,
              letterSpacing: 1
            }}>
            {game.title}
          </Typography>

          <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
            {game.mode === "solo" ? t.aiMode : t.pvpMode}
          </Typography>

          {game.mode === "solo" ? (
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleAI}
              startIcon={<ICONS.play />}
              sx={{
                ...getStartIconSpacing(dir),
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 700,
                bgcolor: "primary.main",
                boxShadow: (theme) => theme.palette.shadow.button,
              }}
            >
              {t.playAI}
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handlePvP}
              disabled={starting}
              startIcon={starting ? null : <ICONS.play />}
              sx={{
                ...getStartIconSpacing(dir),
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 700,
                bgcolor: "error.main",
                boxShadow: (theme) => theme.palette.shadow.button,
                "&:hover": { bgcolor: "error.dark" },
              }}
            >
              {starting ? <CircularProgress size={22} color="inherit" /> : t.startPvP}
            </Button>
          )}
        </Paper>
      </Box>
    </>
  );
}
