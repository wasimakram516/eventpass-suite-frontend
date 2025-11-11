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
} from "@/services/tapmatch/gameService";
import { useAuth } from "@/contexts/AuthContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import { getAllBusinesses } from "@/services/businessService";
import BusinessDrawer from "@/components/drawers/BusinessDrawer";
import ShareLinkModal from "@/components/modals/ShareLinkModal";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import AppCard from "@/components/cards/AppCard";

const translations = {
  en: {
    gamesTitle: "TapMatch Games",
    gamesDescription: "Manage all TapMatch memory games for this business.",
    createGameButton: "Create Game",
    slugLabel: "Slug:",
    countdownTimerLabel: "Countdown:",
    gameTimeLabel: "Game Duration:",
    coverImageLabel: "Cover Image",
    nameImageLabel: "Name Image",
    backgroundImageLabel: "Background Image",
    memoryImagesLabel: "Memory Images",
    resultsButton: "Results",
    deleteGameTitle: "Delete Game?",
    deleteGameMessage:
      "Are you sure you want to move this TapMatch game to the Recycle Bin?",
    manageGames: "Manage TapMatch Games",
    selectBusiness: "Select Business",
    noGames: "No TapMatch games found.",
    editTooltip: "Edit Game",
    deleteTooltip: "Delete Game",
    shareTooltip: "Share Game Link",
    delete: "Delete",
  },
  ar: {
    gamesTitle: "ألعاب TapMatch",
    gamesDescription: "إدارة جميع ألعاب الذاكرة TapMatch الخاصة بهذا العمل.",
    createGameButton: "إنشاء لعبة",
    slugLabel: "المعرّف:",
    countdownTimerLabel: "العد التنازلي:",
    gameTimeLabel: "مدة اللعبة:",
    coverImageLabel: "صورة الغلاف",
    nameImageLabel: "صورة الاسم",
    backgroundImageLabel: "صورة الخلفية",
    memoryImagesLabel: "صور البطاقات",
    resultsButton: "النتائج",
    deleteGameTitle: "حذف اللعبة؟",
    deleteGameMessage:
      "هل أنت متأكد أنك تريد نقل هذه اللعبة إلى سلة المحذوفات؟",
    manageGames: "إدارة ألعاب TapMatch",
    selectBusiness: "اختر العمل",
    noGames: "لا توجد ألعاب.",
    editTooltip: "تعديل اللعبة",
    deleteTooltip: "حذف اللعبة",
    shareTooltip: "مشاركة رابط اللعبة",
    delete: "حذف",
  },
};

export default function TapMatchGamesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, dir } = useI18nLayout(translations);

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
      if (!businesses.error) setAllBusinesses(businesses ?? []);
    };
    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (user?.role === "business" && user.business?._id)
      setSelectedBusiness(user.business.slug);
  }, [user]);

  useEffect(() => {
    if (!selectedBusiness) {
      setGames([]);
      return;
    }
    setLoading(true);
    getGamesByBusiness(selectedBusiness).then((res) => {
      setGames(!res.error ? res : []);
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
      setGames((prev) =>
        isEdit
          ? prev.map((g) => (g._id === selectedGame._id ? response : g))
          : [...prev, response]
      );
      setOpenModal(false);
    }
  };

  const handleDeleteGame = async () => {
    const res = await deleteGame(gameToDelete._id);
    if (!res.error)
      setGames((prev) => prev.filter((g) => g._id !== gameToDelete._id));
    setConfirmOpen(false);
    setGameToDelete(null);
  };

  return (
    <Box dir={dir} sx={{ position: "relative", width: "100%" }}>
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
          <BreadcrumbsNav />

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
              {user?.role === "admin" && (
                <Button
                  variant="outlined"
                  startIcon={<ICONS.business />}
                  onClick={() => setDrawerOpen(true)}
                  sx={{
                    ...getStartIconSpacing(dir),
                    width: { xs: "100%", sm: "auto" },
                  }}
                >
                  {t.selectBusiness}
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

          <Divider />
        </Box>

        {!selectedBusiness ? (
          <EmptyBusinessState />
        ) : loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : games.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <Grid container spacing={3} justifyContent="center">
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
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t.slugLabel}</strong> {g.slug}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t.countdownTimerLabel}</strong>{" "}
                      {g.countdownTimer}s
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t.gameTimeLabel}</strong> {g.gameSessionTimer}s
                    </Typography>

                    {/* Preview core images */}
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
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{ mb: 0.5, fontSize: "0.7rem" }}
                            >
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

                  <Box sx={{ mt: 2 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      flexWrap="wrap"
                      spacing={1}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ICONS.leaderboard />}
                        onClick={() =>
                          router.push(
                            `/cms/modules/tapmatch/games/${g.slug}/results`
                          )
                        }
                        sx={getStartIconSpacing(dir)}
                      >
                        {t.resultsButton}
                      </Button>

                      <Box sx={{ display: "flex", gap: 1 }}>
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
                    </Stack>
                  </Box>
                </AppCard>
              </Grid>
            ))}
          </Grid>
        )}

        <ShareLinkModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          url={`${
            typeof window !== "undefined" ? window.location.origin : ""
          }/tapmatch/${gameToShare?.slug}`}
          name={gameToShare?.title}
        />

        <GameFormModal
          key={selectedGame?._id || "new"}
          open={openModal}
          onClose={() => setOpenModal(false)}
          editMode={editMode}
          initialValues={selectedGame || {}}
          onSubmit={handleSubmitGame}
          module="tapmatch"
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
