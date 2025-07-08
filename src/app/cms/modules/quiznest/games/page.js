"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  CircularProgress,
  IconButton,
  Divider,
  Drawer,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import QuizIcon from "@mui/icons-material/Quiz";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import ShareIcon from "@mui/icons-material/Share";
import BusinessIcon from "@mui/icons-material/Business";
import ShareGameModal from "@/components/ShareGameModal";
import GameFormModal from "@/components/GameFormModal";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";

import {
  getGamesByBusiness,
  createGame,
  updateGame,
  deleteGame,
} from "@/services/quiznest/gameService";
import { useMessage } from "@/contexts/MessageContext";
import { useAuth } from "@/contexts/AuthContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getAllBusinesses } from "@/services/businessService";
import BusinessDrawer from "@/components/BusinessDrawer";

const translations = {
  en: {
    gamesTitle: "Games for",
    gamesDescription: "Manage all quiz games created for this business.",
    createGameButton: "Create Game",
    slugLabel: "Slug:",
    optionCountLabel: "Option Count:",
    countdownTimerLabel: "Countdown Timer:",
    quizTimeLabel: "Quiz Time:",
    coverImageLabel: "Cover Image:",
    nameImageLabel: "Name Image:",
    backgroundImageLabel: "Background Image:",
    questionsButton: "Questions",
    resultsButton: "Results",
    deleteGameTitle: "Delete Game?",
    deleteGameMessage: "Are you sure you want to delete",
    manageGames: "Manage Games",
    selectBusiness: "Select Business",
    noGames: "No games found.",
    noBusinesses: "No businesses found.",
    businessNameLabel: "Business Name",
    businessSlugLabel: "Business Slug",
    createBusiness: "Create Business",
    businessCreated: "Business created!",
    gameCreated: "Game created!",
    gameUpdated: "Game updated!",
    gameDeleted: "Game deleted!",
    errorLoading: "Error loading data.",
  },
  ar: {
    gamesTitle: "ألعاب لـ",
    gamesDescription: ".إدارة جميع ألعاب الاختبارات المنشأة لهذا العمل",
    createGameButton: "إنشاء لعبة",
    slugLabel: ":المعر",
    optionCountLabel: ":عدد الخيارات",
    countdownTimerLabel: ":عداد التنازلي",
    quizTimeLabel: ":وقت الاختبار",
    coverImageLabel: ":صورة الغلاف",
    nameImageLabel: ":صورة الاسم",
    backgroundImageLabel: ":صورة الخلفية",
    questionsButton: "الأسئلة",
    resultsButton: "النتائج",
    deleteGameTitle: "حذف اللعبة؟",
    deleteGameMessage: "هل أنت متأكد أنك تريد حذف",
    manageGames: "إدارة الألعاب",
    selectBusiness: "اختر العمل",
    noGames: "لا توجد ألعاب.",
    noBusinesses: "لم يتم العثور على أي عمل.",
    businessNameLabel: "اسم العمل",
    businessSlugLabel: "معرّف العمل",
    createBusiness: "إنشاء عمل",
    businessCreated: "تم إنشاء العمل!",
    gameCreated: "تم إنشاء اللعبة!",
    gameUpdated: "تم تحديث اللعبة!",
    gameDeleted: "تم حذف اللعبة!",
    errorLoading: "حدث خطأ أثناء تحميل البيانات.",
  },
};

