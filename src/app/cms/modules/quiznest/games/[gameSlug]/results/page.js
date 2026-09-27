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
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ScoreIcon from "@mui/icons-material/Score";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import ArabicPagination from "@/components/ArabicPagination";
import ResultsToolbar from "@/components/results/ResultsToolbar";

import { useMessage } from "@/contexts/MessageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useHasPermission } from "@/hooks/usePermission";
import useI18nLayout from "@/hooks/useI18nLayout";
import useDebouncedSearch from "@/hooks/useDebouncedSearch";
import { getGameBySlug } from "@/services/quiznest/gameService";
import {
  getLeaderboard,
  exportResults,
} from "@/services/quiznest/playerService";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import { toArabicDigits } from "@/utils/arabicDigits";
import ICONS from "@/utils/iconUtil";
import NoDataAvailable from "@/components/NoDataAvailable";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { useGameResultsStream } from "@/hooks/useGameResultsSocket";
const translations = {
  en: {
    resultsTitle: "Results for",
    totalPlayers: "Total Players:",
    playOf: "Play {n} of {m}",
    exportResults: "Export Results",
    exportTooltip: "Export Results",
    scoreLabel: "Score:",
    timeTakenLabel: "Time Taken:",
    attemptedLabel: "Attempted:",
    submittedAtLabel: "Submitted At:",
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
    scoreLabel: "النقاط:",
    timeTakenLabel: "الوقت المستغرق:",
    attemptedLabel: "المحاولات:",
    submittedAtLabel: "تم الإرسال في:",
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

export default function ResultsPage() {
  const { gameSlug } = useParams();
  const searchParams = useSearchParams();
  const { showMessage } = useMessage();
  const [game, setGame] = useState(null);
  const [uniquePlayers, setUniquePlayers] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t, dir, language } = useI18nLayout(translations);
  const canExport = useHasPermission("quiznest", "export");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
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
  const displayTotal = useSearchMode ? filteredPlayers.length : totalRecords;
  const displayUniquePlayers = useSearchMode ? countUniquePlayers(filteredPlayers) : uniquePlayers;
  const displayTotalPages = useSearchMode
    ? Math.ceil(filteredPlayers.length / limit) || 1
    : totalPages;

  // Fetch first batch via API; the rest arrives over the socket stream.
  // Runs on game/page-size change only (search is client-side over the
  // accumulated list, so it never refetches).
  useEffect(() => {
    const fetchGameAndResults = async () => {
      setLoading(true);
      const gameData = await getGameBySlug(gameSlug);
      setGame(gameData);
      setGameId(gameData._id);
      const leaderboard = await getLeaderboard(gameData._id);
      const rows = leaderboard?.results || [];
      setPlayers(rows);
      setUniquePlayers(leaderboard?.uniquePlayers ?? countUniquePlayers(rows));
      setTotalPages(leaderboard?.total ? Math.ceil(leaderboard.total / limit) : 0);
      setTotalRecords(leaderboard?.total || rows.length);
      setLoading(false);
    };
    if (gameSlug) fetchGameAndResults();
  }, [gameSlug, limit, setPlayers]);

  const paginatedDisplay = useSearchMode
    ? filteredPlayers.slice((page - 1) * limit, page * limit)
    : players.slice((page - 1) * limit, page * limit);
  const fromRecord = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const toRecord = totalRecords === 0 ? 0 : Math.min(page * limit, displayTotal);

  // Export results as Excel file
  const handleExport = async () => {
    if (!game) return;
    await exportResults(game._id);
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: "90vw",
      }}
      dir={dir}
    >
      <Container maxWidth={false} disableGutters>
        <Box sx={{ mb: 4 }}>
          <BreadcrumbsNav />

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
              width: "100%",
              maxWidth: "100%",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  fontSize: { xs: "1.1rem", sm: "1.5rem" },
                  lineHeight: { xs: 1.2, sm: 1.5 },
                  wordBreak: "break-word"
                }}>
                {t.resultsTitle} "{game?.title}"
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "0.8rem", sm: "0.875rem" }
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
                minWidth: { xs: 0, sm: "auto" },
              }}
            >
              {canExport && (
                <Tooltip title={t.exportResults}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
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
                {t.showing} <strong>{toArabicDigits(fromRecord, language)}</strong>–
                <strong>{toArabicDigits(toRecord, language)}</strong> {t.of}{" "}
                <strong>{toArabicDigits(displayTotal, language)}</strong>{" "}
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
              {paginatedDisplay?.map((p, i) => {
                const rank = (page - 1) * limit + (i + 1);
                return (
                  <Grid
                    key={p.sessionId || i}
                    sx={{ width: { xs: "100%", sm: "auto" }, minWidth: 0 }}
                    size={{
                      xs: 12,
                      sm: 6,
                      md: 4
                    }}>
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: { xs: "none", sm: 360 },
                        mx: { xs: 0, sm: "auto" },
                        height: "100%",
                        p: 3,
                        borderRadius: 3,
                       bgcolor: "background.paper",
                        boxShadow: 2,
                        display: "flex",
                        flexDirection: "column",
                        transition: "0.3s ease",
                        "&:hover": {
                          boxShadow: 4,
                        },
                      }}
                    >
                      {/* Rank */}
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        {rank < 4 && (
                          <ICONS.trophy
                            color={
                              rank === 1 ? "warning" : rank === 2 ? "secondary" : "info"
                            }
                            sx={{ mr: 1 }}
                          />
                        )}
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: "bold",
                            color: "primary.main",
                            fontSize: { xs: "0.9rem", sm: "1.25rem" },
                            lineHeight: { xs: 1.2, sm: 1.4 },
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            whiteSpace: "normal"
                          }}>
                          #{toArabicDigits(rank, language)} • {p.name}
                        </Typography>
                      </Box>

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

                      {/* Details */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <ScoreIcon
                            fontSize="small"
                            sx={{ mr: 1, color: "primary.main" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              lineHeight: { xs: 1.2, sm: 1.4 },
                              wordBreak: "break-word",
                            }}
                          >
                            {t.scoreLabel} <strong>{toArabicDigits(p.score, language)}</strong>
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <AccessTimeIcon
                            fontSize="small"
                            sx={{ mr: 1, color: "primary.main" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              lineHeight: { xs: 1.2, sm: 1.4 },
                              wordBreak: "break-word",
                            }}
                          >
                            {t.timeTakenLabel} <strong>{toArabicDigits(p.timeTaken, language)}s</strong>
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <EditNoteIcon
                            fontSize="small"
                            sx={{ mr: 1, color: "primary.main" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              lineHeight: { xs: 1.2, sm: 1.4 },
                              wordBreak: "break-word",
                            }}
                          >
                            {t.attemptedLabel}{" "}
                            <strong>{toArabicDigits(p.attemptedQuestions, language)}</strong>
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <AccessTimeIcon
                            fontSize="small"
                            sx={{ mr: 1, color: "primary.main" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontStyle: "italic",
                              fontSize: { xs: "0.7rem", sm: "0.85rem" },
                              lineHeight: { xs: 1.2, sm: 1.4 },
                              wordBreak: "break-word"
                            }}>
                            {t.submittedAtLabel}{" "}
                            <strong>{formatDateTimeWithLocale(p.endTime, language === "ar" ? "ar-SA" : "en-GB")}</strong>
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {loadingMore && (
              <Box sx={{ textAlign: "center", my: 2 }}>
                <CircularProgress size={20} />
              </Box>
            )}

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 2,
                gap: 2,
              }}
            >
              <ArabicPagination
                count={displayTotalPages || 1}
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
