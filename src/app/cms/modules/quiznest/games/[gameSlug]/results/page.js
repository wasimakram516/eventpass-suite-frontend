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
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";

import { useMessage } from "@/contexts/MessageContext";
import { useAuth } from "@/contexts/AuthContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getGameBySlug } from "@/services/quiznest/gameService";
import {
  getLeaderboard,
  exportResults,
} from "@/services/quiznest/playerService";
import ICONS from "@/utils/iconUtil";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import NoDataAvailable from "@/components/NoDataAvailable";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
const translations = {
  en: {
    resultsTitle: "Results for",
    totalPlayers: "Total Players:",
    exportResults: "Export Results",
    exportTooltip: "Export Results",
    scoreLabel: "Score:",
    timeTakenLabel: "Time Taken:",
    attemptedLabel: "Attempted:",
    submittedAtLabel: "Submitted At:",
    errorLoading: "Error loading data.",
    exported: "Exported results!",
  },
  ar: {
    resultsTitle: "نتائج",
    totalPlayers: "إجمالي اللاعبين:",
    exportResults: "تصدير النتائج",
    exportTooltip: "تصدير النتائج",
    scoreLabel: "النقاط:",
    timeTakenLabel: "الوقت المستغرق:",
    attemptedLabel: "المحاولات:",
    submittedAtLabel: "تم الإرسال في:",
    errorLoading: "حدث خطأ أثناء تحميل البيانات.",
    exported: "تم تصدير النتائج!",
  },
};

export default function ResultsPage() {
  const { gameSlug } = useParams();
  const { showMessage } = useMessage();
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t, dir } = useI18nLayout(translations);

  // Fetch game and leaderboard from backend
  useEffect(() => {
    const fetchGameAndResults = async () => {
      setLoading(true);
      const gameData = await getGameBySlug(gameSlug);
      setGame(gameData);
      const leaderboard = await getLeaderboard(gameData._id);
      setPlayers(leaderboard || []);
      setLoading(false);
    };
    if (gameSlug) fetchGameAndResults();
  }, [gameSlug, t]);

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
      <Container maxWidth="lg">
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
                fontWeight="bold"
                sx={{
                  fontSize: { xs: "1.1rem", sm: "1.5rem" },
                  lineHeight: { xs: 1.2, sm: 1.5 },
                  wordBreak: "break-word",
                }}
              >
                {t.resultsTitle} "{game?.title}"
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
              >
                {t.totalPlayers} <strong>{players?.length}</strong>
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
            </Box>
          </Box>

          <Divider sx={{ mt: 2 }} />
        </Box>

        {loading ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : players.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <Grid
            container
            spacing={{ xs: 1, sm: 3 }}
            justifyContent="center"
            sx={{ width: "100%", maxWidth: "100%" }}
          >
            {players?.map((p, i) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={p._id || i}
                sx={{ width: { xs: "100%", sm: "auto" }, minWidth: 0 }}
              >
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: { xs: "none", sm: 360 },
                    mx: { xs: 0, sm: "auto" },
                    height: "100%",
                    p: 3,
                    borderRadius: 3,
                    background: "#fdfefe",
                    boxShadow: 2,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "0.3s ease",
                    "&:hover": {
                      boxShadow: 4,
                    },
                  }}
                >
                  {/* Rank */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    {i < 3 && (
                      <ICONS.trophy
                        color={
                          i === 0 ? "warning" : i === 1 ? "secondary" : "info"
                        }
                        sx={{ mr: 1 }}
                      />
                    )}
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color="primary.main"
                      sx={{
                        fontSize: { xs: "0.9rem", sm: "1.25rem" },
                        lineHeight: { xs: 1.2, sm: 1.4 },
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        whiteSpace: "normal",
                      }}
                    >
                      #{i + 1} • {p.name}
                    </Typography>
                  </Box>

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
                        {t.scoreLabel} <strong>{p.score}</strong>
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
                        {t.timeTakenLabel} <strong>{p.timeTaken}s</strong>
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
                        <strong>{p.attemptedQuestions}</strong>
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <AccessTimeIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "primary.main" }}
                      />
                      <Typography
                        variant="body2"
                        fontStyle="italic"
                        sx={{
                          fontSize: { xs: "0.7rem", sm: "0.85rem" },
                          lineHeight: { xs: 1.2, sm: 1.4 },
                          wordBreak: "break-word",
                        }}
                      >
                        {t.submittedAtLabel}{" "}
                        <strong>{formatDateTimeWithLocale(p.endTime)}</strong>
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
