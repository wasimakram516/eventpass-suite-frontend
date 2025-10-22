"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Grid,
  Paper,
  Stack,
} from "@mui/material";
import { useMessage } from "@/contexts/MessageContext";
import useWebSocketData from "@/hooks/modules/eventduel/useEventDuelWebSocketData";
import { useGame } from "@/contexts/GameContext";
import LanguageSelector from "@/components/LanguageSelector";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    selectPlayer: "Select p1 or p2 before playing",
    selectTeam: "Select a team before playing",
    noSessionAvailable:
      "No session is available to join. Please wait for the admin to start a session.",
    player1: "Player 1",
    player2: "Player 2",
    connected: "Connected",
    play: "Play",
  },
  ar: {
    selectPlayer: "اختر اللاعب الأول أو الثاني قبل اللعب",
    selectTeam: "اختر الفريق قبل اللعب",
    noSessionAvailable:
      "لا توجد جلسة متاحة للانضمام. يرجى الانتظار حتى يبدأ المدير الجلسة.",
    player1: "اللاعب الأول",
    player2: "اللاعب الثاني",
    connected: "متصل",
    play: "ابدأ اللعب",
  },
};

export default function PlayerSelection() {
  const router = useRouter();
  const { gameSlug } = useParams();
  const { game } = useGame();
  const { showMessage } = useMessage();
  const { sessions } = useWebSocketData(gameSlug);
  const { t, dir } = useI18nLayout(translations);

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const pendingSession = useMemo(
    () => sessions.find((s) => s.status === "pending") || null,
    [sessions]
  );

  // Load previous selection
  useEffect(() => {
    if (game?.isTeamMode) {
      const storedTeam = sessionStorage.getItem("selectedTeamId");
      if (storedTeam) setSelectedTeamId(storedTeam);
    } else {
      const storedPlayer = sessionStorage.getItem("selectedPlayer");
      if (storedPlayer) setSelectedPlayer(storedPlayer);
    }
  }, [game]);

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
    sessionStorage.setItem("selectedPlayer", player);
  };

  const handleTeamSelect = (teamId) => {
    const team = game?.teams?.find((t) => t._id === teamId);
    const teamName = team ? team.name : "";

    setSelectedTeamId(teamId);
    sessionStorage.setItem("selectedTeamId", teamId);
    sessionStorage.setItem("selectedTeamName", teamName);
  };

  const handleProceed = () => {
    if (game?.isTeamMode && !selectedTeamId) {
      showMessage(t.selectTeam, "error");
      return;
    }
    if (!game?.isTeamMode && !selectedPlayer) {
      showMessage(t.selectPlayer, "error");
      return;
    }
    if (!pendingSession || !pendingSession._id) {
      showMessage(t.noSessionAvailable, "error");
      return;
    }
    router.push(`/eventduel/${gameSlug}/player/details`);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          position: "relative",
          backgroundImage: `url(${game?.coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          px: 2,
        }}
        dir={dir}
      >
        {/* Back Button */}
        <IconButton
          size="small"
          onClick={() => router.replace(`/eventduel/${game.slug}`)}
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

        {/* Dynamic Selection */}
        {!game?.isTeamMode ? (
          // --- PvP MODE ---
          <Box
            sx={{
              position: "absolute",
              top: 50,
              right: 10,
              display: "flex",
              gap: 4,
              m: 3,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            {/* Player 1 */}
            <Box
              sx={{
                position: "relative",
                opacity: selectedPlayer === "p2" ? 0.5 : 1,
                cursor: "pointer",
                textAlign: "center",
                width: { xs: "80px", md: "200px" },
              }}
              onClick={() => handlePlayerSelect("p1")}
            >
              {selectedPlayer === "p1" && (
                <Box
                  sx={{
                    position: "absolute",
                    top: -70,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                >
                  <Image
                    src="/connected.png"
                    alt={t.connected}
                    width={60}
                    height={60}
                  />
                </Box>
              )}
              <Image
                src="/player1.png"
                alt={t.player1}
                width={120}
                height={120}
                layout="responsive"
              />
            </Box>

            {/* Player 2 */}
            <Box
              sx={{
                position: "relative",
                opacity: selectedPlayer === "p1" ? 0.5 : 1,
                cursor: "pointer",
                textAlign: "center",
                width: { xs: "80px", md: "200px" },
              }}
              onClick={() => handlePlayerSelect("p2")}
            >
              {selectedPlayer === "p2" && (
                <Box
                  sx={{
                    position: "absolute",
                    top: -70,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                >
                  <Image
                    src="/connected.png"
                    alt={t.connected}
                    width={60}
                    height={60}
                  />
                </Box>
              )}
              <Image
                src="/player2.png"
                alt={t.player2}
                width={140}
                height={140}
                layout="responsive"
              />
            </Box>
          </Box>
        ) : (
          // --- TEAM MODE ---
          <Box
            sx={{
              width: "100%",
              maxWidth: 600,
              backgroundColor: "rgba(255,255,255,0.75)",
              borderRadius: 3,
              p: 3,
              mt: 5,
              boxShadow: 3,
            }}
          >
            <Typography
              variant="h5"
              textAlign="center"
              color="primary"
              fontWeight="bold"
              mb={3}
            >
              {t.selectTeam}
            </Typography>

            <Grid container spacing={2} justifyContent={"center"}>
              {game?.teams?.length > 0 ? (
                game.teams.map((team) => {
                  const isSelected = selectedTeamId === team._id;
                  return (
                    <Grid item xs={12} sm={6} key={team._id}>
                      <Paper
                        elevation={isSelected ? 8 : 2}
                        onClick={() => handleTeamSelect(team._id)}
                        sx={{
                          p: 3,
                          borderRadius: 4,
                          textAlign: "center",
                          minWidth: 150,
                          minHeight: 150,
                          cursor: "pointer",
                          transition: "0.3s",
                          background: isSelected
                            ? "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)"
                            : "white",
                          color: isSelected ? "white" : "text.primary",
                          "&:hover": {
                            transform: "translateY(-1px)",
                            boxShadow: 6,
                          },
                        }}
                      >
                        <Stack
                          alignItems="center"
                          justifyContent="center"
                          spacing={1}
                        >
                          <ICONS.group
                            style={{
                              fontSize: 40,
                              color: isSelected ? "white" : "#1976d2",
                            }}
                          />
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            sx={{
                              letterSpacing: 0.5,
                              textTransform: "capitalize",
                            }}
                          >
                            {team.name}
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>
                  );
                })
              ) : (
                <Typography
                  textAlign="center"
                  width="100%"
                  color="text.secondary"
                >
                  No teams available
                </Typography>
              )}
            </Grid>
          </Box>
        )}

        {/* Play Button */}
        <Button
          sx={{
            mt: 4,
            bgcolor: "transparent",
            border: "none",
            opacity:
              (!game?.isTeamMode && !selectedPlayer) ||
              (game?.isTeamMode && !selectedTeamId)
                ? 0.5
                : 1,
            "&:hover": { bgcolor: "transparent" },
          }}
          disabled={
            (!game?.isTeamMode && !selectedPlayer) ||
            (game?.isTeamMode && !selectedTeamId)
          }
          onClick={handleProceed}
        >
          <Box sx={{ width: { xs: 150, sm: 200, md: 250 } }}>
            <Image
              src="/playGif.gif"
              alt={t.play}
              width={250}
              height={100}
              layout="responsive"
            />
          </Box>
        </Button>

        {/* Hint */}
        {(!selectedPlayer && !game?.isTeamMode) ||
        (game?.isTeamMode && !selectedTeamId) ? (
          <Box
            sx={{
              backgroundColor: "rgba(255,255,255,0.6)",
              mt: 3,
              px: 3,
              py: 2,
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: "primary.main",
                fontSize: { xs: "1.5rem", sm: "2rem" },
                fontWeight: "bold",
              }}
            >
              {game?.isTeamMode ? t.selectTeam : t.selectPlayer}
            </Typography>
          </Box>
        ) : null}
      </Box>

      <LanguageSelector top={20} right={20} />
    </>
  );
}
