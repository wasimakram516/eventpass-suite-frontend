"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Paper,
  CircularProgress,
  Stack,
  TextField,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useGame } from "@/contexts/GameContext";
import { useMessage } from "@/contexts/MessageContext";
import useCrossZeroWebSocketData from "@/hooks/modules/crosszero/useCrossZeroWebSocketData";
import { joinGameSession } from "@/services/crosszero/gameSessionService";
import CrossZeroFloatingControls from "@/components/crosszero/CrossZeroFloatingControls";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { useTheme } from "@mui/material/styles";
const translations = {
  en: {
    pvpMode: "Player vs Player · 1v1",
    chooseSide: "Choose Your Side",
    nameLabel: "Your Name",
    companyLabel: "Company (optional)",
    departmentLabel: "Department (optional)",
    proceed: "Join Game",
    noSession: "No session is available right now. Please wait for a new session.",
    selectSide: "Please select X or O to continue.",
    player1: "Player 1",
    player2: "Player 2",
    markX: "Plays second",
    markO: "Plays first",
    waitingSession: "Waiting for a session to be created...",
  },
  ar: {
    pvpMode: "لاعب ضد لاعب · ١ مقابل ١",
    chooseSide: "اختر جانبك",
    nameLabel: "اسمك",
    companyLabel: "الشركة (اختياري)",
    departmentLabel: "القسم (اختياري)",
    proceed: "انضم للعبة",
    noSession: "لا توجد جلسة متاحة حالياً. يرجى انتظار جلسة جديدة.",
    selectSide: "يرجى اختيار ✕ أو ○ للمتابعة.",
    player1: "اللاعب الأول",
    player2: "اللاعب الثاني",
    markX: "يلعب ثانياً",
    markO: "يلعب أولاً",
    waitingSession: "بانتظار إنشاء جلسة...",
  },
};



const MARK_MAP = { p1: "O", p2: "X" };

