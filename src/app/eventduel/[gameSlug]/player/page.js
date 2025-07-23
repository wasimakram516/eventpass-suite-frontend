"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Box, Button, Typography, IconButton } from "@mui/material";
import { useMessage } from "@/contexts/MessageContext";
import useWebSocketData from "@/hooks/modules/eventduel/useEventDuelWebSocketData";
import { useGame } from "@/contexts/GameContext";
import LanguageSelector from "@/components/LanguageSelector";
import { getAllSessions } from "@/services/eventduel/gameSessionService";
import ICONS from "@/utils/iconUtil";

export default function PlayerSelection() {
  const router = useRouter();
  const { gameSlug } = useParams();
  const { game, loading } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [pendingSession, setPendingSession] = useState(null);
  const { showMessage } = useMessage();
  const { sessions } = useWebSocketData(gameSlug);
  const pollingIntervalRef = useRef(null);

  // Load previously selected player from localStorage
  useEffect(() => {
    const storedPlayer = localStorage.getItem("selectedPlayer");
    if (storedPlayer) {
      setSelectedPlayer(storedPlayer);
    }
  }, []);

  // Fetch sessions and pick pending one
  useEffect(() => {
    if (loading || !game) return;
    const fetchData = async () => {
      const response = await getAllSessions(gameSlug);
      if (!response?.error) {
        setPendingSession(response.find((s) => s.status === "pending") || null);
      }
    };
    fetchData();
  }, [gameSlug, loading, game]);

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
    sessionStorage.setItem("selectedPlayer", player);
  };

  const handleProceed = () => {
    if (!selectedPlayer) return;
    if (!pendingSession || !pendingSession._id) {
      showMessage(
        "No session is available to join. Please wait for the admin to start a session.",
        "error"
      );
      return;
    }
    router.push(`/eventduel/${gameSlug}/player/name`);
  };

  return (
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

      <LanguageSelector top={20} right={20} />

      {/* 🎮 Player Selection */}
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
                alt="Connected"
                width={60}
                height={60}
              />
            </Box>
          )}
          <Image
            src="/player1.png"
            alt="Player 1"
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
                alt="Connected"
                width={60}
                height={60}
              />
            </Box>
          )}
          <Image
            src="/player2.png"
            alt="Player 2"
            width={140}
            height={140}
            layout="responsive"
          />
        </Box>
      </Box>

      {/* Play Button */}
      <Button
        sx={{
          mt: 4,
          bgcolor: "transparent",
          border: "none",
          opacity: !selectedPlayer ? "0.5" : "1",
          "&:hover": { bgcolor: "transparent" },
        }}
        disabled={!selectedPlayer}
        onClick={handleProceed}
      >
        <Box sx={{ width: { xs: 150, sm: 200, md: 250 } }}>
          <Image
            src="/playGif.gif"
            alt="Play Button"
            width={250}
            height={100}
            layout="responsive"
          />
        </Box>
      </Button>

      {/* Selection Hint */}
      {!selectedPlayer && (
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
            Select p1 or p2 before playing
          </Typography>
        </Box>
      )}
    </Box>
  );
}
