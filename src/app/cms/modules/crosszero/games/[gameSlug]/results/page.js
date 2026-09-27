"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Pagination,
  Typography,
  useTheme,
} from "@mui/material";
import ArabicPagination from "@/components/ArabicPagination";
import {
  AccessTime,
  Download,
  EmojiEvents,
} from "@mui/icons-material";
import LoadingState from "@/components/LoadingState";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import AppCard from "@/components/cards/AppCard";
import CrossZeroMarkVisual from "@/components/crosszero/CrossZeroMarkVisual";
import NoDataAvailable from "@/components/NoDataAvailable";
import ResultsToolbar from "@/components/results/ResultsToolbar";
import useI18nLayout from "@/hooks/useI18nLayout";
import useDebouncedSearch from "@/hooks/useDebouncedSearch";
import { useHasPermission } from "@/hooks/usePermission";
import { toArabicDigits } from "@/utils/arabicDigits";
import { getGameBySlug } from "@/services/crosszero/gameService";
import {
  exportResults,
  getSessionHistory,
} from "@/services/crosszero/playerService";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import { useGameResultsStream } from "@/hooks/useGameResultsSocket";

const translations = {
  en: {
    title: "AI Mode Results",
    resultsDescription: "Each card is one completed AI game.",
    totalRecords: "Total plays:",
    totalPlayers: "Total Players:",
    playOf: "Play {n} of {m}",
    exportResults: "Export Results",
    exporting: "Exporting...",
    timeTaken: "Time",
    moves: "Moves",
    playedAt: "Played At",
    showing: "Showing",
    of: "of",
    records: "records",
    perPage: "Records per page",
    searchPlaceholder: "Search...",
    X_wins: "AI Wins",
    O_wins: "Player Wins",
    draw: "Draw",
    noData: "No AI game results yet.",
  },
  ar: {
    title: "نتائج وضع الذكاء الاصطناعي",
    resultsDescription: "كل بطاقة لعبة ذكاء اصطناعي مكتملة واحدة.",
    totalRecords: "إجمالي الألعاب:",
    totalPlayers: "إجمالي اللاعبين:",
    playOf: "اللعبة {n} من {m}",
    exportResults: "تصدير النتائج",
    exporting: "جارٍ التصدير...",
    timeTaken: "الوقت",
    moves: "الحركات",
    playedAt: "تاريخ اللعب",
    showing: "عرض",
    of: "من",
    records: "سجل",
    perPage: "السجلات لكل صفحة",
    searchPlaceholder: "بحث...",
    X_wins: "فوز الذكاء الاصطناعي",
    O_wins: "فوز اللاعب",
    draw: "تعادل",
    noData: "لا توجد نتائج حتى الآن.",
  },
};
const DIFFICULTY_COLOR = {
  easy: "success",
  medium: "warning",
  hard: "error",
};

const mapSessionToRecord = (session) => {
  const playerEntry =
    session?.players?.find((player) => player?.playerType === "solo") ||
    session?.players?.[0] ||
    {};
  const player = playerEntry?.playerId || {};

  return {
    _id: session?._id,
    name: player?.name || "",
    company: player?.company || "",
    email: player?.eventRegEmail || "",
    playNumber: player?.eventRegPlayNumber,
    totalPlays: player?.eventRegTotalPlays,
    result: session?.xoStats?.result || "draw",
    difficulty: session?.xoStats?.difficulty || "",
    moves: session?.xoStats?.moves ?? 0,
    timeTaken: session?.xoStats?.timeTaken ?? playerEntry?.timeTaken ?? 0,
    submittedAt: session?.endTime || session?.createdAt || null,
  };
};

