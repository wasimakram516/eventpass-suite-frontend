"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Typography,
} from "@mui/material";
import {
  AccessTime,
  Download,
  EmojiEvents,
} from "@mui/icons-material";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import AppCard from "@/components/cards/AppCard";
import CrossZeroMarkVisual from "@/components/crosszero/CrossZeroMarkVisual";
import NoDataAvailable from "@/components/NoDataAvailable";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getGameBySlug } from "@/services/crosszero/gameService";
import {
  exportResults,
  getSessionHistory,
} from "@/services/crosszero/playerService";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";

const translations = {
  en: {
    title: "AI Mode Results",
    totalRecords: "Total records:",
    exportResults: "Export Results",
    exporting: "Exporting...",
    timeTaken: "Time",
    moves: "Moves",
    playedAt: "Played At",
    showing: "Showing",
    of: "of",
    records: "records",
    perPage: "Per page",
    X_wins: "Player Wins",
    O_wins: "AI Wins",
    draw: "Draw",
    noData: "No AI game results yet.",
  },
  ar: {
    title: "نتائج وضع الذكاء الاصطناعي",
    totalRecords: "إجمالي السجلات:",
    exportResults: "تصدير النتائج",
    exporting: "جارٍ التصدير...",
    timeTaken: "الوقت",
    moves: "الحركات",
    playedAt: "تاريخ اللعب",
    showing: "عرض",
    of: "من",
    records: "سجل",
    perPage: "لكل صفحة",
    X_wins: "فوز اللاعب",
    O_wins: "فوز الذكاء الاصطناعي",
    draw: "تعادل",
    noData: "لا توجد نتائج حتى الآن.",
  },
};

const RESULT_STYLE = {
  X_wins: {
    color: "#0096c7",
    bg: "rgba(0,180,216,0.1)",
    mark: "X",
    symbolColor: "#00e5ff",
    icon: <EmojiEvents fontSize="small" sx={{ color: "#0096c7" }} />,
  },
  O_wins: {
    color: "#c0392b",
    bg: "rgba(255,107,107,0.1)",
    mark: "O",
    symbolColor: "#ff6b6b",
    icon: null,
  },
  draw: { color: "#777", bg: "rgba(0,0,0,0.05)", mark: null, symbolColor: null, icon: null },
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
    result: session?.xoStats?.result || "draw",
    difficulty: session?.xoStats?.difficulty || "",
    moves: session?.xoStats?.moves ?? 0,
    timeTaken: session?.xoStats?.timeTaken ?? playerEntry?.timeTaken ?? 0,
    submittedAt: session?.endTime || session?.createdAt || null,
  };
};

export default function CrossZeroAIResultsPage() {
  const { gameSlug } = useParams();
  const { t, dir } = useI18nLayout(translations);

  const [game, setGame] = useState(null);
  const [records, setRecords] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);

      const gameData = await getGameBySlug(gameSlug);
      if (gameData && !gameData.error) {
        setGame(gameData);

        const history = await getSessionHistory(gameData._id, page, limit);
        if (!history.error) {
          const mappedRecords = (history.sessions || []).map(mapSessionToRecord);
          setRecords(mappedRecords);
          setTotalPages(history.totalPages || 0);
          setTotalRecords(history.totalCount || mappedRecords.length);
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
  }, [gameSlug, page, limit]);

  const handleExport = async () => {
    if (!game) return;
    setExportLoading(true);
    await exportResults(game._id);
    setExportLoading(false);
  };

  const fromRecord = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const toRecord = totalRecords === 0 ? 0 : Math.min(page * limit, totalRecords);

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
              <Typography variant="h5" fontWeight="bold">
                {t.title} - &quot;{game?.title}&quot;
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t.totalRecords} <strong>{totalRecords}</strong>
              </Typography>
            </Box>
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
          </Box>
          <Divider sx={{ mt: 2 }} />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t.showing} <strong>{fromRecord}</strong>-<strong>{toRecord}</strong>{" "}
              {t.of} <strong>{totalRecords}</strong> {t.records}
            </Typography>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>{t.perPage}</InputLabel>
              <Select
                value={limit}
                label={t.perPage}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
              >
                {[5, 10, 20, 50].map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : records.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <>
            <Grid
              container
              spacing={{ xs: 1.5, sm: 2.5 }}
              justifyContent="center"
              sx={{
                "& > *": {
                  width: { xs: "100%", sm: "auto" },
                },
              }}
            >
              {records.map((record, index) => {
                const style = RESULT_STYLE[record.result] || RESULT_STYLE.draw;

                return (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={6}
                    lg={4}
                    key={record._id || index}
                    display="flex"
                    justifyContent="center"
                  >
                    <AppCard
                      sx={{
                        p: { xs: 2, sm: 2.5 },
                        height: "100%",
                        width: { xs: "100%", sm: 360 },
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        color="primary.main"
                        noWrap
                      >
                        {record.name || "-"}
                      </Typography>

                      {record.company ? (
                        <Typography variant="body2" color="text.secondary">
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
                          fontWeight={700}
                          sx={{ color: style.color }}
                        >
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
                          label={`${record.moves || 0} ${t.moves}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <AccessTime fontSize="small" sx={{ color: "text.secondary" }} />
                        <Typography variant="body2" color="text.secondary">
                          {t.timeTaken}: <strong>{record.timeTaken ?? 0}s</strong>
                        </Typography>
                      </Box>

                      {record.submittedAt ? (
                        <Typography variant="caption" color="text.secondary">
                          {t.playedAt}: {formatDateTimeWithLocale(record.submittedAt)}
                        </Typography>
                      ) : null}
                    </AppCard>
                  </Grid>
                );
              })}
            </Grid>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                dir="ltr"
                count={totalPages || 1}
                page={page}
                onChange={(_, value) => setPage(value)}
              />
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}
