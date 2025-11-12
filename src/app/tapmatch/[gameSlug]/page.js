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
          elevation={6}
          sx={{
            textAlign: align,
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
            sx={{
              mb: 3,
              color: "primary.main",
              textTransform: "capitalize",
            }}
          >
            {translatedTitle || game.title}
          </Typography>

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleStart}
            sx={{
              fontSize: "1.1rem",
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
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