export default function CrossZeroPlayerPage() {
  const router = useRouter();
  const { gameSlug } = useParams();
  const { game, loading } = useGame();
  const { showMessage } = useMessage();
  const { sessions } = useCrossZeroWebSocketData(gameSlug);
  const { t, dir } = useI18nLayout(translations);

  const [selected, setSelected] = useState("");
  const [form, setForm] = useState({ name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const theme = useTheme();
  const PLAYER_OPTIONS = [
    {
      id: "p1",
      labelKey: "player1",
      helperKey: "markO",
      symbol: "○",
      mark: "O",
      color: theme.palette.crosszero.o,
      glow: theme.palette.crosszero.oGlow,
    },
    {
      id: "p2",
      labelKey: "player2",
      helperKey: "markX",
      symbol: "✕",
      mark: "X",
      color: theme.palette.crosszero.x,
      glow: theme.palette.crosszero.xGlow,
    },
  ];
  // Clear stale session data from any previous game
  useEffect(() => {
    sessionStorage.removeItem("sessionId");
    sessionStorage.removeItem("playerId");
    sessionStorage.removeItem("playerMark");
    sessionStorage.removeItem("playerInfo");
    sessionStorage.removeItem("selectedPlayer");
    sessionStorage.removeItem("pendingSessionId");
  }, []);

  const pendingSession = useMemo(
    () => sessions.find((s) => s.status === "pending") || null,
    [sessions]
  );

  const handleSubmit = async () => {
    if (!selected) {
      showMessage(t.selectSide, "error");
      return;
    }
    if (!form.name.trim() || submitting) return;
    if (!pendingSession?._id) {
      showMessage(t.noSession, "error");
      return;
    }

    setSubmitting(true);
    setError("");

    const response = await joinGameSession({
      gameSlug: game.slug,
      sessionId: pendingSession._id,
      name: form.name.trim(),
      playerType: selected,
    });

    if (!response?.error) {
      const playerInfo = {
        name: form.name.trim(),
        playerType: selected,
        mark: response.mark || MARK_MAP[selected] || "X",
        mode: "pvp",
      };
      sessionStorage.setItem("playerId", response.playerId);
      sessionStorage.setItem("sessionId", response.sessionId);
      sessionStorage.setItem("playerMark", response.mark || MARK_MAP[selected] || "X");
      sessionStorage.setItem("playerInfo", JSON.stringify(playerInfo));
      router.push(`/crosszero/${game.slug}/play`);
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
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <CrossZeroFloatingControls top={20} right={20} />
      <Box
        dir={dir}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          width: "100vw",
          position: "relative",
          backgroundImage: `url(${game?.nameImage || game?.coverImage})`,
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
          sx={{
            position: "fixed",
            top: 20,
            left: 20,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            boxShadow: (theme) => theme.palette.shadow.floatingButton,
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
            maxWidth: 520,
            textAlign: "center",
            backdropFilter: "blur(16px)",
            backgroundColor: (theme) =>
              alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.88 : 0.92),
            borderRadius: 6,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: (theme) => theme.palette.shadow.paper,
          }}
        >
          {/* Mode header icons */}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              justifyContent: "center",
              mb: 2
            }}>
            {game.xImage ? (
              <Box component="img" src={game.xImage} alt="X" sx={{ width: 44, height: 44, objectFit: "contain" }} />
            ) : (
              <Typography sx={{ fontSize: "2.2rem", fontWeight: 900, color: "primary.main", textShadow: (theme) => `0 0 20px ${alpha(theme.palette.primary.main, 0.8)}`, lineHeight: 1 }}>✕</Typography>
            )}
            {game.oImage ? (
              <Box component="img" src={game.oImage} alt="O" sx={{ width: 44, height: 44, objectFit: "contain" }} />
            ) : (
              <Typography sx={{ fontSize: "2.2rem", fontWeight: 900, color: "error.main", textShadow: (theme) => `0 0 20px ${alpha(theme.palette.error.main, 0.8)}`, lineHeight: 1 }}>○</Typography>
            )}
          </Stack>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "text.primary",
              mb: 0.5
            }}>
            {game.title}
          </Typography>
          <Typography sx={{ color: "text.secondary", mb: 3, fontSize: "0.9rem", fontWeight: 600 }}>
            {t.pvpMode}
          </Typography>

          {/* Side selector */}
          <Typography sx={{ color: "text.primary", mb: 1.5, fontWeight: 700 }}>
            {t.chooseSide}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
            {PLAYER_OPTIONS.map((option) => {
              const isSelected = selected === option.id;
              const customImage = option.mark === "O" ? game.oImage : game.xImage;
              return (
                <Paper
                  key={option.id}
                  onClick={() => setSelected(option.id)}
                  elevation={isSelected ? 10 : 2}
                  sx={{
                    flex: 1,
                    minHeight: 110,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    borderRadius: 4,
                    border: isSelected
                      ? `2px solid ${option.color}`
                      : "1px solid",
                    borderColor: isSelected ? option.color : "divider",
                    background: isSelected
                      ? (theme) => alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.98 : 0.96)
                      : (theme) => alpha(theme.palette.action.hover, theme.palette.mode === "dark" ? 0.28 : 0.55),
                    transition: "all 0.25s ease",
                    "&:hover": { transform: "translateY(-3px)" },
                  }}
                >
                  {customImage ? (
                    <Box component="img" src={customImage} alt={option.symbol}
                      sx={{ width: 52, height: 52, objectFit: "contain", filter: isSelected ? `drop-shadow(0 0 8px ${option.color})` : "none" }} />
                  ) : (
                    <Typography
                      sx={{
                        fontSize: "2.6rem",
                        fontWeight: 900,
                        color: option.color,
                        textShadow: `0 0 24px ${option.glow}`,
                        lineHeight: 1,
                      }}
                    >
                      {option.symbol}
                    </Typography>
                  )}
                  <Typography
                    sx={{
                      mt: 0.8,
                      color: "text.primary",
                      fontWeight: 800,
                      fontSize: "0.9rem",
                    }}
                  >
                    {t[option.labelKey]}
                  </Typography>
                  <Typography
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.76rem",
                    }}
                  >
                    {t[option.helperKey]}
                  </Typography>
                </Paper>
              );
            })}
          </Stack>

          {/* Name fields */}
          <TextField
            label={t.nameLabel}
            fullWidth
            required
            sx={{ mb: 2.5, textAlign: "left" }}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            slotProps={{
              input: { sx: { backgroundColor: (theme) => alpha(theme.palette.action.hover, theme.palette.mode === "dark" ? 0.32 : 0.6), color: "text.primary", "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" } } },
              inputLabel: { sx: { color: "text.secondary" } }
            }} />
          {/* <TextField
            label={t.companyLabel}
            fullWidth
            sx={{ mb: 2.5 }}
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            slotProps={{
              input: { sx: { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" } } },
              inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } }
            }}
          />
          <TextField
            label={t.departmentLabel}
            fullWidth
            sx={{ mb: 3 }}
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            slotProps={{
              input: { sx: { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" } } },
              inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } }
            }}
          /> */}

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={!selected || !form.name.trim() || submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ICONS.next />
              )
            }
            sx={{
              ...getStartIconSpacing(dir),
              py: 1.2,
              borderRadius: 999,
              fontWeight: 800,
              bgcolor: selected ? PLAYER_OPTIONS.find((o) => o.id === selected)?.color ?? "primary.main" : "primary.main",
              color: "primary.contrastText",
              "&:hover": { filter: "brightness(1.08)", bgcolor: selected ? PLAYER_OPTIONS.find((o) => o.id === selected)?.color ?? "primary.main" : "primary.main" },
              "&:disabled": { opacity: 0.5 },
            }}
          >
            {t.proceed}
          </Button>

          {error ? (
            <Typography variant="caption" color="error" sx={{ mt: 1.5, display: "block" }}>
              {error}
            </Typography>
          ) : null}

          {!pendingSession ? (
            <Typography sx={{ color: theme.palette.crosszero.waitingText, mt: 2, fontSize: "0.85rem" }}>
              {t.waitingSession}
            </Typography>
          ) : null}
        </Paper>
      </Box>
    </>
  );
}
