"use client";

import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Typography,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BusinessIcon from "@mui/icons-material/Business";
import ScoreIcon from "@mui/icons-material/Score";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";

import { useMessage } from "@/contexts/MessageContext";
import { useAuth } from "@/contexts/AuthContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getGameBySlug } from "@/services/quiznest/gameService";
import {
  getLeaderboard,
  exportResults,
} from "@/services/quiznest/playerService";
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
  const { businessSlug, gameSlug } = useParams();
  const { showMessage } = useMessage();
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t, language } = useI18nLayout(translations);

  // Fetch game and leaderboard from backend
  useEffect(() => {
    const fetchGameAndResults = async () => {
      setLoading(true);
      try {
        const gameData = await getGameBySlug(gameSlug);
        setGame(gameData);
        const leaderboard = await getLeaderboard(gameData._id);
        setPlayers(leaderboard || []);
      } catch (err) {
        showMessage(t.errorLoading, "error");
      } finally {
        setLoading(false);
      }
    };
    if (gameSlug) fetchGameAndResults();
  }, [gameSlug, t, showMessage]);
  // Export results as Excel file
  const handleExport = async () => {
    try {
      const blob = await exportResults(game._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${game?.title || "results"}-results.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showMessage(t.exported, "success");
    } catch (err) {
      showMessage(t.errorLoading, "error");
    }
  };

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <Container maxWidth="lg">
        {loading ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              {/* Header row with breadcrumbs and language selector */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2, // Add some margin below this row
                }}
              >
                <BreadcrumbsNav />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  rowGap: 2,
                }}
              >
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {t.resultsTitle} "{game?.title}"
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.totalPlayers}
                    <strong>{players?.length}</strong>
                  </Typography>
                </Box>

                <Tooltip title="Export Results">
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                  >
                    {t.exportResults}
                  </Button>
                </Tooltip>
              </Box>
              <Divider sx={{ mt: 2 }} />
            </Box>

            <Grid container spacing={3}>
              {players.map((p, i) => (
                <Grid item xs={12} sm={6} md={4} key={p._id || i}>
                  <Box
                    sx={{
                      height: "100%",
                      p: 3,
                      borderRadius: 3,
                      background: "#fdfefe",
                      boxShadow: 2,
                      width: "350px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "0.3s ease",
                      "&:hover": {
                        boxShadow: 6,
                        transform: "translateY(-4px)",
                      },
                    }}
                  >
                    {/* Rank */}
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      {i < 3 && (
                        <EmojiEventsIcon
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
                        noWrap
                      >
                        #{i + 1} • {p.name}
                      </Typography>
                    </Box>

                    {/* Details */}
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {/* {p.company && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <BusinessIcon
                          fontSize="small"
                          sx={{ mr: 1, color: "text.secondary" }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          {p.company}
                        </Typography>
                      </Box>
                    )} */}

                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <ScoreIcon
                          fontSize="small"
                          sx={{ mr: 1, color: "primary.main" }}
                        />
                        <Typography variant="body2">
                          {t.scoreLabel}
                          <strong>{p.score}</strong>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <AccessTimeIcon
                          fontSize="small"
                          sx={{ mr: 1, color: "primary.main" }}
                        />
                        <Typography variant="body2">
                          {t.timeTakenLabel}
                          <strong>{p.timeTaken}s</strong>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <EditNoteIcon
                          fontSize="small"
                          sx={{ mr: 1, color: "primary.main" }}
                        />
                        <Typography variant="body2">
                          {t.attemptedLabel}
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
                          fontSize="0.85rem"
                        >
                          {t.submittedAtLabel}{" "}
                          <strong>
                            {new Date(p.updatedAt).toLocaleString(
                              language === "ar" ? "ar-EG" : "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                          </strong>
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
}
