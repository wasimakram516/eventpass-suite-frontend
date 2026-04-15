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
    joiningTeam: "Joining Team",
  },
  ar: {
    nameLabel: "الاسم",
    companyLabel: "اسم الشركة",
    startButton: "متابعة",
    joiningTeam: "الانضمام إلى الفريق",
  },
};

export default function NamePage() {
  const { game, loading } = useGame();
  const router = useRouter();
  const { t, dir, align } = useI18nLayout(entryDialogTranslations);

  const [form, setForm] = useState({
    gameSlug: "",
    name: "",
    company: "",
    playerType: "",
    teamId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedTeamName, setSelectedTeamName] = useState("");

  // Populate form with slug + selected mode info
  useEffect(() => {
    if (game?.slug) setForm((p) => ({ ...p, gameSlug: game.slug }));

    if (game?.isTeamMode) {
      const teamId = sessionStorage.getItem("selectedTeamId");
      const teamName = sessionStorage.getItem("selectedTeamName"); 
      if (teamId) {
        setForm((p) => ({ ...p, teamId }));
        if (teamName) setSelectedTeamName(teamName);
      }
    } else {
      const playerType = sessionStorage.getItem("selectedPlayer");
      if (playerType) setForm((p) => ({ ...p, playerType }));
    }
  }, [game]);

  const handleSubmit = async () => {
    if (!form.name.trim() || submitting) return;
    setSubmitting(true);
    setError("");

    const response = await joinGameSession(form);

    if (!response?.error) {
      sessionStorage.setItem("playerId", response.player._id);
      sessionStorage.setItem("sessionId", response.session._id);
      router.push(`/eventduel/${game.slug}/play`);
    } else {
      setError(response?.message || "Something went wrong. Try again.");
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
          elevation={8}
          sx={{
            p: { xs: 3, sm: 4 },
            width: "100%",
            maxWidth: 500,
            textAlign: "center",
            backdropFilter: "blur(16px)",
            backgroundColor: "rgba(10,10,20,0.85)",
            borderRadius: 6,
            mx: "auto",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* Game Title */}
          <Typography
            variant="h1"
            gutterBottom
            sx={{
              mb: 3,
              color: "#00e5ff",
              textShadow: "0 0 16px rgba(0,229,255,0.4)",
              fontSize: (() => {
                const len = game.title?.length || 0;
                if (len <= 20) return { xs: "2rem", sm: "2.5rem", md: "3rem" };
                if (len <= 40) return { xs: "1.5rem", sm: "2rem", md: "2.5rem" };
                if (len <= 60) return { xs: "1.25rem", sm: "1.75rem", md: "2rem" };
                return { xs: "1rem", sm: "1.5rem", md: "1.75rem" };
              })(),
              lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
              wordBreak: "break-word",
              fontWeight: "bold",
            }}
          >
            {game.title}
          </Typography>

          {/* Team Mode Info */}
          {game?.isTeamMode && selectedTeamName && (
            <Box
              sx={{
                mb: 3,
                p: 1.5,
                borderRadius: 3,
                textAlign: "center",
                background: "linear-gradient(135deg, rgba(0,229,255,0.18), rgba(0,229,255,0.08))",
                border: "1px solid rgba(0,229,255,0.3)",
              }}
            >
              <Typography
                variant="body1"
                sx={{ fontWeight: "bold", letterSpacing: 0.5, color: "#00e5ff" }}
              >
                {t.joiningTeam}: {selectedTeamName}
              </Typography>
            </Box>
          )}

          {/* Name */}
          <TextField
            label={t.nameLabel}
            fullWidth
            required
            sx={{ mb: 3 }}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            InputProps={{ sx: { backgroundColor: "rgba(255,255,255,0.08)", color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" } } }}
            InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
          />

          {/* Submit */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={submitting || !form.name.trim()}
            startIcon={
              submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <ICONS.next />
              )
            }
            sx={{
              ...getStartIconSpacing(dir),
              py: 1.2,
              borderRadius: 999,
              fontWeight: 800,
              bgcolor: "#00e5ff",
              color: "#000",
              "&:hover": { filter: "brightness(1.15)", bgcolor: "#00e5ff" },
              "&:disabled": { opacity: 0.5 },
            }}
          >
            {t.startButton}
          </Button>

          {error && (
            <Typography variant="caption" color="error" sx={{ mt: 2, display: "block" }}>
              {error}
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
