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
    aiMode: "Solo vs AI",
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
          elevation={8}
          sx={{
            textAlign: "center",
            p: { xs: 3, sm: 5 },
            maxWidth: 480,
            width: "100%",
            backdropFilter: "blur(16px)",
            backgroundColor: "rgba(10,10,20,0.85)",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* X O decorative */}
          <Stack direction="row" justifyContent="center" spacing={2} sx={{ mb: 2 }}>
            {game.xImage ? (
              <Box component="img" src={game.xImage} alt="X" sx={{ width: 48, height: 48, objectFit: "contain", filter: "drop-shadow(0 0 10px #00e5ff)" }} />
            ) : (
              <Typography sx={{ fontSize: "2.5rem", fontWeight: 900, color: "#00e5ff", textShadow: "0 0 20px #00e5ff", lineHeight: 1 }}>✕</Typography>
            )}
            {game.oImage ? (
              <Box component="img" src={game.oImage} alt="O" sx={{ width: 48, height: 48, objectFit: "contain", filter: "drop-shadow(0 0 10px #ff6b6b)" }} />
            ) : (
              <Typography sx={{ fontSize: "2.5rem", fontWeight: 900, color: "#ff6b6b", textShadow: "0 0 20px #ff6b6b", lineHeight: 1 }}>○</Typography>
            )}
          </Stack>

          <Typography variant="h4" fontWeight={800} sx={{ color: "#fff", mb: 0.5, letterSpacing: 1 }}>
            {game.title}
          </Typography>

          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", mb: 4 }}>
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
