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
import useI18nLayout from "@/hooks/useI18nLayout";
import LanguageSelector from "@/components/LanguageSelector";
const gameStartTranslations = {
  en: {
    startButton: "Start Game",
  },
  ar: {
    startButton: "بدء اللعبة",
  },
};
export default function GameHomePage() {
  const { game, loading } = useGame();
  const router = useRouter();
  const { t, dir, align } = useI18nLayout(gameStartTranslations);

  const handleStart = () => {
    router.push(`/quiznest/${game.slug}/name`);
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
          backgroundColor: "background.default",
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
          backgroundImage: `url(${game.coverImage})`,
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
          sx={(theme) => ({
            textAlign: "center",
            p: { xs: 3, sm: 4 },
            maxWidth: 800,
            width: "100%",
            backdropFilter: "blur(16px)",
            backgroundColor: theme.palette.quiznest.glassBg,
            borderRadius: 6,
            border: `1px solid ${theme.palette.quiznest.glassBorder}`,
            boxShadow: theme.palette.quiznest.dialogShadow,
          })}
        >
          <Typography
            variant="h3"
            gutterBottom
            sx={(theme) => ({
              fontWeight: 800,
              mb: 3,
              color: theme.palette.common.white,
              textTransform: "capitalize",
              wordBreak: "break-word",
            })}
          >
            {game.title}
          </Typography>

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleStart}
            sx={(theme) => ({
              py: 1.2,
              borderRadius: 999,
              fontWeight: 800,
              bgcolor: theme.palette.quiznest.accent,
              color: theme.palette.common.black,
              "&:hover": { filter: "brightness(1.15)", bgcolor: theme.palette.quiznest.accent },
            })}
          >
            {t.startButton}
          </Button>
        </Paper>
      </Box>
      <LanguageSelector top={20} right={20} />
    </Box>
  );
}
