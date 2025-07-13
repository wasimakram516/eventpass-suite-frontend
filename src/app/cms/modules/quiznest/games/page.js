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
  Stack,
} from "@mui/material";
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
import ShareLinkModal from "@/components/ShareLinkModal";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

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

  useEffect(() => {
    const fetchBusinesses = async () => {
      const businesses = await getAllBusinesses();
      if (!businesses.error) {
        setAllBusinesses(businesses ?? []);
      }
    };

    fetchBusinesses();
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
    getGamesByBusiness(selectedBusiness).then((res) => {
      if (!res.error) {
        setGames(res || []);
      } else {
        setGames([]);
      }
      setLoading(false);
    });
  }, [selectedBusiness]);

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
    const response = isEdit
      ? await updateGame(selectedGame._id, formData)
      : await createGame(selectedBusiness, formData);

    if (!response.error) {
      if (isEdit) {
        setGames((prev) =>
          prev.map((g) => (g._id === selectedGame._id ? response : g))
        );
      } else {
        setGames((prev) => [...prev, response]);
      }
      setOpenModal(false);
    }
  };

  const handleDeleteGame = async () => {
    const res = await deleteGame(gameToDelete._id);

    if (!res.error) {
      setGames((prev) => prev.filter((g) => g._id !== gameToDelete._id));
    }
    setConfirmOpen(false);
    setGameToDelete(null);
  };

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
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", sm: "center" },
              gap: 2,
              mb: 3,
            }}
          >
            {/* Heading + Subheading */}
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

            {/* Buttons */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {user?.role === "admin" && (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setDrawerOpen(true)}
                  startIcon={<ICONS.business />}
                  sx={getStartIconSpacing(dir)}
                >
                  {t.selectBusiness || "Select Business"}
                </Button>
              )}

              {selectedBusiness && (
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ICONS.add />}
                  onClick={handleOpenCreate}
                  sx={getStartIconSpacing(dir)}
                >
                  {t.createGameButton}
                </Button>
              )}
            </Stack>
          </Box>

          <Divider sx={{ mt: 2 }} />
        </Box>

        {!selectedBusiness ? (
          <Box
            sx={{
              mt: 8,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "text.secondary",
            }}
          >
            <ICONS.business sx={{ fontSize: 72, mb: 2 }} />
            <Typography variant="h6">{t.selectBusiness}</Typography>
          </Box>
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
                      startIcon={<ICONS.quiz />}
                      onClick={() =>
                        router.push(
                          `/cms/modules/quiznest/games/${g.slug}/questions`
                        )
                      }
                      sx={getStartIconSpacing(dir)}
                    >
                      {t.questionsButton}
                    </Button>

                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<ICONS.leaderboard />}
                      onClick={() =>
                        router.push(
                          `/cms/modules/quiznest/games/${g.slug}/results`
                        )
                      }
                      sx={getStartIconSpacing(dir)}
                    >
                      {t.resultsButton}
                    </Button>

                    <Box sx={{ display: "flex", gap: 1, mt: { xs: 1, sm: 0 } }}>
                      <IconButton
                        color="info"
                        onClick={() => handleOpenEdit(g)}
                      >
                        <ICONS.edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => {
                          setGameToDelete(g);
                          setConfirmOpen(true);
                        }}
                      >
                        <ICONS.delete fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          setGameToShare(g);
                          setShareModalOpen(true);
                        }}
                      >
                        <ICONS.share fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        <ShareLinkModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          url={`${
            typeof window !== "undefined" ? window.location.origin : ""
          }/quiznest/game/${gameToShare?.slug}`}
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
