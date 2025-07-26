"use client";

import { Fragment, useEffect, useState } from "react";
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
  Grid,
  Pagination,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
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
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import LoadingState from "@/components/LoadingState";

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
    timeTaken: "Time Taken",
    unknown: "Unknown",
    noData: "No data available",
    confirmResetTitle: "Reset All Sessions?",
    confirmResetMessage:
      "This will permanently delete all sessions for this game. Are you sure?",
    recordsPerPage: "Records per page",
    showing: "Showing",
    to: "to",
    of: "of",
    records: "sessions",
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
    timeTaken: "الوقت المستغرق",
    unknown: "غير معروف",
    noData: "لا توجد بيانات متاحة",
    confirmResetTitle: "هل تريد إعادة تعيين جميع الجلسات؟",
    confirmResetMessage:
      "سيؤدي هذا إلى حذف جميع الجلسات نهائيًا. هل أنت متأكد؟",
    recordsPerPage: "عدد الجلسات لكل صفحة",
    showing: "عرض",
    to: "إلى",
    of: "من",
    records: "جلسات",
  },
};

export default function PvPSessions() {
  const { gameSlug } = useParams();
  const { t, dir, align } = useI18nLayout(translations);
  const [sessions, setSessions] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      const res = await getAllSessions(gameSlug, page, limit);
      if (!res.error) {
        setSessions(res.sessions);
        setTotalSessions(res.totalCount);
      }
      setLoading(false);
    };
    if (gameSlug) fetchSessions();
  }, [gameSlug, page, limit]);

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
              sx={getStartIconSpacing(dir)}
            >
              {t.allSessions}
            </Button>
          </Stack>
        </Box>
        <Divider sx={{ my: 2 }} />
      </Box>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        px={2}
      >
        <Typography>
          {t.showing} {(page - 1) * limit + 1}-
          {Math.min(page * limit, totalSessions)} {t.of} {totalSessions}{" "}
          {t.records}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150, ml: 2 }}>
          <InputLabel>{t.recordsPerPage}</InputLabel>
          <Select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            label={t.recordsPerPage}
          >
            {[5, 10, 20].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <LoadingState />
      ) : (
        <Stack spacing={3} alignItems="center">
          <Box sx={{ mt: 2, width: "100%", maxWidth: 600 }}>
            {sessions && sessions.length > 0 ? (
              sessions.map((session) => {
                const player1 = session.players.find(
                  (p) => p.playerType === "p1"
                );
                const player2 = session.players.find(
                  (p) => p.playerType === "p2"
                );
                const isPlayer1Winner =
                  session.winner?._id === player1?.playerId?._id;
                const isPlayer2Winner =
                  session.winner?._id === player2?.playerId?._id;

                return (
                  <Fragment key={session?._id}>
                    <Fade in timeout={500} key={session._id}>
                      <Paper
                        elevation={6}
                        sx={{
                          overflow: "hidden",
                          borderRadius: 4,
                          my: 3,
                          background:
                            "linear-gradient(to bottom, #f7f7f7, #ffffff)",
                          boxShadow: "0px 6px 20px rgba(0,0,0,0.1)",
                        }}
                      >
                        {/* Winner Banner */}
                        <Box
                          sx={{
                            background: session.winner
                              ? "linear-gradient(to right, #4CAF50, #81C784)"
                              : "linear-gradient(to right, #9E9E9E, #BDBDBD)",
                            px: 3,
                            py: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          {session?.winner && (
                            <ICONS.trophy sx={{ color: "#fff" }} />
                          )}
                          <Typography
                            variant="h6"
                            color="#fff"
                            fontWeight="bold"
                          >
                            {session.winner ? session.winner.name : t.tie}
                          </Typography>
                        </Box>

                        {/* Players */}
                        <Box
                          sx={{
                            px: { xs: 2, sm: 4 },
                            py: 3,
                            position: "relative",
                          }}
                        >
                          <Grid
                            container
                            spacing={3}
                            direction={{ xs: "column", sm: "row" }}
                            alignItems="stretch"
                            justifyContent="space-between"
                          >
                            {/* Player 1 */}
                            <Grid item xs={12} sm={5.5}>
                              <Box
                                sx={{
                                  background: isPlayer1Winner
                                    ? "linear-gradient(135deg, #A5D6A7, #C8E6C9)"
                                    : "grey.100",
                                  borderRadius: 3,
                                  p: 3,
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1.5,
                                  textAlign: "left",
                                  alignItems: "flex-start",
                                }}
                              >
                                <Typography variant="h6" fontWeight="bold">
                                  {player1?.playerId?.name || t.unknown}
                                </Typography>

                                <Box display="flex" gap={1} alignItems="center">
                                  <ICONS.business fontSize="small" />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {player1?.playerId?.company || "N/A"}
                                  </Typography>
                                </Box>

                                <Box display="flex" gap={1} alignItems="center">
                                  <ICONS.leaderboard fontSize="small" />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {t.score}: {player1?.score ?? 0}
                                  </Typography>
                                </Box>

                                <Box display="flex" gap={1} alignItems="center">
                                  <ICONS.assignment fontSize="small" />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {t.attempted}:{" "}
                                    {player1?.attemptedQuestions ?? 0}
                                  </Typography>
                                </Box>
                                <Box display="flex" gap={1} alignItems="center">
                                  <ICONS.time fontSize="small" />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {t.timeTaken}:{" "}
                                    {player1?.timeTaken != null
                                      ? `${player1.timeTaken}s`
                                      : "0s"}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>

                            {/* VS Badge */}
                            <Box
                              sx={{
                                position: { xs: "static", sm: "absolute" },
                                top: "50%",
                                left: "50%",
                                transform: {
                                  xs: "none",
                                  sm: "translate(-50%, -50%)",
                                },
                                background: "#fff",
                                border: "2px solid #ccc",
                                px: 2,
                                py: 0.5,
                                borderRadius: "50px",
                                fontWeight: "bold",
                                width: "fit-content",
                                mx: "auto",
                                my: { xs: 1, sm: 0 },
                                zIndex: 2,
                              }}
                            >
                              VS
                            </Box>
                            {/* Player 2 */}
                            <Grid item xs={12} sm={5.5}>
                              <Box
                                sx={{
                                  background: isPlayer2Winner
                                    ? "linear-gradient(135deg, #A5D6A7, #C8E6C9)"
                                    : "grey.100",
                                  borderRadius: 3,
                                  p: 3,
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1.5,
                                  textAlign: "right",
                                  alignItems: "flex-end",
                                }}
                              >
                                <Typography variant="h6" fontWeight="bold">
                                  {player2?.playerId?.name || t.unknown}
                                </Typography>

                                <Box display="flex" gap={1} alignItems="center">
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {player2?.playerId?.company || "N/A"}
                                  </Typography>
                                  <ICONS.business fontSize="small" />
                                </Box>

                                <Box display="flex" gap={1} alignItems="center">
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {t.score}: {player2?.score ?? 0}
                                  </Typography>
                                  <ICONS.leaderboard fontSize="small" />
                                </Box>

                                <Box display="flex" gap={1} alignItems="center">
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {t.attempted}:{" "}
                                    {player2?.attemptedQuestions ?? 0}
                                  </Typography>
                                  <ICONS.assignment fontSize="small" />
                                </Box>

                                <Box display="flex" gap={1} alignItems="center">
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {t.timeTaken}:{" "}
                                    {player2?.timeTaken != null
                                      ? `${player2.timeTaken}s`
                                      : "0s"}
                                  </Typography>
                                  <ICONS.time fontSize="small" />
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Paper>
                    </Fade>
                    <Box display="flex" justifyContent="center" mt={4}>
                      <Pagination
                        count={Math.ceil(totalSessions / limit)}
                        page={page}
                        onChange={(_, value) => setPage(value)}
                      />
                    </Box>
                  </Fragment>
                );
              })
            ) : (
              <NoDataAvailable />
            )}
          </Box>
        </Stack>
      )}

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
