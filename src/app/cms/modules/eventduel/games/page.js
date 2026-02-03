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
import GameFormModal from "@/components/modals/GameFormModal";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";

import {
  getGamesByBusiness,
  createGame,
  updateGame,
  deleteGame,
} from "@/services/eventduel/gameService";
import { useAuth } from "@/contexts/AuthContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getAllBusinesses } from "@/services/businessService";
import BusinessDrawer from "@/components/drawers/BusinessDrawer";
import ShareLinkModal from "@/components/modals/ShareLinkModal";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import LoadingState from "@/components/LoadingState";
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
    hostButton: "Host Game",
    questionsButton: "Questions",
    resultsButton: "Results",
    deleteGameTitle: "Delete Game?",
    deleteGameMessage:
      "Are you sure you want to move this item to the Recycle Bin?",
    delete: "Delete",
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
  },
  ar: {
    gamesTitle: "ألعاب لـ",
    gamesDescription: ".إدارة جميع ألعاب الاختبارات المنشأة لهذا العمل",
    createGameButton: "إنشاء لعبة",
    slugLabel: "المعر:",
    optionCountLabel: "عدد الخيارات:",
    countdownTimerLabel: "عداد التنازلي:",
    quizTimeLabel: "وقت الاختبار:",
    coverImageLabel: "صورة الغلاف",
    nameImageLabel: "صورة الاسم",
    backgroundImageLabel: "صورة الخلفية",
    hostButton: "استضافة اللعبة",
    questionsButton: "الأسئلة",
    resultsButton: "النتائج",
    deleteGameTitle: "حذف اللعبة؟",
    deleteGameMessage:
      "هل أنت متأكد من أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    delete: "حذف",
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
  },
};

export default function GamesPage() {
  const router = useRouter();
  const { user, selectedBusiness, setSelectedBusiness } = useAuth();
  const { t, dir, align } = useI18nLayout(translations);

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
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
    if (user?.role === "business" && user.business?._id && !selectedBusiness) {
      setSelectedBusiness(user.business.slug);
    }
  }, [user, selectedBusiness, setSelectedBusiness]);

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
      {(user?.role === "admin" || user?.role === "superadmin") && (
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
              {(user?.role === "admin" || user?.role === "superadmin") && (
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
          <LoadingState />
        ) : games.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <Grid container spacing={3} justifyContent={"center"}>
            {games.map((g) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={g._id}>
                <AppCard
                  sx={{
                    p: 2,
                    width: { xs: "100%", sm: 360 },
                    height: "100%",
                    mx: "auto",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  {/* Header */}
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      gutterBottom
                      sx={{ lineHeight: 1.3, textTransform: "capitalize" }}
                    >
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
                      <strong>{t.quizTimeLabel}</strong> {g.gameSessionTimer}s
                    </Typography>
                  </Box>

                  {/* Image Row */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      mt: 2,
                      flexWrap: "nowrap",
                      overflowX: "auto",
                      scrollbarWidth: "none",
                      "&::-webkit-scrollbar": { display: "none" },
                    }}
                  >
                    {["coverImage", "nameImage", "backgroundImage"].map(
                      (key) => (
                        <Box
                          key={key}
                          component="img"
                          src={g[key]}
                          alt={key}
                          sx={{
                            flexShrink: 0,
                            width: 100,
                            height: { xs: 70, sm: 80 },
                            objectFit: "cover",
                            borderRadius: 1,
                            border: "1px solid #eee",
                          }}
                        />
                      )
                    )}
                  </Box>

                  {/* Actions */}
                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.2,
                    }}
                  >
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<ICONS.adminPanel />}
                      fullWidth
                      onClick={() =>
                        router.push(
                          `/cms/modules/eventduel/games/${g.slug}/host`
                        )
                      }
                      sx={{
                        fontSize: "0.8rem",
                        ...getStartIconSpacing(dir),
                      }}
                    >
                      {t.hostButton}
                    </Button>

                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title={t.editTooltip}>
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => handleOpenEdit(g)}
                        >
                          <ICONS.edit fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={t.deleteTooltip}>
                        <IconButton
                          color="error"
                          size="small"
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
                          size="small"
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
            }/eventduel/${gameToShare?.slug}`}
          name={gameToShare?.title}
        />

        <GameFormModal
          key={selectedGame?._id || "new"}
          open={openModal}
          onClose={() => setOpenModal(false)}
          editMode={editMode}
          initialValues={selectedGame || {}}
          onSubmit={handleSubmitGame}
          module="eventduel"
          selectedBusiness={selectedBusiness}
        />

        <ConfirmationDialog
          open={confirmOpen}
          title={t.deleteGameTitle}
          message={t.deleteGameMessage}
          confirmButtonIcon={<ICONS.delete />}
          confirmButtonText={t.delete}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleDeleteGame}
        />
      </Container>
    </Box>
  );
}
