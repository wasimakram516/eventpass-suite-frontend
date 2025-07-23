"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Button,
  Typography,
  Paper,
  Fade,
  Container,
  Stack,
  Divider,
} from "@mui/material";
import ConfirmationDialog from "@/components/ConfirmationDialog";

import ICONS from "@/utils/iconUtil";
import {
  getAllSessions,
  resetPvPSessions,
} from "@/services/eventduel/gameSessionService";
import NoDataAvailable from "@/components/NoDataAvailable";
import useI18nLayout from "@/hooks/useI18nLayout";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";

const translations = {
  en: {
    hostDashboard: "PvP Sessions",
    hostDescription: "View and reset your previous PvP sessions.",
    allSessions: "Reset Sessions",
    sessionId: "Session ID",
    player1: "Player 1",
    player2: "Player 2",
    previousSession: "Previous Session",
    winner: "Winner",
    tie: "It's a Tie!",
    company: "Company",
    score: "Score",
    attempted: "Attempted",
    unknown: "Unknown",
    noData: "No data available",
    confirmResetTitle: "Reset All Sessions?",
    confirmResetMessage:
      "This will permanently delete all sessions for this game. Are you sure?",
  },
  ar: {
    hostDashboard: "جلسات PvP",
    hostDescription: "عرض وإعادة تعيين الجلسات السابقة.",
    allSessions: "إعادة تعيين الجلسات",
    sessionId: "معرّف الجلسة",
    player1: "اللاعب 1",
    player2: "اللاعب 2",
    previousSession: "الجلسة السابقة",
    winner: "الفائز",
    tie: "تعادل!",
    company: "الشركة",
    score: "النتيجة",
    attempted: "المحاولات",
    unknown: "غير معروف",
    noData: "لا توجد بيانات متاحة",
    confirmResetTitle: "هل تريد إعادة تعيين جميع الجلسات؟",
    confirmResetMessage:
      "سيؤدي هذا إلى حذف جميع الجلسات نهائيًا. هل أنت متأكد؟",
  },
};

export default function PvPSessions() {
  const { gameSlug } = useParams();
  const { t, dir, align } = useI18nLayout(translations);
  const [sessions, setSessions] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      const res = await getAllSessions(gameSlug);
      if (!res.error) {
        setSessions(res);
      }
    };
    fetchSessions();
  }, [gameSlug]);

  const handleResetSessions = async () => {
    if (sessions.length === 0) return setShowConfirm(false);
    const res = await resetPvPSessions(gameSlug);
    if (!res.error) {
      setSessions([]);
    }
    setShowConfirm(false);
  };

  return (
    <Container dir={dir} maxWidth="lg">
      <Box sx={{ textAlign: align }}>
        <BreadcrumbsNav />
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mt: 2 }}>
              {t.hostDashboard}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.hostDescription}
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              color="error"
              startIcon={<ICONS.delete />}
              onClick={() => setShowConfirm(true)}
            >
              {t.allSessions}
            </Button>
          </Stack>
        </Box>
        <Divider sx={{ my: 2 }} />
      </Box>

      <Stack spacing={3} alignItems="center">
        <Box sx={{ mt: 4, width: "100%", maxWidth: 600 }}>
          {sessions && sessions.length > 0 ? (
            sessions.map((session) => {
              const player1 = session.players.find(
                (p) => p.playerType === "p1"
              );
              const player2 = session.players.find(
                (p) => p.playerType === "p2"
              );
              const isPlayer1Winner =
                session.winner && session.winner._id === player1?.playerId?._id;
              const isPlayer2Winner =
                session.winner && session.winner._id === player2?.playerId?._id;

              return (
                <Fade in timeout={500} key={session._id}>
                  <Paper
                    elevation={6}
                    sx={{
                      p: 3,
                      my: 2,
                      borderRadius: 3,
                      background: "linear-gradient(135deg, #f5f5f5, #ffffff)",
                      boxShadow: "0px 4px 15px rgba(0,0,0,0.15)",
                    }}
                  >
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      textAlign="center"
                      color="secondary.main"
                    >
                      {t.sessionId}: {session._id}
                    </Typography>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      mt={1}
                      mb={2}
                    >
                      <ICONS.trophy sx={{ color: "#4CAF50", mr: 1 }} />
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        color={
                          session.winner ? "success.main" : "text.secondary"
                        }
                      >
                        {t.winner}: {session.winner?.name || t.tie}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        background: "#f3f3f3",
                        position: "relative",
                      }}
                    >
                      <Box
                        sx={{
                          textAlign: "left",
                          flex: 1,
                          background: isPlayer1Winner
                            ? "linear-gradient(135deg, #4CAF50, #66BB6A)"
                            : "grey.200",
                          p: 2,
                          borderRadius: "8px",
                          color: isPlayer1Winner ? "#fff" : "text.primary",
                        }}
                      >
                        <Typography fontWeight="bold">
                          {player1?.playerId?.name || t.unknown}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ICONS.business fontSize="small" />
                          <Typography variant="caption">
                            {player1?.playerId?.company || "N/A"}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ICONS.leaderboard fontSize="small" />
                          <Typography variant="caption">
                            {t.score}: {player1?.score ?? 0}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ICONS.assignment fontSize="small" />
                          <Typography variant="caption">
                            {t.attempted}: {player1?.attemptedQuestions ?? 0}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.secondary"
                        sx={{
                          position: "absolute",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "0.85rem",
                          background: "#ffffff",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
                        }}
                      >
                        VS
                      </Typography>

                      <Box
                        sx={{
                          textAlign: "right",
                          flex: 1,
                          background: isPlayer2Winner
                            ? "linear-gradient(135deg, #4CAF50, #66BB6A)"
                            : "grey.200",
                          p: 2,
                          borderRadius: "8px",
                          color: isPlayer2Winner ? "#fff" : "text.primary",
                        }}
                      >
                        <Typography fontWeight="bold">
                          {player2?.playerId?.name || t.unknown}
                        </Typography>
                        <Box
                          display="flex"
                          justifyContent="flex-end"
                          alignItems="center"
                          gap={1}
                        >
                          <Typography variant="caption">
                            {player2?.playerId?.company || "N/A"}
                          </Typography>
                          <ICONS.business fontSize="small" />
                        </Box>
                        <Box
                          display="flex"
                          justifyContent="flex-end"
                          alignItems="center"
                          gap={1}
                        >
                          <Typography variant="caption">
                            {t.score}: {player2?.score ?? 0}
                          </Typography>
                          <ICONS.leaderboard fontSize="small" />
                        </Box>
                        <Box
                          display="flex"
                          justifyContent="flex-end"
                          alignItems="center"
                          gap={1}
                        >
                          <Typography variant="caption">
                            {t.attempted}: {player2?.attemptedQuestions ?? 0}
                          </Typography>
                          <ICONS.assignment fontSize="small" />
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Fade>
              );
            })
          ) : (
            <NoDataAvailable />
          )}
        </Box>
      </Stack>
      <ConfirmationDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleResetSessions}
        title={t.confirmResetTitle}
        message={t.confirmResetMessage}
        confirmButtonText={t.allSessions}
      />
    </Container>
  );
}
