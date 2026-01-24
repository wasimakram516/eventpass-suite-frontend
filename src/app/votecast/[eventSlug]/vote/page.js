"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Stack,
  Box,
  Avatar,
  Button,
  IconButton,
  CircularProgress,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import {
  getActivePollsByEvent,
  voteOnPoll,
} from "@/services/votecast/pollService";
import { getVoteCastEventBySlug } from "@/services/votecast/eventService";
import LanguageSelector from "@/components/LanguageSelector";
import Background from "@/components/Background";
import { getEventBackground } from "@/utils/eventBackground";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EventVotingPage() {
  const { eventSlug } = useParams();
  return <RealPoll eventSlug={eventSlug} />;
}

const translations = {
  en: {
    noActivePolls: "No Active Polls",
    noActivePollsDesc: "Currently there are no active polls for this event.",
    processing: "Processing...",
    nextPoll: "Next Poll",
    finish: "Submit",
    thankYou: "Thank You!",
    voteRecorded: "Your vote has been recorded successfully.",
    waitForResults: "Please wait for the host/admin to reveal the results.",
    done: "Done",
    selectOption: "Please select an option first.",
    voteSubmitted: "Vote submitted!",
    voteFailed: "Vote failed",
    failedToLoad: "Failed to load polls",
    eventNotFound: "Event not found",
  },
  ar: {
    noActivePolls: "لا توجد استطلاعات نشطة",
    noActivePollsDesc: "حاليًا لا توجد استطلاعات نشطة لهذه الفعالية.",
    processing: "جاري المعالجة...",
    nextPoll: "الاستطلاع التالي",
    finish: "إرسال",
    thankYou: " شكرًا لك!",
    voteRecorded: "تم تسجيل صوتك بنجاح.",
    waitForResults: "يرجى انتظار المضيف/المسؤول للكشف عن النتائج.",
    done: "تم",
    selectOption: "يرجى اختيار خيار أولاً.",
    voteSubmitted: "تم إرسال الصوت!",
    voteFailed: "فشل في التصويت",
    failedToLoad: "فشل في تحميل الاستطلاعات",
    eventNotFound: "الفعالية غير موجودة",
  },
};

