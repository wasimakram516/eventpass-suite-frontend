"use client";

import { Box, Typography, Button, CircularProgress, Paper, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { useGame } from "@/contexts/GameContext";
import LanguageSelector from "@/components/LanguageSelector";
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
    aiMode: "Solo · vs AI",
    pvpMode: "Multiplayer · 1v1",
    loading: "Loading...",
  },
  ar: {
    playAI: "العب ضد الذكاء الاصطناعي",
    startPvP: "ابدأ اللعبة",
    aiMode: "فردي · ضد الذكاء الاصطناعي",
    pvpMode: "متعدد اللاعبين · 1 مقابل 1",
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
      <LanguageSelector top={20} right={20} />
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
          elevation={6}
          sx={{
            textAlign: "center",
            p: { xs: 3, sm: 5 },
            maxWidth: 480,
            width: "100%",
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255,255,255,0.6)",
            borderRadius: 6,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          {/* X O decorative */}
          <Stack direction="row" justifyContent="center" spacing={2} sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: "2.5rem", fontWeight: 900, color: "#00e5ff", textShadow: "0 0 20px #00e5ff" }}>✕</Typography>
            <Typography sx={{ fontSize: "2.5rem", fontWeight: 900, color: "#ff6b6b", textShadow: "0 0 20px #ff6b6b" }}>○</Typography>
          </Stack>

          <Typography variant="h4" fontWeight={800} sx={{ color: "primary.main", mb: 0.5, letterSpacing: 1 }}>
            {game.title}
          </Typography>

          <Typography variant="body2" sx={{ color: "rgba(15,23,42,0.62)", mb: 4 }}>
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
                background: "linear-gradient(135deg, #00b4d8, #0077b6)",
                boxShadow: "0 4px 20px rgba(0,180,216,0.4)",
                "&:hover": { background: "linear-gradient(135deg, #0096c7, #005f8a)" },
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
                background: "linear-gradient(135deg, #7b2ff7, #4a00e0)",
                boxShadow: "0 4px 20px rgba(123,47,247,0.4)",
                "&:hover": { background: "linear-gradient(135deg, #6a1fd6, #3900c0)" },
              }}
            >
              {starting ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : t.startPvP}
            </Button>
          )}
        </Paper>
      </Box>
    </>
  );
}
