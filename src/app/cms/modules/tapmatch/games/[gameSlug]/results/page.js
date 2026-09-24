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
} from "@mui/material";
import ArabicPagination from "@/components/ArabicPagination";
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
import ResultsToolbar from "@/components/results/ResultsToolbar";
import { useMessage } from "@/contexts/MessageContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useHasPermission } from "@/hooks/usePermission";
import useDebouncedSearch from "@/hooks/useDebouncedSearch";
import { useGameResultsStream } from "@/hooks/useGameResultsSocket";
import { getGameBySlug } from "@/services/tapmatch/gameService";
import {
  getLeaderboard,
  exportResults,
} from "@/services/tapmatch/playerService";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import { toArabicDigits } from "@/utils/arabicDigits";
import NoDataAvailable from "@/components/NoDataAvailable";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    resultsTitle: "Results for",
    totalPlayers: "Total Players:",
    playOf: "Play {n} of {m}",
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
    perPage: "Records per page",
    searchPlaceholder: "Search...",
  },
  ar: {
    resultsTitle: "نتائج",
    totalPlayers: "إجمالي اللاعبين:",
    playOf: "اللعبة {n} من {m}",
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
    perPage: "السجلات لكل صفحة",
    searchPlaceholder: "بحث...",
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

// A linked registration counts as one player no matter how many plays; an
// unlinked play counts on its own.
function countUniquePlayers(rows) {
  const linked = new Set();
  let unlinked = 0;
  for (const row of rows || []) {
    if (row.eventRegRegistrationId) linked.add(String(row.eventRegRegistrationId));
    else unlinked += 1;
  }
  return linked.size + unlinked;
}

export default function TapMatchResultsPage() {
  const { gameSlug } = useParams();
  const searchParams = useSearchParams();
  const { showMessage } = useMessage();
  const { t, dir, language } = useI18nLayout(translations);
  const canExport = useHasPermission("tapmatch", "export");
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [uniquePlayers, setUniquePlayers] = useState(0);
  const [gameId, setGameId] = useState(null);

  const { searchTerm, rawSearch, setRawSearch } = useDebouncedSearch({
    initial: searchParams.get("search") || "",
    onCommit: () => setPage(1),
  });

  // Accumulate streamed batches (and stale-guard against a reset) into the
  // existing list, then let the "load more" indicator follow the stream.
  const { rows: players, setRows: setPlayers, loadingMore } = useGameResultsStream({
    gameId,
    getId: (row) => String(row.sessionId || row._id),
  });

  const filteredPlayers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return players;
    return players.filter((p) => playerMatchesSearch(p, term));
  }, [players, searchTerm]);

  const useSearchMode = Boolean(searchTerm.trim());
  const displayPlayers = useSearchMode ? filteredPlayers : players;
  const displayTotal = useSearchMode ? filteredPlayers.length : totalRecords;
  const displayUniquePlayers = useSearchMode ? countUniquePlayers(filteredPlayers) : uniquePlayers;
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
          setGameId(gameData._id);
          const leaderboard = await getLeaderboard(gameData._id);
          const rows = leaderboard.results || [];
          setPlayers(rows);
          setUniquePlayers(leaderboard.uniquePlayers ?? countUniquePlayers(rows));
          setTotalPages(leaderboard.total ? Math.ceil(leaderboard.total / limit) : 0);
          setTotalRecords(leaderboard.total || rows.length);
        }
      } catch (err) {
        showMessage(t.errorLoading, "error");
      } finally {
        setLoading(false);
      }
    };
    if (gameSlug) fetchGameAndResults();
  }, [gameSlug, limit]);

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
      <Container maxWidth={false} disableGutters>
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
                sx={{
                  fontWeight: "bold",
                  fontSize: { xs: "1.1rem", sm: "1.5rem" }
                }}>
                {t.resultsTitle} "{game?.title}"
              </Typography>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                {t.totalPlayers} <strong>{toArabicDigits(displayUniquePlayers, language)}</strong>
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
              {canExport && (
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
              )}
            </Box>
          </Box>

          <Divider sx={{ mt: 2 }} />
          <ResultsToolbar
            dir={dir}
            showing={
              <>
                {t.showing} <strong>{fromRecord}</strong>–
                <strong>{toRecord}</strong> {t.of} <strong>{displayTotal}</strong>{" "}
                {t.records}
              </>
            }
            searchTerm={rawSearch}
            onSearchChange={setRawSearch}
            perPage={limit}
            onPerPageChange={(value) => {
              setLimit(value);
              setPage(1);
            }}
            perPageLabel={t.perPage}
            searchPlaceholder={t.searchPlaceholder}
          />
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
              sx={{
                justifyContent: "center",
                width: "100%",
                maxWidth: "100%"
              }}>
              {paginatedDisplay.map((p, i) => (
                <Grid
                  key={p.sessionId || i}
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 4
                  }}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      bgcolor: "background.paper",
                      boxShadow: 2,
                      transition: "0.3s",
                      "&:hover": { boxShadow: 4 },
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        color: "primary.main",
                        mb: 1
                      }}>
                      #{(page - 1) * limit + (i + 1)} • {p.name}
                    </Typography>

                    {p.email && p.email !== p.name ? (
                      <Typography
                        variant="body2"
                        sx={{ display: "block", color: "text.secondary", mb: 1, wordBreak: "break-word" }}
                      >
                        {p.email}
                      </Typography>
                    ) : null}

                    {p.playNumber ? (
                      <Typography
                        variant="caption"
                        sx={{ display: "block", color: "text.secondary", mb: 1 }}
                      >
                        {t.playOf
                          .replace("{n}", toArabicDigits(p.playNumber, language))
                          .replace("{m}", toArabicDigits(p.totalPlays, language))}
                      </Typography>
                    ) : null}

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
                        <Typography variant="body2" sx={{
                          fontStyle: "italic"
                        }}>
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
                          sx={{
                            color: "text.secondary",
                            fontStyle: "italic"
                          }}>
                          {t.submittedAtLabel}:{" "}
                          <strong>{formatDateTimeWithLocale(p.endTime, language === "ar" ? "ar-SA" : "en-GB")}</strong>
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
              <ArabicPagination
                count={displayTotalPages}
                page={page}
                onChange={(e, val) => setPage(val)}
              />
            </Box>

            {loadingMore && (
              <Box sx={{ textAlign: "center", my: 2 }}>
                <CircularProgress size={20} />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
