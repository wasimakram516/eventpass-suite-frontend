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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import { translateTexts } from "@/services/translationService";

const tapMatchInstructions = {
  en: {
    welcome: "Welcome",
    instructionsTitle: "Get ready to test your memory!",
    pairsCount: "Total image pairs:",
    gameDuration: "Game duration:",
    seconds: "seconds",
    startButton: "Start Matching",
    backButton: "Back",
  },
  ar: {
    welcome: "أهلاً بك",
    instructionsTitle: "استعد لاختبار ذاكرتك!",
    pairsCount: "عدد الأزواج:",
    gameDuration: "مدة اللعبة:",
    seconds: "ثواني",
    startButton: "ابدأ المطابقة",
    backButton: "رجوع",
  },
};

export default function TapMatchInstructionsPage() {
  const router = useRouter();
  const { game, loading } = useGame();
  const [playerInfo, setPlayerInfo] = useState(null);
  const { t, dir, align, language } = useI18nLayout(tapMatchInstructions);
  const [translatedTitle, setTranslatedTitle] = useState("");

  useEffect(() => {
        const fetchTranslation = async () => {
          if (!game?.title) return;
           try {
              const result = await translateTexts([game.title], language);
              setTranslatedTitle(result[0] || game.title);
            } catch (error) {
              console.error("Translation failed:", error);
              setTranslatedTitle(game.title);
            }
        };
        fetchTranslation();
      }, [game?.title, language]);

  useEffect(() => {
    const stored = sessionStorage.getItem("playerInfo");
    if (stored) setPlayerInfo(JSON.parse(stored));
  }, []);

  const handleStart = () => {
    router.push(`/tapmatch/${game?.slug}/play`);
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
          backgroundImage: `url("${encodeURI(game?.backgroundImage)}")`,
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
          backgroundImage: `url("${encodeURI(game.backgroundImage)}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          px: 2,
        }}
        dir={dir}
      >
        {/* Back Button */}
        <IconButton
          onClick={() => router.push(`/tapmatch/${game.slug}`)}
          sx={{
            position: "fixed",
            top: 20,
            left: 20,
            bgcolor: "primary.main",
            color: "white",
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          <ICONS.back />
        </IconButton>

        {/* Instruction Card */}
        <Paper
          elevation={8}
          dir={dir}
          sx={{
            p: { xs: 3, sm: 4 },
            maxWidth: 800,
            width: "100%",
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
            gutterBottom
            sx={{ mb: 1, color: "#fff", textTransform: "capitalize", textAlign: "center", wordBreak: "break-word" }}
          >
            {translatedTitle}
          </Typography>

          <Typography
            variant="h6"
            sx={{ mb: 4, fontWeight: 500, color: "rgba(255,255,255,0.75)", textAlign: "center" }}
          >
            {t.welcome}{" "}
            <Box component="span" fontWeight={700} sx={{ color: "#00e5ff" }}>
              {playerInfo.name}
            </Box>
            , {t.instructionsTitle}
          </Typography>

          <Stack spacing={2} sx={{ mb: 4 }} alignItems={align}>
            {/* Total pairs */}
            <Stack direction="row" alignItems="center" spacing={2}
              sx={{ px: 2, py: 1.5, borderRadius: 3, bgcolor: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" }}>
              <ICONS.grid sx={{ color: "#00e5ff" }} />
              <Typography variant="h6" sx={{ color: "#fff", textAlign: align, direction: dir }}>
                {t.pairsCount}{" "}
                <Box component="span" fontWeight={700} sx={{ color: "#00e5ff" }}>
                  {game.memoryImages.length}
                </Box>
              </Typography>
            </Stack>

            {/* Game time */}
            <Stack direction="row" alignItems="center" spacing={2}
              sx={{ px: 2, py: 1.5, borderRadius: 3, bgcolor: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" }}>
              <ICONS.time sx={{ color: "#00e5ff" }} />
              <Typography variant="h6" sx={{ color: "#fff", textAlign: align, direction: dir }}>
                {t.gameDuration}{" "}
                <Box component="span" fontWeight={700} sx={{ color: "#00e5ff" }}>
                  {game.gameSessionTimer} {t.seconds}
                </Box>
              </Typography>
            </Stack>
          </Stack>

          {/* Start Button */}
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
              display: "block",
              mx: "auto",
            }}
          >
            {t.startButton}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
