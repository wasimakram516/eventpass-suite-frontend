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
  Grid,
  Pagination,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
} from "@mui/material";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";

import ICONS from "@/utils/iconUtil";
import {
  exportResults,
  getAllSessions,
  resetPvPSessions,
} from "@/services/eventduel/gameSessionService";
import NoDataAvailable from "@/components/NoDataAvailable";
import useI18nLayout from "@/hooks/useI18nLayout";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
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
      "Are you sure you want to move this item to the Recycle Bin?",
    delete: "Delete",
    recordsPerPage: "Records per page",
    showing: "Showing",
    to: "to",
    of: "of",
    records: "sessions",
    exportResults: "Export Results",
    exporting: "Exporting...",
    errorLoading: "Error loading data.",
    exported: "Exported results!",
    totalScore: "Total Score",
    averageTime: "Average Time",
    averageAttempted: "Average Attempted",
    teams: "Team",
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
      "هل أنت متأكد من أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    delete: "حذف",
    recordsPerPage: "عدد الجلسات لكل صفحة",
    showing: "عرض",
    to: "إلى",
    of: "من",
    records: "جلسات",
    exportResults: "تصدير النتائج",
    exporting: "جاري التصدير...",
    errorLoading: "حدث خطأ أثناء تحميل البيانات.",
    exported: "تم تصدير النتائج!",
    totalScore: "إجمالي النقاط",
    averageTime: "متوسط الوقت",
    averageAttempted: "متوسط المحاولات",
    teams: "الفريق",
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
  const [exportLoading, setExportLoading] = useState(false);

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

  // Export results as Excel file
  const handleExport = async () => {
    setExportLoading(true);
    await exportResults(gameSlug);
    setExportLoading(false);
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
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              width: { xs: "100%", sm: "auto" },
              alignItems: "center",
              justifyContent: "flex-end",
              gap: dir === "rtl" ? 2 : 1,
            }}
          >
            <Button
              variant="contained"
              color="error"
              startIcon={<ICONS.delete />}
              onClick={() => setShowConfirm(true)}
              sx={{
                ...getStartIconSpacing(dir),
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {t.allSessions}
            </Button>
            {sessions.length > 0 && (
              <Button
                variant="contained"
                color="primary"
                startIcon={
                  exportLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <ICONS.download />
                  )
                }
                onClick={handleExport}
                disabled={exportLoading}
                sx={{
                  ...getStartIconSpacing(dir),
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {exportLoading ? t.exporting : t.exportResults}
              </Button>
            )}
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
            sx={{ pr: dir === "rtl" ? 1 : undefined }}
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
              <>
                {sessions.map((session) => {
                  const isTeamMode = session?.gameId?.isTeamMode;

                  if (!isTeamMode) {
                    // --- PVP CARD ---
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

                                  <Box
                                    display="flex"
                                    gap={1}
                                    alignItems="center"
                                  >
                                    <ICONS.business fontSize="small" />
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {player1?.playerId?.company || "N/A"}
                                    </Typography>
                                  </Box>

                                  <Box
                                    display="flex"
                                    gap={1}
                                    alignItems="center"
                                  >
                                    <ICONS.leaderboard fontSize="small" />
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {t.score}: {player1?.score ?? 0}
                                    </Typography>
                                  </Box>

                                  <Box
                                    display="flex"
                                    gap={1}
                                    alignItems="center"
                                  >
                                    <ICONS.assignment fontSize="small" />
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {t.attempted}:{" "}
                                      {player1?.attemptedQuestions ?? 0}
                                    </Typography>
                                  </Box>

                                  <Box
                                    display="flex"
                                    gap={1}
                                    alignItems="center"
                                  >
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

                                  <Box
                                    display="flex"
                                    gap={1}
                                    alignItems="center"
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {player2?.playerId?.company || "N/A"}
                                    </Typography>
                                    <ICONS.business fontSize="small" />
                                  </Box>

                                  <Box
                                    display="flex"
                                    gap={1}
                                    alignItems="center"
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {t.score}: {player2?.score ?? 0}
                                    </Typography>
                                    <ICONS.leaderboard fontSize="small" />
                                  </Box>

                                  <Box
                                    display="flex"
                                    gap={1}
                                    alignItems="center"
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {t.attempted}:{" "}
                                      {player2?.attemptedQuestions ?? 0}
                                    </Typography>
                                    <ICONS.assignment fontSize="small" />
                                  </Box>

                                  <Box
                                    display="flex"
                                    gap={1}
                                    alignItems="center"
                                  >
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
                    );
                  }

                  // --- TEAM MODE CARD ---
                  return (
                    <Fade in timeout={500} key={session._id}>
                      <Paper
                        elevation={8}
                        sx={{
                          borderRadius: 4,
                          my: 3,
                          background:
                            "linear-gradient(to bottom, #f7f7f7, #ffffff)",
                          boxShadow: "0px 6px 20px rgba(0,0,0,0.08)",
                          p: { xs: 2, sm: 3 },
                        }}
                      >
                        {/* Winner Banner */}
                        <Box
                          sx={{
                            background: session.winnerTeamId
                              ? "linear-gradient(to right, #4CAF50, #81C784)"
                              : "linear-gradient(to right, #9E9E9E, #BDBDBD)",
                            px: 3,
                            py: 1.5,
                            borderRadius: 2,
                            mb: 3,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          <ICONS.trophy sx={{ color: "#fff" }} />
                          <Typography
                            variant="h6"
                            color="#fff"
                            fontWeight="bold"
                            sx={{ textAlign: "center" }}
                          >
                            {session.winnerTeamId?.name || t.tie}
                          </Typography>
                        </Box>

                        {/* Teams */}
                        <Grid
                          container
                          spacing={2}
                          justifyContent="center"
                          alignItems="stretch"
                          sx={{ position: "relative" }}
                        >
                          {session.teams?.map((team, idx) => {
                            const isWinner =
                              session.winnerTeamId?._id === team.teamId;

                            return (
                              <Grid
                                item
                                xs={12}
                                sm={session.teams?.length === 2 ? 6 : 12}
                                key={idx}
                              >
                                <Paper
                                  elevation={isWinner ? 6 : 1}
                                  sx={{
                                    height: "100%",
                                    borderRadius: 3,
                                    p: { xs: 2, sm: 2.5 },
                                    background: isWinner
                                      ? "linear-gradient(135deg,#A5D6A7,#C8E6C9)"
                                      : "#fafafa",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.5,
                                    transition: "all 0.2s ease",
                                  }}
                                >
                                  {/* Team Name */}
                                  <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{
                                      textAlign: "center",
                                      color: "text.primary",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {team.teamName ||
                                      team.teamId?.name ||
                                      `${t.teams} ${idx + 1}`}
                                  </Typography>

                                  {/* Totals */}
                                  <Stack
                                    direction="row"
                                    spacing={2}
                                    justifyContent="center"
                                    alignItems="center"
                                    divider={
                                      <Divider
                                        orientation="vertical"
                                        flexItem
                                      />
                                    }
                                    sx={{
                                      flexWrap: "wrap",
                                      bgcolor: "white",
                                      borderRadius: 2,
                                      py: 0.7,
                                      px: 1.5,
                                    }}
                                  >
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={0.6}
                                    >
                                      <ICONS.leaderboard
                                        fontSize="small"
                                        color="action"
                                      />
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {t.totalScore}:{" "}
                                        <b>{team.totalScore ?? 0}</b>
                                      </Typography>
                                    </Box>
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={0.6}
                                    >
                                      <ICONS.time
                                        fontSize="small"
                                        color="action"
                                      />
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {t.averageTime}:{" "}
                                        <b>{team.avgTimeTaken ?? 0}s</b>
                                      </Typography>
                                    </Box>
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={0.6}
                                    >
                                      <ICONS.assignment
                                        fontSize="small"
                                        color="action"
                                      />
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {t.averageAttempted}:{" "}
                                        <b>{team.avgAttemptedQuestions ?? 0}</b>
                                      </Typography>
                                    </Box>
                                  </Stack>

                                  <Divider sx={{ my: 1 }} />

                                  {/* Players */}
                                  <Stack spacing={1}>
                                    {team.players?.map((p, i) => (
                                      <Paper
                                        key={i}
                                        elevation={0}
                                        sx={{
                                          p: 1.2,
                                          borderRadius: 2,
                                          bgcolor: "#fff",
                                          display: "flex",
                                          flexDirection: {
                                            xs: "column",
                                            sm: "row",
                                          },
                                          justifyContent: "space-between",
                                          alignItems: {
                                            xs: "flex-start",
                                            sm: "center",
                                          },
                                          boxShadow:
                                            "0 1px 3px rgba(0,0,0,0.05)",
                                          gap: { xs: 0.5, sm: 0 },
                                        }}
                                      >
                                        <Box sx={{ flexGrow: 1 }}>
                                          <Typography
                                            variant="subtitle2"
                                            fontWeight="bold"
                                            sx={{
                                              color: "text.primary",
                                              wordBreak: "break-word",
                                            }}
                                          >
                                            {p.name ||
                                              p.playerId?.name ||
                                              t.unknown}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                              display: "block",
                                              wordBreak: "break-word",
                                            }}
                                          >
                                            {p.company ||
                                              p.playerId?.company ||
                                              "N/A"}
                                          </Typography>
                                        </Box>

                                        <Stack
                                          direction="row"
                                          spacing={2}
                                          alignItems="center"
                                          justifyContent={{
                                            xs: "flex-start",
                                            sm: "flex-end",
                                          }}
                                          flexWrap="wrap"
                                          sx={{
                                            width: { xs: "100%", sm: "auto" },
                                          }}
                                        >
                                          <Box
                                            display="flex"
                                            alignItems="center"
                                            gap={0.4}
                                          >
                                            <ICONS.leaderboard fontSize="small" />
                                            <Typography variant="caption">
                                              {t.score}: {p.score ?? 0}
                                            </Typography>
                                          </Box>
                                          <Box
                                            display="flex"
                                            alignItems="center"
                                            gap={0.4}
                                          >
                                            <ICONS.assignment fontSize="small" />
                                            <Typography variant="caption">
                                              {t.attempted}:{" "}
                                              {p.attemptedQuestions ?? 0}
                                            </Typography>
                                          </Box>
                                          <Box
                                            display="flex"
                                            alignItems="center"
                                            gap={0.4}
                                          >
                                            <ICONS.time fontSize="small" />
                                            <Typography variant="caption">
                                              {t.timeTaken}: {p.timeTaken ?? 0}s
                                            </Typography>
                                          </Box>
                                        </Stack>
                                      </Paper>
                                    ))}
                                  </Stack>
                                </Paper>
                              </Grid>
                            );
                          })}

                          {/* VS Badge */}
                          {session.teams?.length === 2 && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                background: "#fff",
                                border: "2px solid #ccc",
                                px: 2.5,
                                py: 0.5,
                                borderRadius: "50px",
                                fontWeight: "bold",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                                zIndex: 2,
                                fontSize: "1rem",
                              }}
                            >
                              VS
                            </Box>
                          )}
                        </Grid>
                      </Paper>
                    </Fade>
                  );
                })}

                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    dir="ltr"
                    count={Math.ceil(totalSessions / limit)}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                  />
                </Box>
              </>
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
        confirmButtonText={t.delete}
        confirmButtonIcon={<ICONS.delete />}
      />
    </Container>
  );
}
