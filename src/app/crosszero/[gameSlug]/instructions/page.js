"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  IconButton,
  Stack,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useGame } from "@/contexts/GameContext";
import { useRouter } from "next/navigation";
import CrossZeroMarkVisual from "@/components/crosszero/CrossZeroMarkVisual";
import CrossZeroFloatingControls from "@/components/crosszero/CrossZeroFloatingControls";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    aiMode: "Solo vs AI",
    pvpMode: "Multiplayer · 1v1",
    howToPlay: "How to Play",
    playingAs: "Playing as",
    player1: "Player 1",
    player2: "Player 2",
    rule1: "The board has 9 cells in a 3×3 grid.",
    rule2: "Players take turns placing their mark in an empty cell.",
    rule3: "Match 3 marks in a row to win. If the board fills first, it's a draw.",
    rule4Solo: "In AI mode, you play as O (go first) and the AI plays as X.",
    rule4Pvp: "In PvP mode, Player 1 plays as O (goes first) and Player 2 plays as X.",
    goodLuck: "Good Luck!",
    start: "Start Game",
  },
  ar: {
    aiMode: "فردي · ضد الذكاء الاصطناعي",
    pvpMode: "متعدد اللاعبين · 1 ضد 1",
    howToPlay: "طريقة اللعب",
    playingAs: "تلعب كـ",
    player1: "اللاعب الأول",
    player2: "اللاعب الثاني",
    rule1: "تتكون اللوحة من 9 خانات ضمن شبكة 3×3.",
    rule2: "يتناوب اللاعبون على وضع علامتهم داخل خانة فارغة.",
    rule3: "كوّن 3 علامات في صف واحد للفوز. وإذا امتلأت اللوحة أولًا تنتهي المباراة بالتعادل.",
    rule4Solo: "في وضع الذكاء الاصطناعي تلعب بعلامة O (تبدأ أولاً) بينما يلعب الذكاء الاصطناعي بعلامة X.",
    rule4Pvp: "في وضع لاعب ضد لاعب، اللاعب الأول يلعب بعلامة O (يبدأ أولاً) واللاعب الثاني يلعب بعلامة X.",
    goodLuck: "حظًا موفقًا!",
    start: "ابدأ اللعبة",
  },
};

const PLAYER_LABEL_KEY = { p1: "player1", p2: "player2" };

export default function CrossZeroInstructionsPage() {
  const { game, loading } = useGame();
  const router = useRouter();
  const { t, dir, align } = useI18nLayout(translations);
  const [playerInfo, setPlayerInfo] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("playerInfo");
    if (!stored) return;

    try {
      setPlayerInfo(JSON.parse(stored));
    } catch {
      setPlayerInfo(null);
    }
  }, []);

  const playerMark = playerInfo?.mark === "O" ? "O" : "X";
  const modeLabel = game?.mode === "solo" ? t.aiMode : t.pvpMode;
  const infoRule = game?.mode === "solo" ? t.rule4Solo : t.rule4Pvp;
  const rules = useMemo(() => [t.rule1, t.rule2, t.rule3, infoRule], [t.rule1, t.rule2, t.rule3, infoRule]);

  const roleLabel =
    game?.mode === "pvp" && playerInfo?.playerType
      ? t[PLAYER_LABEL_KEY[playerInfo.playerType]] || t.player1
      : t.playingAs;

  const backTarget =
    game?.mode === "solo"
      ? `/crosszero/${game?.slug}/name`
      : `/crosszero/${game?.slug}/player`;

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
    <Box sx={{ position: "relative" }}>
      <CrossZeroFloatingControls top={20} right={20} />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          width: "100vw",
          backgroundImage: `url(${game.coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          px: 2,
          py: 4,
        }}
      >
        <IconButton
          size="small"
          onClick={() => router.replace(backTarget)}
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
            p: { xs: 3, sm: 5 },
            width: "100%",
            maxWidth: 560,
            backdropFilter: "blur(16px)",
            backgroundColor: (theme) =>
              alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.88 : 0.92),
            borderRadius: 6,
            border: "1px solid",
            borderColor: "divider",
           boxShadow: (theme) => theme.palette.shadow.paper,
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              justifyContent: "center",
              mb: 2
            }}>
            <CrossZeroMarkVisual mark="X" xImage={game.xImage} oImage={game.oImage} size={42} fallbackSize="2rem" />
            <CrossZeroMarkVisual mark="O" xImage={game.xImage} oImage={game.oImage} size={42} fallbackSize="2rem" />
          </Stack>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "text.primary",
              textAlign: "center",
              mb: 0.5
            }}>
            {game.title}
          </Typography>

          {playerInfo?.name ? (
            <Typography
              sx={{
                color: "text.primary",
                textAlign: "center",
                mb: 0.5,
                fontWeight: 800,
                fontSize: "1.05rem",
              }}
            >
              {playerInfo.name}
            </Typography>
          ) : null}

          <Typography
            sx={{
              color: "text.secondary",
              textAlign: "center",
              mb: 1,
              fontSize: "0.9rem",
            }}
          >
            {modeLabel}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              justifyContent: "center",
              alignItems: "center",
              mb: 2.5,
              px: 1.5,
              py: 0.8,
              mx: "auto",
              width: "fit-content",
              borderRadius: 999,
              bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.16 : 0.08),
              border: "1px solid",
              borderColor: "divider"
            }}>
            <Typography
              sx={{
                color: "text.primary",
                fontWeight: 700,
                fontSize: "0.88rem",
              }}
            >
              {roleLabel}
            </Typography>
            <CrossZeroMarkVisual mark={playerMark} xImage={game.xImage} oImage={game.oImage} size={22} fallbackSize="1.15rem" />
          </Stack>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              textAlign: "center",
              mb: 3,
              fontSize: "1rem"
            }}>
            {t.howToPlay}
          </Typography>

          <Stack spacing={1.5} sx={{ mb: 4, textAlign: align }}>
            {rules.map((rule, index) => (
              <Stack
                key={`${index}-${rule}`}
                direction="row"
                spacing={1.25}
                sx={{
                  alignItems: "flex-start",
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 3,
                  bgcolor: (theme) => alpha(theme.palette.action.hover, theme.palette.mode === "dark" ? 0.35 : 0.65),
                  border: "1px solid",
                  borderColor: "divider"
                }}>
                <Box
                  sx={{
                    minWidth: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.2 : 0.1),
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    mt: 0.15,
                  }}
                >
                  {index + 1}
                </Box>
                <Typography
                  sx={{
                    color: "text.primary",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                  }}
                >
                  {rule}
                </Typography>
              </Stack>
            ))}
          </Stack>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "secondary.main",
              textAlign: "center",
              mb: 3,
              textShadow: (theme) => `0 0 12px ${alpha(theme.palette.secondary.main, 0.35)}`
            }}>
            {t.goodLuck}
          </Typography>

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => router.push(`/crosszero/${game.slug}/play`)}
            startIcon={<ICONS.play />}
            sx={{
              ...getStartIconSpacing(dir),
              py: 1.2,
              borderRadius: 999,
              fontWeight: 800,
              bgcolor: playerMark === "O" ? "error.main" : "primary.main",
              color: playerMark === "O" ? "error.contrastText" : "primary.contrastText",
              "&:hover": {
                filter: "brightness(1.08)",
                bgcolor: playerMark === "O" ? "error.main" : "primary.main",
              },
            }}
          >
            {t.start}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
