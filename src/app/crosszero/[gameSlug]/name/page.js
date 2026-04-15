"use client";

import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useGame } from "@/contexts/GameContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinGame } from "@/services/crosszero/playerService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    aiMode: "Solo vs AI",
    youPlayAs: "You play as",
    nameLabel: "Your Name",
    companyLabel: "Company (optional)",
    departmentLabel: "Department (optional)",
    startButton: "Continue",
  },
  ar: {
    aiMode: "فردي · ضد الذكاء الاصطناعي",
    youPlayAs: "تلعب بدور",
    nameLabel: "اسمك",
    companyLabel: "الشركة (اختياري)",
    departmentLabel: "القسم (اختياري)",
    startButton: "متابعة",
  },
};

export default function CrossZeroNamePage() {
  const { game, loading } = useGame();
  const router = useRouter();
  const { t, dir } = useI18nLayout(translations);
  const [form, setForm] = useState({ name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    const res = await joinGame(game._id, form);
    if (!res?.error) {
      sessionStorage.setItem(
        "playerInfo",
        JSON.stringify({ name: form.name.trim(), mode: "solo" })
      );
      sessionStorage.setItem("playerId", res.playerId);
      sessionStorage.setItem("sessionId", res.sessionId);
      sessionStorage.setItem("playerMark", "O");
      router.push(`/crosszero/${game.slug}/play`);
    } else {
      setError(res?.message || "Something went wrong. Try again.");
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
        }}
      >
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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          width: "100vw",
          backgroundImage: `url(${game.nameImage || game.coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          px: 2,
          py: 4,
        }}
      >
        <IconButton
          size="small"
          onClick={() => router.replace(`/crosszero/${game.slug}`)}
          sx={{ position: "fixed", top: 20, left: 20, bgcolor: "primary.main", color: "white" }}
        >
          <ICONS.back />
        </IconButton>

        <Paper
          dir={dir}
          elevation={6}
          sx={{
            p: { xs: 3, sm: 4 },
            width: "100%",
            maxWidth: 520,
            textAlign: "center",
            backdropFilter: "blur(16px)",
            backgroundColor: "rgba(10,10,20,0.85)",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* Mode header icons */}
          <Stack direction="row" justifyContent="center" spacing={1.5} sx={{ mb: 2 }}>
            {game.xImage ? (
              <Box component="img" src={game.xImage} alt="X" sx={{ width: 44, height: 44, objectFit: "contain" }} />
            ) : (
              <Typography sx={{ fontSize: "2.2rem", fontWeight: 900, color: "#00e5ff", textShadow: "0 0 20px #00e5ff", lineHeight: 1 }}>✕</Typography>
            )}
            {game.oImage ? (
              <Box component="img" src={game.oImage} alt="O" sx={{ width: 44, height: 44, objectFit: "contain" }} />
            ) : (
              <Typography sx={{ fontSize: "2.2rem", fontWeight: 900, color: "#ff6b6b", textShadow: "0 0 20px #ff6b6b", lineHeight: 1 }}>○</Typography>
            )}
          </Stack>

          <Typography variant="h4" fontWeight={800} sx={{ color: "#fff", mb: 0.5 }}>
            {game.title}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.5)", mb: 3, fontSize: "0.9rem", fontWeight: 600 }}>
            {t.aiMode}
          </Typography>

          {/* Fixed mark indicator for AI mode */}
          <Box
            sx={{
              mb: 3,
              px: 2.5,
              py: 1,
              borderRadius: 3,
              border: "1.5px solid rgba(255,107,107,0.4)",
              bgcolor: "rgba(255,107,107,0.12)",
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography sx={{ color: "#ff6b6b", fontWeight: 700, fontSize: "0.9rem" }}>
              {t.youPlayAs}:
            </Typography>
            {game.oImage ? (
              <Box component="img" src={game.oImage} alt="O" sx={{ width: 28, height: 28, objectFit: "contain" }} />
            ) : (
              <Typography sx={{ fontSize: "1.4rem", fontWeight: 900, color: "#ff6b6b", textShadow: "0 0 12px rgba(255,107,107,0.6)", lineHeight: 1 }}>
                ○
              </Typography>
            )}
          </Box>

          <TextField
            label={t.nameLabel}
            fullWidth
            required
            sx={{ mb: 3 }}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            InputProps={{ sx: { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" } } }}
            InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
          />
          {/* <TextField
            label={t.companyLabel}
            fullWidth
            sx={{ mb: 2.5 }}
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            InputProps={{ sx: { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" } } }}
            InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
          />
          <TextField
            label={t.departmentLabel}
            fullWidth
            sx={{ mb: 3 }}
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            InputProps={{ sx: { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" } } }}
            InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
          /> */}

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={submitting || !form.name.trim()}
            startIcon={
              submitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ICONS.next />
              )
            }
            sx={{
              ...getStartIconSpacing(dir),
              mt: 1,
              py: 1.2,
              borderRadius: 999,
              fontWeight: 800,
              bgcolor: "#ff6b6b",
              "&:hover": { filter: "brightness(1.15)", bgcolor: "#ff6b6b" },
              "&:disabled": { opacity: 0.5 },
            }}
          >
            {t.startButton}
          </Button>

          {error ? (
            <Typography variant="caption" color="error" sx={{ mt: 1.5, display: "block" }}>
              {error}
            </Typography>
          ) : null}
        </Paper>
      </Box>
    </>
  );
}