export default function GamesPage() {
  const router = useRouter();
  const { showMessage } = useMessage();
  const { user } = useAuth();
  const { t, dir, align, language } = useI18nLayout(translations);

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [gameToShare, setGameToShare] = useState(null);
  const [allBusinesses, setAllBusinesses] = useState([]);

  // Fetch all businesses on mount
  useEffect(() => {
    getAllBusinesses()
      .then((businesses) => setAllBusinesses(businesses || []))
      .catch(() => setAllBusinesses([]));
  }, []);

  useEffect(() => {
    if (user?.role === "business" && user.business?._id) {
      setSelectedBusiness(user.business.slug);
    }
  }, [user]);

  // Fetch games for selected business
  useEffect(() => {
    if (!selectedBusiness) {
      setGames([]);
      return;
    }
    setLoading(true);
    getGamesByBusiness(selectedBusiness)
      .then((gamesData) => setGames(gamesData || []))
      .catch(() => {
        setGames([]);
        showMessage(t.errorLoading, "error");
      })
      .finally(() => setLoading(false));
  }, [selectedBusiness, t, showMessage]);
  // UPDATED: Business selection handler
  const handleBusinessSelect = (slug) => {
    setSelectedBusiness(slug);
    setDrawerOpen(false);
  };

  // UPDATED: Create/Edit Game using API
  const handleOpenCreate = () => {
    setSelectedGame(null);
    setEditMode(false);
    setOpenModal(true);
  };

  const handleOpenEdit = (game) => {
    setSelectedGame(game);
    setEditMode(true);
    setOpenModal(true);
  };

  const handleSubmitGame = async (formData, isEdit) => {
    try {
      let response;
      if (isEdit) {
        response = await updateGame(selectedGame._id, formData);
        setGames((prev) =>
          prev.map((g) => (g._id === selectedGame._id ? response : g))
        );
        showMessage(t.gameUpdated, "success");
      } else {
        response = await createGame(selectedBusiness, formData);
        setGames((prev) => [...prev, response]);
        showMessage(t.gameCreated, "success");
      }
    } catch (err) {
      showMessage(err?.message || t.errorLoading, "error");
    }
    setOpenModal(false);
  };

  // UPDATED: Delete Game using API
  const handleDeleteGame = async () => {
    try {
      await deleteGame(gameToDelete._id);
      setGames((prev) => prev.filter((g) => g._id !== gameToDelete._id));
      showMessage(t.gameDeleted, "success");
    } catch (err) {
      showMessage(err?.message || t.errorLoading, "error");
    }
    setConfirmOpen(false);
    setGameToDelete(null);
  };
  console.log(selectedBusiness);
  return (
    <Box
      dir={dir}
      sx={{ position: "relative", display: "inline-block", width: "100%" }}
    >
      {user?.role === "admin" && (
        <BusinessDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          businesses={allBusinesses}
          selectedBusinessSlug={selectedBusiness}
          onSelect={handleBusinessSelect}
          title={t.selectBusiness}
          noDataText={t.noBusinesses}
        />
      )}
      
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
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
                {user?.role === "admin" && !selectedBusiness
                  ? t.manageGames
                  : `${t.gamesTitle} "${selectedBusiness || ""}"`}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {t.gamesDescription}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 0 }}>
              {user?.role === "admin" && (
                <Button
                  variant="outlined"
                  onClick={() => setDrawerOpen(true)}
                  sx={{ mr: 1 }}
                  startIcon={<BusinessIcon />}
                >
                  {t.selectBusiness || "Select Business"}
                </Button>
              )}
              {selectedBusiness && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreate}
                >
                  {t.createGameButton}
                </Button>
              )}
            </Box>
          </Box>

          <Divider sx={{ mt: 2 }} />
        </Box>

        {!selectedBusiness ? (
          <Typography sx={{ mt: 4 }}>{t.selectBusiness}</Typography>
        ) : loading ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {games.map((g) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={g._id}>
                <Box
                  sx={{
                    borderRadius: 2,
                    boxShadow: 3,
                    p: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    bgcolor: "#fff",
                  }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {g.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ wordBreak: "break-word" }}
                    >
                      <strong>{t.slugLabel}</strong> {g.slug}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t.optionCountLabel}</strong> {g.choicesCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t.countdownTimerLabel}</strong>{" "}
                      {g.countdownTimer} sec
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t.quizTimeLabel}</strong> {g.gameSessionTimer}{" "}
                      sec
                    </Typography>

                    {["coverImage", "nameImage", "backgroundImage"].map(
                      (imgKey) => (
                        <Box key={imgKey} sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {t[`${imgKey}Label`]}:
                          </Typography>
                          <Box
                            component="img"
                            src={g[imgKey]}
                            alt={imgKey}
                            sx={{
                              width: "100%",
                              height: "auto",
                              maxHeight: 140,
                              objectFit: "cover",
                              borderRadius: 1,
                              mt: 0.5,
                            }}
                          />
                        </Box>
                      )
                    )}
                  </Box>

                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<QuizIcon />}
                      onClick={() =>
                        router.push(
                          `/cms/modules/quiznest/games/${g.slug}/questions`
                        )
                      }
                    >
                      {t.questionsButton}
                    </Button>

                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<LeaderboardIcon />}
                      onClick={() =>
                        router.push(
                          `/cms/modules/quiznest/games/${g.slug}/results`
                        )
                      }
                    >
                      {t.resultsButton}
                    </Button>

                    <Box sx={{ display: "flex", gap: 1, mt: { xs: 1, sm: 0 } }}>
                      <IconButton
                        color="info"
                        onClick={() => handleOpenEdit(g)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => {
                          setGameToDelete(g);
                          setConfirmOpen(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          setGameToShare(g);
                          setShareModalOpen(true);
                        }}
                      >
                        <ShareIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        <ShareGameModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          gameSlug={gameToShare?.slug}
        />

        <GameFormModal
          key={selectedGame?._id || "new"}
          open={openModal}
          onClose={() => setOpenModal(false)}
          editMode={editMode}
          initialValues={selectedGame || {}}
          onSubmit={handleSubmitGame}
        />

        <ConfirmationDialog
          open={confirmOpen}
          title={t.deleteGameTitle}
          message={`${t.deleteGameMessage} "${gameToDelete?.title}"?`}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleDeleteGame}
        />
      </Container>
    </Box>
  );
}
