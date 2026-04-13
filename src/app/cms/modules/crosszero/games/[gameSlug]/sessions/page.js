"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box, Container, Typography, Stack, Divider, Paper, Grid, Fade,
  Button, CircularProgress, Pagination, FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import CrossZeroMarkVisual from "@/components/crosszero/CrossZeroMarkVisual";
import NoDataAvailable from "@/components/NoDataAvailable";
import LoadingState from "@/components/LoadingState";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getAllSessions, resetSessions, exportResults } from "@/services/crosszero/gameSessionService";

const translations = {
  en: {
    title: "PvP Sessions",
    description: "View and manage CrossZero PvP sessions.",
    resetSessions: "Reset Sessions",
    exportResults: "Export Results",
    exporting: "Exporting...",
    confirmResetTitle: "Reset All Sessions?",
    confirmResetMessage: "This will move all sessions to the Recycle Bin. Continue?",
    delete: "Reset",
    player1: "Player 1", player2: "Player 2",
    wins: "Wins", winner: "Winner", tie: "Draw",
    unknown: "Unknown", noData: "No sessions found.",
    recordsPerPage: "Per page", showing: "Showing", to: "to", of: "of", records: "sessions",
    moves: "Moves", timeTaken: "Time",
    company: "Company",
    exported: "Exported!",
  },
  ar: {
    title: "جلسات PvP",
    description: "عرض وإدارة جلسات CrossZero PvP.",
    resetSessions: "إعادة تعيين الجلسات",
    exportResults: "تصدير النتائج",
    exporting: "جاري التصدير...",
    confirmResetTitle: "إعادة تعيين جميع الجلسات؟",
    confirmResetMessage: "سيتم نقل جميع الجلسات إلى سلة المحذوفات. هل تريد المتابعة؟",
    delete: "إعادة تعيين",
    player1: "اللاعب الأول", player2: "اللاعب الثاني",
    wins: "فاز", winner: "الفائز", tie: "تعادل",
    unknown: "غير معروف", noData: "لا توجد جلسات.",
    recordsPerPage: "لكل صفحة", showing: "عرض", to: "إلى", of: "من", records: "جلسات",
    moves: "الحركات", timeTaken: "الوقت",
    company: "الشركة",
    exported: "تم التصدير!",
  },
};

const RESULT_MAP = {
  X_wins: { mark: "X", symbolColor: "#00e5ff", bg: "linear-gradient(to right, #00b4d8, #0077b6)" },
  O_wins: { mark: "O", symbolColor: "#ff6b6b", bg: "linear-gradient(to right, #ff6b6b, #c0392b)" },
  draw:   { mark: null, symbolColor: null, bg: "linear-gradient(to right, #9E9E9E, #BDBDBD)" },
};

