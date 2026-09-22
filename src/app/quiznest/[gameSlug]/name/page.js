"use client";

import {
  Box,
  Typography,
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
import { useGameEventRegLink } from "@/hooks/useGameEventRegLink";
import EventRegRemainingFieldsStep from "@/components/games/EventRegRemainingFieldsStep";
import EventRegPrimaryField from "@/components/games/EventRegPrimaryField";
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
  const { t, dir, language } = useI18nLayout(entryDialogTranslations);
  const { link, remainingStep, submit, submitWithRemaining } = useGameEventRegLink(game);
  const [form, setForm] = useState({ name: "", company: "", isoCode: "om" });
  const [primaryValid, setPrimaryValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (remainingValues) => {
    if (!primaryValid || submitting) return;
    setSubmitting(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      company: form.company,
      isoCode: form.isoCode,
    };

    const res = remainingValues
      ? await submitWithRemaining((p) => joinGame(game._id, p), payload, form.name.trim(), remainingValues)
      : await submit((p) => joinGame(game._id, p), payload, form.name.trim());

    if (res?.needsRemainingFields) {
      setSubmitting(false);
      return;
    }
    if (!res.error) {
      console.log(res);
      sessionStorage.setItem("playerInfo", JSON.stringify(form));
      sessionStorage.setItem("playerId", res.playerId);
      sessionStorage.setItem("sessionId", res.sessionId);
      router.push(`/quiznest/${game.slug}/play`);
      return;
    }
    setError(res?.message || "Something went wrong. Try again.");
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
          backgroundColor: "background.default",
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
          onClick={() => router.push(`/quiznest/${game.slug}`)}
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
          dir={dir}
          elevation={8}
          sx={(theme) => ({
            p: { xs: 3, sm: 4 },
            width: "100%",
            maxWidth: 800,
            textAlign: "center",
            backdropFilter: "blur(16px)",
            backgroundColor: theme.palette.overlay.cardTransparent,
            borderRadius: 6,
            border: `1px solid ${theme.palette.loader.skeleton}`,
            boxShadow: theme.palette.quiznest.dialogShadow,
          })}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={(theme) => ({
              fontWeight: 800,
              mb: 3,
              color: "text.primary",
              textTransform: "capitalize",
              wordBreak: "break-word",
            })}
          >
            {game.title}
          </Typography>

          {remainingStep ? (
            <EventRegRemainingFieldsStep
              fields={remainingStep.fields}
              submitting={submitting}
              module="quiznest"
              onSubmit={(values) => handleJoin(values)}
            />
          ) : (
            <>
              <EventRegPrimaryField
                link={link}
                module="quiznest"
                label={link ? link.primaryFieldLabel : t.nameLabel}
                value={form.name}
                onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                onIsoCodeChange={(iso) => setForm((p) => ({ ...p, isoCode: iso }))}
                onValidityChange={setPrimaryValid}
                dir={dir}
                language={language}
              />

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={() => handleJoin()}
                disabled={submitting || !primaryValid}
                sx={(theme) => ({
                  py: 1.2,
                  borderRadius: 999,
                  fontWeight: 800,
                  bgcolor: theme.palette.quiznest.accent,
                  color: theme.palette.common.black,
                  "&:hover": { filter: "brightness(1.15)", bgcolor: theme.palette.quiznest.accent },
                  "&:disabled": { opacity: 0.5 },
                })}
              >
                {submitting ? <CircularProgress size={24} sx={(theme) => ({ color: theme.palette.common.black })} /> : t.startButton}
              </Button>

              {error ? (
                <Typography variant="caption" color="error" sx={{ mt: 1.5, display: "block" }}>
                  {error}
                </Typography>
              ) : null}
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
