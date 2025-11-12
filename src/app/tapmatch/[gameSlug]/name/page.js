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
import { joinGame } from "@/services/tapmatch/playerService";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import { translateTexts } from "@/services/translationService";

const entryDialogTranslations = {
  en: {
    nameLabel: "Name",
    companyLabel: "Company",
    phoneLabel: "Phone Number",
    startButton: "Start Matching",
  },
  ar: {
    nameLabel: "الاسم",
    companyLabel: "اسم الشركة",
    phoneLabel: "رقم الهاتف",
    startButton: "ابدأ المطابقة",
  },
};

export default function TapMatchNamePage() {
  const { game, loading } = useGame();
  const router = useRouter();
  const { t, dir, align, language } = useI18nLayout(entryDialogTranslations);
  const [translatedTitle, setTranslatedTitle] = useState("");
  const [form, setForm] = useState({ name: "", company: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!form.name.trim() || submitting) return;

    setSubmitting(true);
    const res = await joinGame(game._id, form);
    if (!res.error) {
      // Save minimal session info locally
      sessionStorage.setItem("playerInfo", JSON.stringify(form));
      sessionStorage.setItem("playerId", res.playerId);
      sessionStorage.setItem("sessionId", res.sessionId);

      router.push(`/tapmatch/${game.slug}/instructions`);
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
          backgroundImage: `url("${encodeURI(game.nameImage)}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          position: "absolute",
          px: 2,
        }}
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
          <ArrowBackIcon />
        </IconButton>

        {/* Form Card */}
        <Paper
          dir={dir}
          elevation={6}
          sx={{
            p: { xs: 3, sm: 4 },
            width: "100%",
            maxWidth: 500,
            textAlign: align,
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255,255,255,0.6)",
            borderRadius: 6,
            mt: { xs: 10, sm: "15vh" },
            mx: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              mb: 4,
              color: "primary.main",
              textTransform: "capitalize",
              fontWeight: 700,
            }}
          >
            {translatedTitle}
          </Typography>

          {/* Name */}
          <TextField
            label={t.nameLabel}
            fullWidth
            required
            sx={{ mb: 3 }}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          {/* Phone */}
          <TextField
            label={t.phoneLabel}
            type="number"
            fullWidth
            sx={{ mb: 4 }}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          {/* Company */}
          {/* <TextField
            label={t.companyLabel}
            fullWidth
            sx={{ mb: 3 }}
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          /> */}
 
          {/* Start Button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              fontSize: "1.1rem",
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {submitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t.startButton
            )}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