export default function CrossZeroPvPSessionsPage() {
  const { gameSlug } = useParams();
  const { t, dir } = useI18nLayout(translations);

  const [sessions, setSessions] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const res = await getAllSessions(gameSlug, page, limit);
      if (!res.error) {
        setSessions(res.sessions || []);
        setTotalSessions(res.totalCount ?? 0);
      }
      setLoading(false);
    };
    if (gameSlug) fetch();
  }, [gameSlug, page, limit]);

  const handleReset = async () => {
    const res = await resetSessions(gameSlug);
    if (!res.error) setSessions([]);
    setShowConfirm(false);
  };

  const handleExport = async () => {
    setExportLoading(true);
    await exportResults(gameSlug);
    setExportLoading(false);
  };

  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, gap: 2, mb: 2, mt: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">{t.title}</Typography>
          <Typography variant="body2" color="text.secondary">{t.description}</Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button variant="contained" color="error" startIcon={<ICONS.delete />} onClick={() => setShowConfirm(true)} sx={getStartIconSpacing(dir)}>
            {t.resetSessions}
          </Button>
          {sessions.length > 0 && (
            <Button variant="contained" startIcon={exportLoading ? <CircularProgress size={18} color="inherit" /> : <ICONS.download />} onClick={handleExport} disabled={exportLoading} sx={getStartIconSpacing(dir)}>
              {exportLoading ? t.exporting : t.exportResults}
            </Button>
          )}
        </Stack>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t.showing} {(page - 1) * limit + 1}–{Math.min(page * limit, totalSessions)} {t.of} {totalSessions} {t.records}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t.recordsPerPage}</InputLabel>
          <Select value={limit} label={t.recordsPerPage} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
            {[5, 10, 20].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {loading ? <LoadingState /> : sessions.length === 0 ? <NoDataAvailable /> : (
        <Stack spacing={3} alignItems="center">
          <Box sx={{ width: "100%", maxWidth: 620 }}>
            {sessions.map((session) => {
              const p1 = session.players?.find((p) => p.playerType === "p1");
              const p2 = session.players?.find((p) => p.playerType === "p2");
              const xoStats = session.xoStats || {};
              const game = session.gameId || {};
              const resultInfo = RESULT_MAP[xoStats.result] || { mark: null, bg: "linear-gradient(to right, #9E9E9E, #BDBDBD)" };

              return (
                <Fade in timeout={400} key={session._id}>
                  <Paper elevation={5} sx={{ borderRadius: 4, my: 2.5, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                    {/* Result banner */}
                    <Box sx={{ background: resultInfo.bg, px: 3, py: 1.2, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                      {xoStats.result && xoStats.result !== "draw" && <ICONS.trophy sx={{ color: "#fff" }} />}
                      {resultInfo.mark && (
                        <CrossZeroMarkVisual
                          mark={resultInfo.mark}
                          xImage={game?.xImage}
                          oImage={game?.oImage}
                          size={22}
                          fallbackSize="1.3rem"
                          color={resultInfo.symbolColor}
                          shadow={`0 0 10px ${resultInfo.symbolColor}`}
                        />
                      )}
                      <Typography variant="h6" color="#fff" fontWeight="bold">
                        {xoStats.result === "draw" ? t.tie : t.wins}
                      </Typography>
                    </Box>

                    <Box sx={{ px: { xs: 2, sm: 4 }, py: 3, position: "relative" }}>
                      <Grid container spacing={3} direction={{ xs: "column", sm: "row" }} alignItems="stretch" justifyContent="space-between">
                        {/* P1 */}
                        <Grid item xs={12} sm={5.5}>
                          <Box sx={{ bgcolor: xoStats.result === "O_wins" ? "rgba(255,107,107,0.08)" : "grey.50", borderRadius: 3, p: 2.5, height: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                              <CrossZeroMarkVisual
                                mark="O"
                                xImage={game?.xImage}
                                oImage={game?.oImage}
                                size={18}
                                fallbackSize="1.1rem"
                              />
                              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>{t.player1}</Typography>
                            </Box>
                            <Typography variant="h6" fontWeight="bold">{p1?.playerId?.name || t.unknown}</Typography>
                            <Typography variant="body2" color="text.secondary">{p1?.playerId?.company || "—"}</Typography>
                            {xoStats.timeTaken > 0 && (
                              <Typography variant="body2" color="text.secondary">{t.timeTaken}: <strong>{xoStats.timeTaken}s</strong></Typography>
                            )}
                          </Box>
                        </Grid>

                        {/* VS */}
                        <Box sx={{ position: { xs: "static", sm: "absolute" }, top: "50%", left: "50%", transform: { xs: "none", sm: "translate(-50%, -50%)" }, bgcolor: "#fff", border: "2px solid #eee", px: 2, py: 0.5, borderRadius: "50px", fontWeight: "bold", width: "fit-content", mx: "auto", my: { xs: 1, sm: 0 }, zIndex: 2 }}>
                          VS
                        </Box>

                        {/* P2 */}
                        <Grid item xs={12} sm={5.5}>
                          <Box sx={{ bgcolor: xoStats.result === "X_wins" ? "rgba(0,180,216,0.08)" : "grey.50", borderRadius: 3, p: 2.5, height: "100%", display: "flex", flexDirection: "column", gap: 1, textAlign: { xs: "left", sm: "right" }, alignItems: { xs: "flex-start", sm: "flex-end" } }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                              <CrossZeroMarkVisual
                                mark="X"
                                xImage={game?.xImage}
                                oImage={game?.oImage}
                                size={18}
                                fallbackSize="1.1rem"
                              />
                              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>{t.player2}</Typography>
                            </Box>
                            <Typography variant="h6" fontWeight="bold">{p2?.playerId?.name || t.unknown}</Typography>
                            <Typography variant="body2" color="text.secondary">{p2?.playerId?.company || "—"}</Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Stats bar */}
                      {xoStats.moves > 0 && (
                        <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "center" }}>
                          <Typography variant="caption" color="text.secondary">{t.moves}: <strong>{xoStats.moves}</strong></Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Fade>
              );
            })}

            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination dir="ltr" count={Math.ceil(totalSessions / limit) || 1} page={page} onChange={(_, v) => setPage(v)} />
            </Box>
          </Box>
        </Stack>
      )}

      <ConfirmationDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleReset}
        title={t.confirmResetTitle}
        message={t.confirmResetMessage}
        confirmButtonText={t.delete}
        confirmButtonIcon={<ICONS.delete />}
      />
    </Container>
  );
}
