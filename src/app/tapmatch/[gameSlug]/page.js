"use client";

import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import LanguageSelector from "@/components/LanguageSelector";
import { translateTexts } from "@/services/translationService";

const gameStartTranslations = {
  en: {
    startButton: "Start Matching",
  },
  ar: {
    startButton: "ابدأ المطابقة",
  },
};

export default function TapMatchHomePage() {
  const { game, loading } = useGame();
  const router = useRouter();
  const { t, dir, align, language } = useI18nLayout(gameStartTranslations);
  const [translatedTitle, setTranslatedTitle] = useState("");

  const handleStart = () => {
    router.push(`/tapmatch/${game.slug}/name`);
  };

  // Translate the game title dynamically
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
    <Box sx={{ position: "relative" }}>
      <Box
        sx={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `url("${encodeURI(game.coverImage)}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          px: 2,
        }}
        dir={dir}
      >
        <Paper
          elevation={8}
          dir={dir}
          sx={{
            textAlign: "center",
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
            variant="h3"
            fontWeight={800}
            gutterBottom
            sx={{ mb: 3, color: "#fff", textTransform: "capitalize", wordBreak: "break-word" }}
          >
            {translatedTitle || game.title}
          </Typography>

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
            {t.startButton}
          </Button>
        </Paper>
      </Box>

      <LanguageSelector top={20} right={20} />
    </Box>
  );
}