function RealPoll({ eventSlug }) {
  const { t, dir, align, lang, language } = useI18nLayout(translations);
  const { language: contextLanguage } = useLanguage();
  const currentLang = lang || language || contextLanguage || "en";
  const [polls, setPolls] = useState([]);
  const [event, setEvent] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [highlightedOption, setHighlightedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);

  const getProgressColor = () => {
    const percent = ((currentIndex + 1) / polls.length) * 100;

    if (percent <= 8) return "#B71C1C";
    if (percent <= 16) return "#C62828";
    if (percent <= 24) return "#D32F2F";
    if (percent <= 32) return "#E53935";
    if (percent <= 40) return "#F4511E";
    if (percent <= 48) return "#FB8C00";
    if (percent <= 56) return "#F9A825";
    if (percent <= 64) return "#FBC02D";
    if (percent <= 72) return "#C0CA33";
    if (percent <= 80) return "#7CB342";
    if (percent <= 88) return "#43A047";
    return "#388E3C";
  };

  const getBackground = useMemo(() => {
    return getEventBackground(event, currentLang);
  }, [event, currentLang]);

  useEffect(() => {
    const fetchEventAndPolls = async () => {
      try {
        const eventData = await getVoteCastEventBySlug(eventSlug);
        if (eventData?.error || !eventData) {
          setLoading(false);
          return;
        }
        setEvent(eventData);

        const pollsData = await getActivePollsByEvent(eventSlug);
        setPolls(pollsData || []);
      } catch (error) {
        console.error("Failed to load:", error);
      }
      setLoading(false);
    };

    fetchEventAndPolls();
  }, [eventSlug]);

  const handleVote = async (selectedIdx = null) => {
    const optionIndex = selectedIdx !== null ? selectedIdx : highlightedOption;
    const currentPoll = polls[currentIndex];
    const pollType = currentPoll?.type || "options";

    setSubmitting(true);
    await voteOnPoll(polls[currentIndex]._id, optionIndex);

    if (currentIndex < polls.length - 1) {
      setTimeout(
        () => {
          setCurrentIndex((prev) => prev + 1);
          setSliderValue(0);
          setHighlightedOption(null);
          setSubmitting(false);
        },
        pollType === "options" ? 1000 : 0
      );
    } else {
      setFinished(true);
    }
    setSubmitting(false);
  };

  const handleRestart = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Background />
        {/* <CircularProgress /> */}
      </Box>
    );
  }

  if (!event) {
    return (
      <Container
        maxWidth="sm"
        sx={{
          minHeight: "calc(100vh - 90px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: align,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {t.eventNotFound}
          </Typography>
        </Box>
      </Container>
    );
  }

  if (polls.length === 0) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {getBackground?.fileType === "video" ? (
          <Box
            key={`bg-video-${currentLang}-${getBackground.url}`}
            component="video"
            src={getBackground.url}
            autoPlay
            loop
            muted
            playsInline
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: -1,
              pointerEvents: "none",
            }}
          />
        ) : getBackground?.url ? (
          <Box
            key={`bg-image-${currentLang}-${getBackground.url}`}
            component="img"
            src={getBackground.url}
            alt="Event background"
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: -1,
              pointerEvents: "none",
            }}
          />
        ) : (
          <Background key={`bg-default-${currentLang}`} />
        )}
        {/* <LanguageSelector top={20} right={20} /> */}
        <Container
          maxWidth="sm"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: align,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {t.noActivePolls}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.noActivePollsDesc}
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  const currentPoll = polls[currentIndex];
  const optionCount = currentPoll.options.length;
  const pollType = currentPoll.type || "options";

  return (
    <>
      {/* <LanguageSelector top={20} right={20} /> */}

      {/* Event Logo - At the top of the page */}
      {event.logoUrl && (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: 800,
            height: "auto",
            maxHeight: { xs: 120, sm: 150 },
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: 3,
            mb: 3,
            mx: "auto",
            mt: 2,
            zIndex: 100,
          }}
        >
          <Box
            component="img"
            src={event.logoUrl}
            alt={`${event.name} Logo`}
            sx={{
              display: "block",
              width: "100%",
              height: "auto",
              maxHeight: { xs: 120, sm: 150 },
              maxWidth: { xs: "100%", sm: "none" },
              objectFit: "contain",
            }}
          />
        </Box>
      )}

      <Box
        dir={dir}
        sx={{
          minHeight: "100vh",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        {/* Background */}
        {getBackground?.fileType === "video" ? (
          <Box
            key={`bg-video-${currentLang}-${getBackground.url}`}
            component="video"
            src={getBackground.url}
            autoPlay
            loop
            muted
            playsInline
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: -1,
              pointerEvents: "none",
            }}
          />
        ) : getBackground?.url ? (
          <Box
            key={`bg-image-${currentLang}-${getBackground.url}`}
            component="img"
            src={getBackground.url}
            alt="Event background"
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: -1,
              pointerEvents: "none",
            }}
          />
        ) : (
          <Background key={`bg-default-${currentLang}`} />
        )}

        {/* Restart Icon - commented out */}
        {/* <IconButton
          onClick={handleRestart}
          color="primary"
          sx={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 10,
          }}
        >
          <ICONS.replay fontSize="large" />
        </IconButton> */}

        {/* Logo and Card Container */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 800,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >

          {/* Poll Card */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Card
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: 800,
                borderRadius: 4,
                overflow: "hidden",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
              }}
            >
              {/* Content */}
              <CardContent
                sx={{
                  p: 4,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {/* Question - Moved to white area, horizontally centered */}
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    fontSize: { xs: "1.2rem", md: "1.4rem" },
                    textAlign: "center",
                    width: "100%",
                    mb: 2,
                  }}
                >
                  {currentPoll.question}
                </Typography>
                {/* Dynamic Options */}
                {pollType === "slider" ? (
                  <>


                    <Stack
                      direction="row"
                      spacing={2}
                      justifyContent="center"
                      flexWrap="wrap"
                      sx={{
                        rowGap: 3,
                        mt: 1,
                        mb: 1,
                      }}
                    >
                      {currentPoll.options.map((option, idx) => (
                        <Box
                          key={idx}
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                          width={{ xs: 100, sm: 100 }}
                          onClick={() => {
                            setHighlightedOption(idx);
                            setSliderValue(idx);
                          }}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            border:
                              highlightedOption === idx
                                ? "2px solid"
                                : "2px dashed",
                            borderColor:
                              highlightedOption === idx
                                ? "#ff8200"
                                : "grey.300",
                            cursor: "pointer",
                            minHeight: 150,
                          }}
                        >
                          {option.imageUrl && (
                            <Avatar
                              src={option.imageUrl}
                              variant="rounded"
                              sx={{
                                width: 64,
                                height: 64,
                                mt: 1,
                                mb: 1,
                                opacity: highlightedOption === idx ? 1 : 0.4,
                                transition: "opacity 0.3s",
                              }}
                            />
                          )}

                          {option.text && (
                            <Typography
                              variant="caption"
                              textAlign={align}
                              fontWeight="bold"
                              color={
                                highlightedOption === idx
                                  ? "#ff8200"
                                  : "text.secondary"
                              }
                              sx={{
                                wordBreak: "break-word",
                                fontSize: { xs: "0.75rem", sm: "0.8rem" },
                                maxWidth: 80,
                              }}
                            >
                              {option.text}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Stack>

                    {/* Helper text below options */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        textAlign: "center",
                        mt: 1,
                        mb: 1,
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      }}
                    >
                      {currentLang === "ar"
                        ? "يمكنك اختيار الخيارات بالنقر عليها أو بتحريك المنزلق"
                        : "You can select options by clicking them or moving the slider"}
                    </Typography>

                    <Box width="100%" px={4}>
                      <Slider
                        value={sliderValue}
                        onChange={(e, val) => {
                          setSliderValue(val);
                          const closest = Math.round(val);
                          if (closest !== highlightedOption) {
                            setHighlightedOption(closest);
                          }
                        }}
                        step={0.01}
                        min={0}
                        max={optionCount - 1}
                        sx={{
                          mt: 1,
                          "& .MuiSlider-thumb": {
                            width: 24,
                            height: 24,
                            bgcolor: "white",
                            border: "2px solid",
                            borderColor: "#ff8200",
                          },
                          "& .MuiSlider-track": {
                            height: 8,
                            bgcolor: "#ff8200",
                          },
                          "& .MuiSlider-rail": {
                            height: 8,
                            bgcolor: "grey.300",
                          },
                        }}
                      />
                    </Box>
                  </>
                ) : (
                  <Stack spacing={2} width="100%">
                    {currentPoll.options.map((option, idx) => {
                      const isSelected = highlightedOption === idx;
                      const canSelect = highlightedOption === null;

                      return (
                        <Box
                          key={idx}
                          onClick={() => {
                            if (canSelect && !submitting) {
                              setHighlightedOption(idx);
                              handleVote(idx);
                            }
                          }}
                          sx={{
                            p: 2,
                            border: "2px solid",
                            borderColor: isSelected ? "primary.main" : "grey.300",
                            borderRadius: 3,
                            cursor: canSelect ? "pointer" : "default",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            transition: "all 0.3s",
                            "&:hover": canSelect ? { bgcolor: "rgba(0,0,0,0.05)" } : {},
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={2}
                            sx={{
                              gap: dir === "rtl" ? 2 : 0,
                            }}
                          >
                            {option.imageUrl && (
                              <Avatar
                                src={option.imageUrl}
                                alt={`Option ${idx + 1}`}
                                variant="rounded"
                                sx={{ width: 48, height: 48 }}
                              />
                            )}
                            {option.text && (
                              <Typography variant="body1" fontWeight="bold">
                                {option.text}
                              </Typography>
                            )}
                          </Stack>

                          {isSelected &&
                            (submitting ? (
                              // <CircularProgress size={24} color="primary" />
                              <Box sx={{ width: 24, height: 24 }} />
                            ) : (
                              <ICONS.checkCircle fontSize="small" />
                            ))}
                        </Box>
                      );
                    })}
                  </Stack>
                )}

                {/* Next/Submit Button */}
                {pollType === "slider" && (
                  <Button
                    variant="contained"
                    size="large"
                    disabled={highlightedOption === null || submitting}
                    onClick={() => handleVote()}
                    startIcon={
                      submitting && <CircularProgress size={20} color="inherit" />
                    }
                    sx={{
                      backgroundColor: "#ff8200",
                      "&:hover": {
                        backgroundColor: "#e67500",
                      },
                    }}
                  >
                    {submitting
                      ? t.processing
                      : currentIndex < polls.length - 1
                        ? t.nextPoll
                        : t.finish}
                  </Button>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Progress Circle - commented out */}
        {/* <Box
          sx={{
            width: 140,
            height: 140,
            my: 4,
            mx: "auto",
            position: "relative",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: "Completed", value: currentIndex + 1 },
                  {
                    name: "Remaining",
                    value: polls.length - (currentIndex + 1),
                  },
                ]}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
              >
                <Cell fill={getProgressColor()} />
                <Cell fill="#e0e0e0" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: align,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              {currentIndex + 1}/{polls.length}
            </Typography>
          </Box>
        </Box> */}
      </Box>

      {/* Thank You Dialog */}
      <Dialog
        open={finished}
        onClose={handleRestart}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 3,
            maxWidth: { xs: "90%", sm: 420 },
            width: { xs: "90%", sm: "auto" },
            mx: "auto",
            textAlign: align,
            boxShadow: 6,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#ff8200",
            pb: 1,
          }}
        >
          {t.thankYou}
        </DialogTitle>

        <DialogContent sx={{ mt: 1 }}>
          <Typography
            variant="body1"
            fontWeight="medium"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            {t.voteRecorded}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t.waitForResults}
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: "center",
            mt: 4,
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={handleRestart}
            startIcon={<ICONS.check />}
            sx={{
              backgroundColor: "#ff8200",
              "&:hover": {
                backgroundColor: "#e67500",
              },
            }}
          >
            {t.done}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

