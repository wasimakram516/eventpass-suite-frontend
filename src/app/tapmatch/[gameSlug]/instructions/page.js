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
          elevation={6}
          sx={{
            p: { xs: 3, sm: 4 },
            maxWidth: 800,
            width: "100%",
            textAlign: align,
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255,255,255,0.6)",
            borderRadius: 6,
            mt: { xs: 10, sm: "15vh" },
            mx: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
          dir={dir}
        >
          <Typography
            variant="h3"
            gutterBottom
            sx={{ mb: 3, color: "primary.main", textTransform: "capitalize" }}
          >
            {game.title}
          </Typography>

          <Typography
            variant="h5"
            sx={{ mb: 4, fontWeight: 500, color: "text.primary" }}
          >
            {t.welcome}{" "}
            <Box component="span" fontWeight={600}>
              {playerInfo.name}
            </Box>
            , {t.instructionsTitle}
          </Typography>

          <Stack spacing={2} sx={{ mb: 4 }} alignItems={align}>
            {/* Total pairs */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                flexDirection: language === "ar" ? "row-reverse" : "row",
                justifyContent: language === "ar" ? "flex-end" : "flex-start",
              }}
            >
              <ICONS.grid color="primary" />
              <Typography
                variant="h6"
                sx={{
                  textAlign: align,
                  direction: dir,
                }}
              >
                {t.pairsCount}{" "}
                <Box component="span" fontWeight={600}>
                  {game.memoryImages.length}
                </Box>
              </Typography>
            </Stack>

            {/* Game time */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                flexDirection: language === "ar" ? "row-reverse" : "row",
                justifyContent: language === "ar" ? "flex-end" : "flex-start",
              }}
            >
              <ICONS.time color="primary" />
              <Typography
                variant="h6"
                sx={{
                  textAlign: align,
                  direction: dir,
                }}
              >
                {t.gameDuration}{" "}
                <Box component="span" fontWeight={600}>
                  {game.gameSessionTimer} {t.seconds}
                </Box>
              </Typography>
            </Stack>
          </Stack>

          {/* Start Button */}
          <Button
            variant="contained"
            size="large"
            onClick={handleStart}
            sx={{
              width: { xs: "100%", sm: "auto" },
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            {t.startButton}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
