"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box, Container, Typography, Grid, Button, CircularProgress,
  IconButton, Divider, Stack, Tooltip, Chip,
} from "@mui/material";

import GameFormModal from "@/components/modals/GameFormModal";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";

import {
  getGamesByBusiness,
  createGame,
  updateGame,
  deleteGame,
} from "@/services/crosszero/gameService";
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
import RecordMetadata from "@/components/RecordMetadata";

const translations = {
  en: {
    manageGames: "Manage CrossZero Games",
    gamesDescription: "Manage all CrossZero Tic-Tac-Toe games for this business.",
    createGameButton: "Create Game",
    slugLabel: "Slug:",
    modeLabel: "Mode:",
    moveTimerLabel: "Move Timer:",
    coverImageLabel: "Cover Image",
    nameImageLabel: "Name Image",
    backgroundImageLabel: "Background Image",
    hostButton: "Host Game",
    resultsButton: "AI Results",
    deleteGameTitle: "Delete Game?",
    deleteGameMessage: "Are you sure you want to move this CrossZero game to the Recycle Bin?",
    selectBusiness: "Select Business",
    noGames: "No CrossZero games found.",
    editTooltip: "Edit Game",
    deleteTooltip: "Delete Game",
    shareTooltip: "Share Game Link",
    delete: "Delete",
    solo: "Solo vs AI",
    pvp: "Multiplayer · PvP",
    pvpSingle: "Single Screen · PvP",
    pvpDual: "Dual Screen · PvP",
    disabled: "disabled",
    seconds: "s",
  },
  ar: {
    manageGames: "إدارة ألعاب CrossZero",
    gamesDescription: "إدارة جميع ألعاب إكس أو CrossZero لهذا العمل.",
    createGameButton: "إنشاء لعبة",
    slugLabel: "المعرّف:",
    modeLabel: "الوضع:",
    moveTimerLabel: "مؤقت الحركة:",
    coverImageLabel: "صورة الغلاف",
    nameImageLabel: "صورة الاسم",
    backgroundImageLabel: "صورة الخلفية",
    hostButton: "استضافة اللعبة",
    resultsButton: "نتائج AI",
    deleteGameTitle: "حذف اللعبة؟",
    deleteGameMessage: "هل أنت متأكد أنك تريد نقل هذه اللعبة إلى سلة المحذوفات؟",
    selectBusiness: "اختر العمل",
    noGames: "لا توجد ألعاب.",
    editTooltip: "تعديل اللعبة",
    deleteTooltip: "حذف اللعبة",
    shareTooltip: "مشاركة رابط اللعبة",
    delete: "حذف",
    solo: "فردي · ضد الذكاء الاصطناعي",
    pvp: "متعدد اللاعبين · PvP",
    pvpSingle: "شاشة واحدة · PvP",
    pvpDual: "شاشتان · PvP",
    disabled: "معطل",
    seconds: "ث",
  },
};

