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
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { joinGameSession } from "@/services/eventduel/gameSessionService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
const entryDialogTranslations = {
  en: {
    nameLabel: "Name",
    companyLabel: "Company",
    startButton: "Proceed",
  },
  ar: {
    nameLabel: "الاسم",
    companyLabel: "اسم الشركة",
    startButton: "متابعة",
  },
};
export default function NamePage() {
  const { game, loading } = useGame();
  const router = useRouter();
  const { t, dir, align, language } = useI18nLayout(entryDialogTranslations);
  const [form, setForm] = useState({ gameSlug: "" ,name: "", company: "", playerType: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
  if (game?.slug) {
    setForm((prev) => ({ ...prev, gameSlug: game.slug }));
  }
}, [game]);

  useEffect(() => {
    const selectedPlayer = sessionStorage.getItem("selectedPlayer");
    if (selectedPlayer) {
      setForm((prev) => ({ ...prev, playerType: selectedPlayer }));
    }
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim() || submitting) return;

    setSubmitting(true);
    const response = await joinGameSession(form);

    if (!response.error) {
      sessionStorage.setItem("playerId", response.player._id);
      sessionStorage.setItem("sessionId", response.session._id);

      router.push(`/eventduel/${game.slug}/instructions`);
    }
    setSubmitting(false);
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
      <LanguageSelector top={20} right={20} />
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
        size="small"
          onClick={() => router.push(`/eventduel/${game.slug}/player`)}
          sx={{
            position: "fixed",
            top: 20,
            left: 20,
            bgcolor: "primary.main",
            color: "white",
          }}
        >
          <ICONS.back />
        </IconButton>

        <Paper
          dir={dir}
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
            label={t.nameLabel}
            fullWidth
            required
            sx={{
              mb: 3,
            }}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <TextField
            label={t.companyLabel}
            fullWidth
            sx={{
              mb: 3,
            }}
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={24} color="inherit" />:<ICONS.next/>}
            sx={getStartIconSpacing(dir)}
            >
           {t.startButton}
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
