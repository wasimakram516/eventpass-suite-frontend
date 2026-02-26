"use client";

import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Typography,
  Tooltip,
  Divider,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  AccessTime,
  TouchApp,
  Replay,
  Speed,
  CheckCircle,
  Download,
} from "@mui/icons-material";
import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import { useMessage } from "@/contexts/MessageContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getGameBySlug } from "@/services/tapmatch/gameService";
import {
  getLeaderboard,
  exportResults,
} from "@/services/tapmatch/playerService";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import NoDataAvailable from "@/components/NoDataAvailable";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    resultsTitle: "Results for",
    totalPlayers: "Total Players:",
    exportResults: "Export Results",
    exportTooltip: "Export Results",
    matchesLabel: "Matches",
    movesLabel: "Moves",
    missesLabel: "Misses",
    completionTimeLabel: "Time Taken",
    accuracyLabel: "Accuracy",
    submittedAtLabel: "Completed At",
    errorLoading: "Error loading data.",
    exported: "Exported results!",
    showing: "Showing",
    of: "of",
    records: "records",
    perPage: "Per page",
  },
  ar: {
    resultsTitle: "نتائج",
    totalPlayers: "إجمالي اللاعبين:",
    exportResults: "تصدير النتائج",
    exportTooltip: "تصدير النتائج",
    matchesLabel: "التطابقات",
    movesLabel: "المحاولات",
    missesLabel: "الأخطاء",
    completionTimeLabel: "الوقت المستغرق",
    accuracyLabel: "الدقة",
    submittedAtLabel: "انتهى في",
    errorLoading: "حدث خطأ أثناء تحميل البيانات.",
    exported: "تم تصدير النتائج!",
    showing: "عرض",
    of: "من",
    records: "سجل",
    perPage: "لكل صفحة",
  },
};

function playerMatchesSearch(player, term) {
  const t = term.toLowerCase();
  const haystack = [player.name, player.company, player.phone]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(t);
}

