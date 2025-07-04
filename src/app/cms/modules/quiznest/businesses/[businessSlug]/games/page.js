"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  CircularProgress,
  IconButton,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import QuizIcon from "@mui/icons-material/Quiz";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import ShareIcon from "@mui/icons-material/Share";
import ShareGameModal from "../../../../../../../components/ShareGameModal";
import GameFormModal from "../../../../../../../components/GameFormModal";
import ConfirmationDialog from "../../../../../../../components/ConfirmationDialog";
import { useMessage } from "../../../../../../../contexts/MessageContext";
import BreadcrumbsNav from "../../../../../../../components/BreadcrumbsNav";
import { useLanguage } from "../../../../../../../contexts/LanguageContext";

export default function GamesPage() {
  const router = useRouter();
  const { businessSlug } = useParams();
  const { showMessage } = useMessage();

  const [games, setGames] = useState([]);
  const [business, setBusiness] = useState({});
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [gameToShare, setGameToShare] = useState(null);

  // Dummy data for games and business
  const dummyGames = [
    {
      _id: "g1",
      title: "General Knowledge",
      slug: "general-knowledge",
      choicesCount: 4,
      countdownTimer: 30,
      gameSessionTimer: 120,
      coverImage:
        "https://res.cloudinary.com/dwva39slo/image/upload/v1746877190/QuizNest/images/hbbvlxqal0kju1b6iqdx.gif",
      nameImage:
        "https://res.cloudinary.com/dwva39slo/image/upload/v1746877191/QuizNest/images/agourikpmhm9beasbjaz.gif",
      backgroundImage:
        "https://res.cloudinary.com/dwva39slo/image/upload/v1746877192/QuizNest/images/uvkzet5yuxsfscikg5ky.png",
    },
    {
      _id: "g2",
      title: "Science Quiz",
      slug: "science-quiz",
      choicesCount: 3,
      countdownTimer: 25,
      gameSessionTimer: 90,
      coverImage:
        "https://res.cloudinary.com/dwva39slo/image/upload/v1746877190/QuizNest/images/hbbvlxqal0kju1b6iqdx.gif",
      nameImage:
        "https://res.cloudinary.com/dwva39slo/image/upload/v1746877191/QuizNest/images/agourikpmhm9beasbjaz.gif",
      backgroundImage:
        "https://res.cloudinary.com/dwva39slo/image/upload/v1746877192/QuizNest/images/uvkzet5yuxsfscikg5ky.png",
    },
  ];
  const dummyBusiness = { name: "Demo Corp" };

  // Fetch games and business (dummy)
  const fetchGames = async () => {
    setLoading(true);
    setTimeout(() => {
      setGames(dummyGames);
      setBusiness(dummyBusiness);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    if (businessSlug) fetchGames();
  }, [businessSlug]);

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

  // Simulate create/update with local state
  const handleSubmitGame = async (formData, isEdit) => {
    if (isEdit) {
      setGames((prev) =>
        prev.map((g) =>
          g._id === selectedGame._id ? { ...g, ...formData } : g
        )
      );
      showMessage("Game updated!", "success");
    } else {
      setGames((prev) => [
        ...prev,
        { ...formData, _id: Date.now().toString(), slug: formData.slug },
      ]);
      showMessage("Game created!", "success");
    }
    setOpenModal(false);
  };

  // Simulate delete with local state
  const handleDeleteGame = async () => {
    setGames((prev) => prev.filter((g) => g._id !== gameToDelete._id));
    showMessage("Game deleted!", "success");
    setConfirmOpen(false);
    setGameToDelete(null);
  };

  const { language } = useLanguage();
  const gamesTranslations = {
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
    },
  };

  return (
    <Box sx={{ position: "relative", display: "inline-block", width: "100%" }}>
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
                {gamesTranslations[language].gamesTitle} "{business?.name}"
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {gamesTranslations[language].gamesDescription}
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              {gamesTranslations[language].createGameButton}
            </Button>
          </Box>

          <Divider sx={{ mt: 2 }} />
        </Box>

        {loading ? (
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
                      <strong>{gamesTranslations[language].slugLabel}</strong>{" "}
                      {g.slug}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>
                        {gamesTranslations[language].optionCountLabel}
                      </strong>{" "}
                      {g.choicesCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>
                        {gamesTranslations[language].countdownTimerLabel}
                      </strong>{" "}
                      {g.countdownTimer} sec
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>
                        {gamesTranslations[language].quizTimeLabel}
                      </strong>{" "}
                      {g.gameSessionTimer} sec
                    </Typography>

                    {["coverImage", "nameImage", "backgroundImage"].map(
                      (imgKey) => (
                        <Box key={imgKey} sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {gamesTranslations[language][`${imgKey}Label`]}:
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
                          `/cms/modules/quiznest/businesses/${businessSlug}/games/${g.slug}/questions`
                        )
                      }
                    >
                      {gamesTranslations[language].questionsButton}
                    </Button>

                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<LeaderboardIcon />}
                      onClick={() =>
                        router.push(
                          `/cms/modules/quiznest/businesses/${businessSlug}/games/${g.slug}/results`
                        )
                      }
                    >
                      {gamesTranslations[language].resultsButton}
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
          key={selectedGame?._id || "new"} // Ensures modal resets for each edit
          open={openModal}
          onClose={() => setOpenModal(false)}
          editMode={editMode}
          initialValues={selectedGame || {}}
          onSubmit={handleSubmitGame}
        />

        <ConfirmationDialog
          open={confirmOpen}
          title={gamesTranslations[language].deleteGameTitle}
          message={`${gamesTranslations[language].deleteGameMessage} "${gameToDelete?.title}"?`}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleDeleteGame}
        />
      </Container>
    </Box>
  );
}
