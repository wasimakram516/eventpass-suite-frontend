"use client";

import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useGame } from "@/contexts/GameContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinGame } from "@/services/quiznest/playerService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
const entryDialogTranslations = {
  en: {
    nameLabel: "Name",
    companyLabel: "Company",
    startButton: "Start",
  },
  ar: {
    nameLabel: "الاسم",
    companyLabel: "اسم الشركة",
    startButton: "ابدأ",
  },
};
export default function NamePage() {
  const { game, loading } = useGame();
  const router = useRouter();
  const { t, dir, align, language } = useI18nLayout(entryDialogTranslations);
  const [form, setForm] = useState({ name: "", company: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name.trim() || submitting) return;

    try {
      setSubmitting(true);
      const response = await joinGame(game._id, form);

      // Store for later use
      localStorage.setItem("playerInfo", JSON.stringify(form));
      localStorage.setItem("playerId", response.playerId);

      router.push(`/quiznest/game/${game.slug}/instructions`);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
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
    <Box sx={{ position: "relative" }}>
      <LanguageSelector />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          backgroundImage: `url(${game.nameImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          position: "absolute",
          px: 2,
        }}
      >
        {/* Back Button */}
        <IconButton
          onClick={() => router.push(`/game/${game.slug}`)}
          sx={{
            position: "fixed",
            top: 20,
            left: 20,
            bgcolor: "primary.main",
            color: "white",
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 4 },
            width: "100%",
            maxWidth: 500,
            textAlign: "center",
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255,255,255,0.6)",
            borderRadius: 6,
            mt: { xs: 10, sm: "15vh" },
            mx: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          <Typography
            variant="h1"
            gutterBottom
            sx={{ mb: 4, color: "primary.main" }}
          >
            {game.title}
          </Typography>

          <TextField
            label={entryDialogTranslations[language].nameLabel}
            fullWidth
            required
            sx={{
              mb: 3,
              "& .MuiInputBase-root": {
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.8)",
              },
            }}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          {/* <TextField
            label={entryDialogTranslations[language].companyLabel}
            fullWidth
            sx={{
              mb: 3,
              "& .MuiInputBase-root": {
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.8)",
              },
            }}
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          /> */}

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              px: 6,
              py: 1.5,
              fontSize: "1.25rem",
              fontWeight: 600,
              borderRadius: 8,
              textTransform: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.3)",
              },
            }}
          >
            {submitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              entryDialogTranslations[language].startButton
            )}
          </Button>

          {error && (
            <Typography variant="caption" color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