export default function TapMatchResultsPage() {
  const { gameSlug } = useParams();
  const searchParams = useSearchParams();
  const { showMessage } = useMessage();
  const { t, dir } = useI18nLayout(translations);
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInitialized, setSearchInitialized] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    if (!searchInitialized) {
      const param = searchParams.get("search");
      if (param) {
        setSearchTerm(param.trim());
        setPage(1);
      }
      setSearchInitialized(true);
    }
  }, [searchInitialized, searchParams]);

  const filteredPlayers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return players;
    return players.filter((p) => playerMatchesSearch(p, term));
  }, [players, searchTerm]);

  const useSearchMode = Boolean(searchTerm.trim());
  const displayPlayers = useSearchMode ? filteredPlayers : players;
  const displayTotal = useSearchMode ? filteredPlayers.length : totalRecords;
  const displayTotalPages = useSearchMode
    ? Math.ceil(filteredPlayers.length / limit) || 1
    : totalPages;

  useEffect(() => {
    const fetchGameAndResults = async () => {
      try {
        setLoading(true);
        const gameData = await getGameBySlug(gameSlug);
        if (gameData) {
          setGame(gameData);
          if (searchTerm.trim()) {
            const leaderboard = await getLeaderboard(gameData._id, 1, 1000);
            setPlayers(leaderboard.results || []);
            setTotalPages(1);
            setTotalRecords((leaderboard.results || []).length);
          } else {
            const leaderboard = await getLeaderboard(gameData._id, page, limit);
            setPlayers(leaderboard.results || []);
            setTotalPages(leaderboard.totalPages || 0);
            setTotalRecords(leaderboard.total || 0);
          }
        }
      } catch (err) {
        showMessage(t.errorLoading, "error");
      } finally {
        setLoading(false);
      }
    };
    if (gameSlug) fetchGameAndResults();
  }, [gameSlug, page, limit, searchTerm]);

  const handleExport = async () => {
    if (!game) return;
    setExporting(true);
    await exportResults(game._id);
    showMessage(t.exported, "success");
    setExporting(false);
  };

  const paginatedDisplay =
    useSearchMode
      ? filteredPlayers.slice((page - 1) * limit, page * limit)
      : players;
  const fromRecord = (page - 1) * limit + 1;
  const toRecord = Math.min(page * limit, displayTotal);

  return (
    <Box
      sx={{ position: "relative", width: "100%", maxWidth: "90vw" }}
      dir={dir}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <BreadcrumbsNav />

          {/* Header Section */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", sm: "center" },
              mt: 2,
              mb: 1,
              gap: { xs: 1, sm: 2 },
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ fontSize: { xs: "1.1rem", sm: "1.5rem" } }}
              >
                {t.resultsTitle} "{game?.title}"
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t.totalPlayers} <strong>{displayTotal}</strong>
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              <Tooltip title={t.exportTooltip}>
                <Button
                  variant="contained"
                  startIcon={
                    exporting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Download />
                    )
                  }
                  onClick={handleExport}
                  disabled={exporting}
                  sx={getStartIconSpacing(dir)}
                >
                  {t.exportResults}
                </Button>
              </Tooltip>
            </Box>
          </Box>

          <Divider sx={{ mt: 2 }} />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              mt: 2,
              gap: 2,
            }}
          >
            {/* Record range info */}
            <Typography variant="body2" color="text.secondary">
              {t.showing} <strong>{fromRecord}</strong>–
              <strong>{toRecord}</strong> {t.of} <strong>{displayTotal}</strong>{" "}
              {t.records}
            </Typography>
            {/* Per page selector */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t.perPage}</InputLabel>
              <Select
                value={limit}
                label={t.perPage}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[5, 10, 15, 20, 50].map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Loading / Data Section */}
        {loading ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : paginatedDisplay.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <>
            <Grid
              container
              spacing={{ xs: 1, sm: 3 }}
              justifyContent="center"
              sx={{ width: "100%", maxWidth: "100%" }}
            >
              {paginatedDisplay.map((p, i) => (
                <Grid item xs={12} sm={6} md={4} key={p.sessionId || i}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      background: "#fff",
                      boxShadow: 2,
                      transition: "0.3s",
                      "&:hover": { boxShadow: 4 },
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color="primary.main"
                      mb={1}
                    >
                      #{(page - 1) * limit + (i + 1)} • {p.name}
                    </Typography>

                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CheckCircle
                          fontSize="small"
                          sx={{ mr: 1, color: "success.main" }}
                        />
                        <Typography variant="body2">
                          {t.matchesLabel}: <strong>{p.matches}</strong>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <TouchApp
                          fontSize="small"
                          sx={{ mr: 1, color: "primary.main" }}
                        />
                        <Typography variant="body2">
                          {t.movesLabel}: <strong>{p.moves}</strong>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Replay
                          fontSize="small"
                          sx={{ mr: 1, color: "error.main" }}
                        />
                        <Typography variant="body2">
                          {t.missesLabel}: <strong>{p.misses}</strong>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Speed
                          fontSize="small"
                          sx={{ mr: 1, color: "primary.main" }}
                        />
                        <Typography variant="body2">
                          {t.accuracyLabel}: <strong>{p.accuracy}%</strong>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <AccessTime
                          fontSize="small"
                          sx={{ mr: 1, color: "primary.main" }}
                        />
                        <Typography variant="body2" fontStyle="italic">
                          {t.completionTimeLabel}:{" "}
                          <strong>{p.totalTime}s</strong>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <AccessTime
                          fontSize="small"
                          sx={{ mr: 1, color: "text.secondary" }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontStyle="italic"
                        >
                          {t.submittedAtLabel}:{" "}
                          <strong>{formatDateTimeWithLocale(p.endTime)}</strong>
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 2,
                gap: 2,
              }}
            >
              {/* Pagination controls */}
              <Pagination
                dir="ltr"
                count={displayTotalPages}
                page={page}
                onChange={(e, val) => setPage(val)}
              />
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}