export default function CrossZeroGamesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, selectedBusiness, setSelectedBusiness } = useAuth();
  const { t, dir, language } = useI18nLayout(translations);

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
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const initialSearch = searchParams.get("search");
    if (initialSearch) setSearchTerm(initialSearch.trim());
  }, [searchParams]);

  useEffect(() => {
    getAllBusinesses().then((res) => {
      if (!res.error) setAllBusinesses(res ?? []);
    });
  }, []);

  useEffect(() => {
    if (user?.role === "business" && user.business?._id && !selectedBusiness)
      setSelectedBusiness(user.business.slug);
  }, [user, selectedBusiness, setSelectedBusiness]);

  useEffect(() => {
    if (!selectedBusiness) { setGames([]); return; }
    setLoading(true);
    getGamesByBusiness(selectedBusiness).then((res) => {
      setGames(!res.error ? res : []);
      setLoading(false);
    });
  }, [selectedBusiness]);

  const filteredGames = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return games;
    return games.filter((g) =>
      (g.title || "").toLowerCase().includes(term) || (g.slug || "").toLowerCase().includes(term)
    );
  }, [games, searchTerm]);

  const handleOpenCreate = () => { setSelectedGame(null); setEditMode(false); setOpenModal(true); };
  const handleOpenEdit = (game) => { setSelectedGame(game); setEditMode(true); setOpenModal(true); };
  const handleCloseModal = () => { setOpenModal(false); setSelectedGame(null); setEditMode(false); };

  const handleSubmitGame = async (formData, isEdit) => {
    const response = isEdit
      ? await updateGame(selectedGame._id, formData)
      : await createGame(selectedBusiness, formData);
    if (!response.error) {
      setGames(isEdit ? games.map((g) => (g._id === selectedGame._id ? response : g)) : [...games, response]);
      handleCloseModal();
    }
  };

  const handleDeleteGame = async () => {
    const res = await deleteGame(gameToDelete._id);
    if (!res.error) setGames((prev) => prev.filter((g) => g._id !== gameToDelete._id));
    setConfirmOpen(false);
    setGameToDelete(null);
  };

  return (
    <Box dir={dir} sx={{ position: "relative", width: "100%" }}>
      {(user?.role === "admin" || user?.role === "superadmin") && (
        <BusinessDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          businesses={allBusinesses}
          selectedBusinessSlug={selectedBusiness}
          onSelect={(slug) => { setSelectedBusiness(slug); setDrawerOpen(false); }}
        />
      )}

      <Container maxWidth={false} disableGutters>
        <Box sx={{ mb: 4 }}>
          <BreadcrumbsNav />
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight="bold">{t.manageGames}</Typography>
              <Typography variant="body2" color="text.secondary">{t.gamesDescription}</Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" }, alignItems: "center", justifyContent: "flex-end", gap: dir === "rtl" ? 2 : 1 }}>
              {(user?.role === "admin" || user?.role === "superadmin") && (
                <Button variant="outlined" startIcon={<ICONS.business />} onClick={() => setDrawerOpen(true)} sx={{ ...getStartIconSpacing(dir), width: { xs: "100%", sm: "auto" } }}>
                  {t.selectBusiness}
                </Button>
              )}
              {selectedBusiness && (
                <Button variant="contained" startIcon={<ICONS.add />} onClick={handleOpenCreate} sx={{ ...getStartIconSpacing(dir), width: { xs: "100%", sm: "auto" } }}>
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
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress /></Box>
        ) : filteredGames.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {filteredGames.map((g) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={g._id}>
                <AppCard sx={{ p: 2, height: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <Box>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap>{g.title}</Typography>
                      <Chip
                        label={
                          g.mode === "solo"
                            ? t.solo
                            : g.pvpScreenMode === "single"
                              ? (t.pvpSingle || "Single Screen · PvP")
                              : (t.pvpDual || "Dual Screen · PvP")
                        }
                        size="small"
                        sx={{
                          bgcolor: g.mode === "pvp"
                            ? g.pvpScreenMode === "single"
                              ? "rgba(0,200,150,0.1)"
                              : "rgba(123,47,247,0.1)"
                            : "rgba(0,180,216,0.1)",
                          color: g.mode === "pvp"
                            ? g.pvpScreenMode === "single"
                              ? "#00a878"
                              : "#7b2ff7"
                            : "#0077b6",
                          fontWeight: 700, fontSize: "0.7rem",
                        }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary"><strong>{t.slugLabel}</strong> {g.slug}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t.moveTimerLabel}</strong> {g.moveTimer > 0 ? `${g.moveTimer}${t.seconds}` : t.disabled}
                    </Typography>

                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, mt: 2 }}>
                      {["coverImage", "nameImage", "backgroundImage"].map((imgKey) => (
                        <Box key={imgKey}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5, fontSize: "0.7rem" }}>
                            {t[`${imgKey}Label`]}
                          </Typography>
                          <Box component="img" src={g[imgKey]} alt={imgKey} sx={{ width: "100%", height: { xs: 70, sm: 80 }, objectFit: "cover", borderRadius: 1, border: "1px solid #eee" }} />
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <RecordMetadata
                    createdByName={g.createdBy}
                    updatedByName={g.updatedBy}
                    createdAt={g.createdAt}
                    updatedAt={g.updatedAt}
                    locale={language === "ar" ? "ar-SA" : "en-GB"}
                  />

                  <Box sx={{ mt: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" spacing={1}>
                      <Stack direction="row" spacing={1}>
                        {g.mode === "pvp" && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ICONS.play />}
                              onClick={() => router.push(`/cms/modules/crosszero/games/${g.slug}/host`)}
                              sx={getStartIconSpacing(dir)}
                            >
                              {t.hostButton}
                            </Button>
                        )}
                        {g.mode === "solo" && (
                          <Button size="small" variant="outlined" startIcon={<ICONS.leaderboard />}
                            onClick={() => router.push(`/cms/modules/crosszero/games/${g.slug}/results`)}
                            sx={getStartIconSpacing(dir)}
                          >
                            {t.resultsButton}
                          </Button>
                        )}
                      </Stack>

                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title={t.editTooltip}>
                          <IconButton color="info" onClick={() => handleOpenEdit(g)}><ICONS.edit fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title={t.deleteTooltip}>
                          <IconButton color="error" onClick={() => { setGameToDelete(g); setConfirmOpen(true); }}><ICONS.delete fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title={t.shareTooltip}>
                          <IconButton color="primary" onClick={() => { setGameToShare(g); setShareModalOpen(true); }}><ICONS.share fontSize="small" /></IconButton>
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
          url={`${typeof window !== "undefined" ? window.location.origin : ""}/crosszero/${gameToShare?.slug}`}
          name={gameToShare?.title}
        />

        <GameFormModal
          key={selectedGame?._id || "new"}
          open={openModal}
          onClose={handleCloseModal}
          editMode={editMode}
          initialValues={selectedGame || {}}
          selectedGame={selectedGame}
          onSubmit={handleSubmitGame}
          module="crosszero"
          selectedBusiness={selectedBusiness}
          gameId={selectedGame?._id}
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