export default function CrossZeroAIResultsPage() {
  const { gameSlug } = useParams();
  const searchParams = useSearchParams();
  const { t, dir, language } = useI18nLayout(translations);
  const theme = useTheme();
  const canExport = useHasPermission("crosszero", "export");
  const RESULT_STYLE = {
    O_wins: {
      color: theme.palette.crosszero.resultCardO.color,
      bg: theme.palette.crosszero.resultCardO.bg,
      mark: "O",
      symbolColor: theme.palette.crosszero.resultCardO.symbolColor,
      icon: <EmojiEvents fontSize="small" sx={{ color: theme.palette.crosszero.resultCardO.color }} />,
    },
    X_wins: {
      color: theme.palette.crosszero.resultCardX.color,
      bg: theme.palette.crosszero.resultCardX.bg,
      mark: "X",
      symbolColor: theme.palette.crosszero.resultCardX.symbolColor,
      icon: null,
    },
    draw: {
      color: theme.palette.crosszero.resultCardDraw.color,
      bg: theme.palette.crosszero.resultCardDraw.bg,
      mark: null,
      symbolColor: null,
      icon: null,
    },
  };
  const [game, setGame] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [uniquePlayers, setUniquePlayers] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const { searchTerm, rawSearch, setRawSearch } = useDebouncedSearch({
    initial: searchParams.get("search") || "",
    onCommit: () => setPage(1),
  });

  const { rows: records, setRows: setRecords, loadingMore } = useGameResultsStream({ gameId, getId: (r) => String(r._id) });

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return records;
    return records.filter((r) =>
      [r.name, r.company, r.email].filter(Boolean).some((v) => v.toLowerCase().includes(term))
    );
  }, [records, searchTerm]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);

      const gameData = await getGameBySlug(gameSlug);
      if (gameData && !gameData.error) {
        setGame(gameData);
        setGameId(gameData._id);

        const history = await getSessionHistory(gameData._id);
        if (!history.error) {
          const mappedRecords = (history.sessions || []).map(mapSessionToRecord);
          setRecords(mappedRecords);
          setUniquePlayers(history.uniquePlayers ?? 0);
          setTotalRecords(history.totalCount || mappedRecords.length);
          setTotalPages(
            history.totalCount ? Math.ceil(history.totalCount / limit) : 0
          );
        } else {
          setRecords([]);
          setTotalPages(0);
          setTotalRecords(0);
        }
      }

      setLoading(false);
    };

    if (gameSlug) {
      fetchResults();
    }
  }, [gameSlug, limit, setRecords]);

  // Client-side page slice over the accumulated list.
  const displayRecords = searchTerm.trim() ? filteredRecords : records;
  const displayTotalRecords = searchTerm.trim() ? filteredRecords.length : totalRecords;
  const paginatedRecords = displayRecords.slice((page - 1) * limit, page * limit);

  const handleExport = async () => {
    if (!game) return;
    setExportLoading(true);
    await exportResults(game._id);
    setExportLoading(false);
  };

  const fromRecord = displayTotalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const toRecord = displayTotalRecords === 0 ? 0 : Math.min(page * limit, displayTotalRecords);

  return (
    <Box
      dir={dir}
      sx={{ position: "relative", width: "100%", maxWidth: "90vw" }}
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
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography variant="h5" sx={{
                fontWeight: "bold"
              }}>
                {t.title} - &quot;{game?.title}&quot;
              </Typography>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                {t.resultsDescription}
              </Typography>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                {t.totalRecords} <strong>{toArabicDigits(totalRecords, language)}</strong>
              </Typography>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                {t.totalPlayers} <strong>{toArabicDigits(uniquePlayers, language)}</strong>
              </Typography>
            </Box>
            {canExport && (
              <Button
                variant="contained"
                startIcon={
                  exportLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Download />
                  )
                }
                onClick={handleExport}
                disabled={exportLoading}
                sx={getStartIconSpacing(dir)}
              >
                {exportLoading ? t.exporting : t.exportResults}
              </Button>
            )}
          </Box>
          <Divider sx={{ mt: 2 }} />
          <ResultsToolbar
            dir={dir}
            showing={
              <>
                {t.showing} <strong>{toArabicDigits(fromRecord, language)}</strong>-<strong>{toArabicDigits(toRecord, language)}</strong>{" "}
                {t.of} <strong>{toArabicDigits(displayTotalRecords, language)}</strong> {t.records}
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
          <LoadingState />
        ) : records.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <>
            <Grid
              container
              spacing={{ xs: 1.5, sm: 2.5 }}
              sx={{
                justifyContent: "center",

                "& > *": {
                  width: { xs: "100%", sm: "auto" },
                }
              }}>
              {paginatedRecords.map((record, index) => {
                const style = RESULT_STYLE[record.result] || RESULT_STYLE.draw;

                return (
                  <Grid
                    key={record._id || index}
                    sx={{
                      display: "flex",
                      justifyContent: "center"
                    }}
                    size={{
                      xs: 12,
                      sm: 6,
                      md: 6,
                      lg: 4
                    }}>
                    <AppCard
                      sx={{
                        p: { xs: 2, sm: 2.5 },
                        width: { xs: "100%", sm: 360 },
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        noWrap
                        sx={{
                          fontWeight: "bold",
                          color: "primary.main"
                        }}>
                        {record.name || "-"}
                      </Typography>

                      {record.email && record.email !== record.name ? (
                        <Typography variant="body2" sx={{
                          color: "text.secondary",
                          wordBreak: "break-word"
                        }}>
                          {record.email}
                        </Typography>
                      ) : null}

                      {record.playNumber ? (
                        <Typography variant="caption" sx={{
                          color: "text.secondary"
                        }}>
                          {t.playOf
                            .replace("{n}", toArabicDigits(record.playNumber, language))
                            .replace("{m}", toArabicDigits(record.totalPlays, language))}
                        </Typography>
                      ) : null}

                      {record.company ? (
                        <Typography variant="body2" sx={{
                          color: "text.secondary"
                        }}>
                          {record.company}
                        </Typography>
                      ) : null}

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 1.5,
                          py: 0.8,
                          borderRadius: 2,
                          bgcolor: style.bg,
                        }}
                      >
                        {style.mark ? (
                          <CrossZeroMarkVisual
                            mark={style.mark}
                            xImage={game?.xImage}
                            oImage={game?.oImage}
                            size={18}
                            fallbackSize="1.1rem"
                            color={style.symbolColor}
                            shadow={`0 0 8px ${style.symbolColor}`}
                          />
                        ) : style.icon}
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: style.color
                          }}>
                          {t[record.result] || record.result}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {record.difficulty ? (
                          <Chip
                            label={record.difficulty}
                            size="small"
                            color={
                              DIFFICULTY_COLOR[record.difficulty] || "default"
                            }
                          />
                        ) : null}
                        <Chip
                          label={toArabicDigits(`${record.moves || 0} ${t.moves}`, language)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <AccessTime fontSize="small" sx={{ color: "text.secondary" }} />
                        <Typography variant="body2" sx={{
                          color: "text.secondary"
                        }}>
                          {t.timeTaken}: <strong>{toArabicDigits(record.timeTaken ?? 0, language)}s</strong>
                        </Typography>
                      </Box>

                      {record.submittedAt ? (
                        <Typography variant="caption" sx={{
                          color: "text.secondary"
                        }}>
                          {t.playedAt}: {formatDateTimeWithLocale(record.submittedAt, language === "ar" ? "ar-SA" : "en-GB")}
                        </Typography>
                      ) : null}
                    </AppCard>
                  </Grid>
                );
              })}
            </Grid>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <ArabicPagination
                count={totalPages || 1}
                page={page}
                onChange={(_, value) => setPage(value)}
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
