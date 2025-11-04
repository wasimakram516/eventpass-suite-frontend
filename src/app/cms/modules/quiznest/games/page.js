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
  Tooltip,
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
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import AppCard from "@/components/cards/AppCard";

const translations = {
  en: {
    gamesTitle: "Games for",
    gamesDescription: "Manage all quiz games created for this business.",
    createGameButton: "Create Game",
    slugLabel: "Slug:",
    optionCountLabel: "Option Count:",
    countdownTimerLabel: "Countdown Timer:",
    quizTimeLabel: "Quiz Time:",
    coverImageLabel: "Cover Image",
    nameImageLabel: "Name Image",
    backgroundImageLabel: "Background Image",
    questionsButton: "Questions",
    resultsButton: "Results",
    deleteGameTitle: "Delete Game?",
    deleteGameMessage: "Are you sure you want to move this item to the Recycle Bin?",
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
    editTooltip: "Edit Game",
    deleteTooltip: "Delete Game",
    shareTooltip: "Share Game Link",
    delete: "Delete",
  },
  ar: {
    gamesTitle: "ألعاب لـ",
    gamesDescription: ".إدارة جميع ألعاب الاختبارات المنشأة لهذا العمل",
    createGameButton: "إنشاء لعبة",
    slugLabel: "المعرّف:",
    optionCountLabel: "عدد الخيارات:",
    countdownTimerLabel: "عداد التنازلي:",
    quizTimeLabel: "وقت الاختبار:",
    coverImageLabel: "صورة الغلاف",
    nameImageLabel: "صورة الاسم",
    backgroundImageLabel: "صورة الخلفية",
    questionsButton: "الأسئلة",
    resultsButton: "النتائج",
    deleteGameTitle: "حذف اللعبة؟",
    deleteGameMessage: "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
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
    editTooltip: "تعديل اللعبة",
    deleteTooltip: "حذف اللعبة",
    shareTooltip: "مشاركة رابط اللعبة",
    delete: "حذف",
  },
};

export default function GamesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, dir, align } = useI18nLayout(translations);

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

  const handleBusinessSelect = (slug) => {
    setSelectedBusiness(slug);
    setDrawerOpen(false);
  };

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
                {t.manageGames}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t.gamesDescription}
              </Typography>
            </Box>

            {/* Buttons */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{
                width: { xs: "100%", sm: "auto" },
                alignItems: "center",
                justifyContent: "flex-end",
                gap: dir === "rtl" ? 2 : 1,
              }}
            >
              {user?.role === "admin" && (
                <Button
                  variant="outlined"
                  onClick={() => setDrawerOpen(true)}
                  startIcon={<ICONS.business />}
                  sx={{
                    ...getStartIconSpacing(dir),
                    width: { xs: "100%", sm: "auto" },
                  }}
                >
                  {t.selectBusiness || "Select Business"}
                </Button>
              )}

              {selectedBusiness && (
                <Button
                  variant="contained"
                  startIcon={<ICONS.add />}
                  onClick={handleOpenCreate}
                  sx={{
                    ...getStartIconSpacing(dir),
                    width: { xs: "100%", sm: "auto" },
                  }}
                >
                  {t.createGameButton}
                </Button>
              )}
            </Stack>
          </Box>

          <Divider sx={{ mt: 2 }} />
        </Box>

        {!selectedBusiness ? (
          <EmptyBusinessState />
        ) : loading ? (
          <Box sx={{ textAlign: align, mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : games.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <Grid container spacing={3} justifyContent={"center"}>
            {games.map((g) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={g._id}>
                <AppCard
                  sx={{
                    p: 2,
                    height: "100%",
                    maxWidth: "350px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
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

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 1,
                        mt: 2,
                      }}
                    >
                      {["coverImage", "nameImage", "backgroundImage"].map(
                        (imgKey) => (
                          <Box key={imgKey}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5, fontSize: "0.7rem" }}>
                              {t[`${imgKey}Label`]}
                            </Typography>
                            <Box
                              component="img"
                              src={g[imgKey]}
                              alt={imgKey}
                              sx={{
                                width: "100%",
                                height: { xs: 70, sm: 80 },
                                objectFit: "cover",
                                borderRadius: 1,
                                border: "1px solid #eee",
                              }}
                            />
                          </Box>
                        )
                      )}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      width: "100%",
                    }}
                  >
                    {/* Row for the two main buttons */}
                    <Box
                      sx={{
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
                        sx={{
                          ...getStartIconSpacing(dir),
                          width: { xs: "100%", sm: "auto" },
                        }}
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
                        sx={{
                          ...getStartIconSpacing(dir),
                          width: { xs: "100%", sm: "auto" },
                        }}
                      >
                        {t.resultsButton}
                      </Button>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                      }}
                    >
                      <Tooltip title={t.editTooltip}>
                        <IconButton
                          color="info"
                          onClick={() => handleOpenEdit(g)}
                        >
                          <ICONS.edit fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={t.deleteTooltip}>
                        <IconButton
                          color="error"
                          onClick={() => {
                            setGameToDelete(g);
                            setConfirmOpen(true);
                          }}
                        >
                          <ICONS.delete fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={t.shareTooltip}>
                        <IconButton
                          color="primary"
                          onClick={() => {
                            setGameToShare(g);
                            setShareModalOpen(true);
                          }}
                        >
                          <ICONS.share fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </AppCard>
              </Grid>
            ))}
          </Grid>
        )}

        <ShareLinkModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          url={`${typeof window !== "undefined" ? window.location.origin : ""
            }/quiznest/${gameToShare?.slug}`}
          name={gameToShare?.title}
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
          message={t.deleteGameMessage}
          confirmButtonText={t.delete}
          confirmButtonIcon={<ICONS.delete />}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleDeleteGame}
        />
      </Container>
    </Box>
  );
}
