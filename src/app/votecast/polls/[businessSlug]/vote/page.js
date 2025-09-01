"use client";

import { useEffect, useState } from "react";
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
  Divider,
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
  getActivePollsByBusiness,
  voteOnPoll,
} from "@/services/votecast/pollService";
import DemoPoll from "@/components/DemoPoll";
import { getBusinessBySlug } from "@/services/businessService";
import LanguageSelector from "@/components/LanguageSelector";

export default function BusinessVotingPage() {
  const { businessSlug } = useParams();
  return businessSlug === "demo" ? (
    <DemoPoll />
  ) : (
    <RealPoll businessSlug={businessSlug} />
  );
}
const translations = {
  en: {
    voteNow: "Vote Now",
    chooseOption: "Choose the option that best fits you.",
    noActivePolls: "No Active Polls",
    noActivePollsDesc: "Currently there are no active polls for this business.",
    processing: "Processing...",
    nextPoll: "Next Poll",
    finish: "Finish",
    completed: "Completed",
    remaining: "Remaining",
    thankYou: "🎉 Thank You!",
    voteRecorded: "Your vote has been recorded successfully.",
    waitForResults: "Please wait for the host/admin to reveal the results.",
    done: "Done",
    selectOption: "Please select an option first.",
    voteSubmitted: "Vote submitted!",
    voteFailed: "Vote failed",
    failedToLoad: "Failed to load polls",
    // ManagePolls translations
    managePolls: "Manage Polls",
    selectBusinessDesc: "Select a business to view and manage its polls.",
    allPolls: "All Polls",
    activePolls: "Active Polls",
    archivedPolls: "Archived Polls",
    selectBusiness: "Select Business",
    createPoll: "Create Poll",
    exportPolls: "Export Polls",
    clone: "Clone",
    edit: "Edit",
    delete: "Delete",
    sharePollLink: "Share Poll Link",
    deletePoll: "Delete Poll",
    deleteConfirmation:
      "Are you sure you want to move this item to the Recycle Bin?",
    noBusiness: "No business",
    pollCreated: "Poll created successfully",
    pollUpdated: "Poll updated successfully",
    pollDeleted: "Poll deleted successfully",
    pollCloned: "Poll cloned successfully",
    failedToSave: "Failed to save poll.",
    failedToDelete: "Failed to delete poll.",
    failedToClone: "Failed to clone poll",
    failedToExport: "Failed to export polls.",
    selectBusinessFirst: "Please select a business first.",
    selectBusinessToExport: "Please select a business to export polls.",
    noPermission: "You don't have permission to access this business's polls.",
    businessNotFound: "Business not found.",
    failedToFetch: "Failed to fetch polls.",
    loadingError: "Failed to load businesses.",
    noBusinessFound:
      "No business found for your account. Please contact administrator.",
    noBusinessesAvailable: "No businesses available",
  },
  ar: {
    voteNow: "صوت الآن",
    chooseOption: "اختر الخيار الذي يناسبك أكثر.",
    noActivePolls: "لا توجد استطلاعات نشطة",
    noActivePollsDesc: "حاليًا لا توجد استطلاعات نشطة لهذا العمل.",
    processing: "جاري المعالجة...",
    nextPoll: "الاستطلاع التالي",
    finish: "إنهاء",
    completed: "مكتمل",
    remaining: "متبقي",
    thankYou: "🎉 شكرًا لك!",
    voteRecorded: "تم تسجيل صوتك بنجاح.",
    waitForResults: "يرجى انتظار المضيف/المسؤول للكشف عن النتائج.",
    done: "تم",
    selectOption: "يرجى اختيار خيار أولاً.",
    voteSubmitted: "تم إرسال الصوت!",
    voteFailed: "فشل في التصويت",
    failedToLoad: "فشل في تحميل الاستطلاعات",
    // ManagePolls translations
    managePolls: "إدارة الاستطلاعات",
    selectBusinessDesc: "اختر عملاً لعرض وإدارة استطلاعاته.",
    allPolls: "جميع الاستطلاعات",
    activePolls: "الاستطلاعات النشطة",
    archivedPolls: "الاستطلاعات المؤرشفة",
    selectBusiness: "اختر العمل",
    createPoll: "إنشاء استطلاع",
    exportPolls: "تصدير الاستطلاعات",
    clone: "نسخ",
    edit: "تحرير",
    delete: "حذف",
    sharePollLink: "مشاركة رابط الاستطلاع",
    deletePoll: "حذف الاستطلاع",
    deleteConfirmation:
      "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    noBusiness: "لا يوجد عمل",
    pollCreated: "تم إنشاء الاستطلاع بنجاح",
    pollUpdated: "تم تحديث الاستطلاع بنجاح",
    pollDeleted: "تم حذف الاستطلاع بنجاح",
    pollCloned: "تم نسخ الاستطلاع بنجاح",
    failedToSave: "فشل في حفظ الاستطلاع.",
    failedToDelete: "فشل في حذف الاستطلاع.",
    failedToClone: "فشل في نسخ الاستطلاع",
    failedToExport: "فشل في تصدير الاستطلاعات.",
    selectBusinessFirst: "يرجى اختيار عمل أولاً.",
    selectBusinessToExport: "يرجى اختيار عمل لتصدير الاستطلاعات.",
    noPermission: "ليس لديك إذن للوصول إلى استطلاعات هذا العمل.",
    businessNotFound: "العمل غير موجود.",
    failedToFetch: "فشل في جلب الاستطلاعات.",
    loadingError: "فشل في تحميل الأعمال.",
    noBusinessFound: "لم يتم العثور على عمل لحسابك. يرجى الاتصال بالمسؤول.",
    noBusinessesAvailable: "لا توجد أعمال متاحة",
  },
};
// ==========================================
// Real Polls Logic (Dynamic Based on Type)
// ==========================================
function RealPoll({ businessSlug }) {
  const { t, dir, align } = useI18nLayout(translations);
  const [polls, setPolls] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [highlightedOption, setHighlightedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(null);

  const getProgressColor = () => {
    const percent = ((currentIndex + 1) / polls.length) * 100;

    if (percent <= 8) return "#B71C1C"; // Very Dark Red
    if (percent <= 16) return "#C62828"; // Darker Red
    if (percent <= 24) return "#D32F2F"; // Dark Red
    if (percent <= 32) return "#E53935"; // Medium Red
    if (percent <= 40) return "#F4511E"; // Red-Orange
    if (percent <= 48) return "#FB8C00"; // Orange
    if (percent <= 56) return "#F9A825"; // Dark Yellow
    if (percent <= 64) return "#FBC02D"; // Yellow
    if (percent <= 72) return "#C0CA33"; // Yellow-Green
    if (percent <= 80) return "#7CB342"; // Light Green
    if (percent <= 88) return "#43A047"; // Medium Green
    return "#388E3C"; // Dark Green
  };

  const fetchBusinessInfo = async () => {
    const data = await getBusinessBySlug(businessSlug);
    setBusinessInfo(data);
  };

  const fetchPolls = async () => {
    const data = await getActivePollsByBusiness(businessSlug);
    setPolls(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBusinessInfo();
    fetchPolls();
  }, [businessSlug]);

  const handleVote = async (selectedIdx = null) => {
    const optionIndex = selectedIdx !== null ? selectedIdx : highlightedOption;

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
        <CircularProgress />
      </Box>
    );
  }

  if (polls.length === 0) {
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
            {t.noActivePolls}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t.noActivePollsDesc}
          </Typography>
        </Box>
      </Container>
    );
  }

  const currentPoll = polls[currentIndex];
  const optionCount = currentPoll.options.length;
  const pollType = currentPoll.type || "options";

  return (
    <>
    <LanguageSelector top={20} right={20} />
      <Box dir={dir} sx={{ minHeight: "calc(100vh - 235px)", p: 2 }}>
        
        {/* Top Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mt={5}
          mb={2}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {t.voteNow}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {t.chooseOption}
            </Typography>
          </Box>

          {/* Restart Icon */}
          <IconButton onClick={handleRestart} color="primary">
            <ICONS.replay fontSize="large" />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Poll Card */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
          }}
        >
          <Card
            elevation={6}
            sx={{
              width: "100%",
              maxWidth: 800,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            {/* Question */}
            <CardHeader
              title={currentPoll.question}
              titleTypographyProps={{
                fontWeight: "bold",
                fontSize: "1.4rem",
                textAlign: align,
              }}
              sx={{ bgcolor: "primary.main", color: "white", py: 3 }}
            />

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
              {/* Dynamic Options */}
              {pollType === "slider" ? (
                <>
                  {/* Centered Options */}
                  <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="center"
                    flexWrap="wrap"
                    sx={{
                      rowGap: 3,
                      mt: 3,
                      mb: 3,
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
                          setHighlightedOption(idx); // ✅ Highlight option
                          setSliderValue(idx); // ✅ Move slider thumb
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
                              ? "primary.main"
                              : "grey.300",
                          cursor: "pointer",
                          minHeight: 150,
                        }}
                      >
                        {/* Number */}
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          color={
                            highlightedOption === idx
                              ? "primary.main"
                              : "text.secondary"
                          }
                        >
                          {idx + 1}
                        </Typography>

                        {/* Image */}
                        {option.imageUrl && (
                          <Avatar
                            src={option.imageUrl}
                            variant="rounded"
                            sx={{
                              width: 64,
                              height: 64,
                              mt: 1,
                              mb: 1,
                              filter:
                                highlightedOption === idx
                                  ? "none"
                                  : "grayscale(100%)",
                              transition: "filter 0.3s",
                            }}
                          />
                        )}

                        {/* Text */}
                        <Typography
                          variant="caption"
                          textAlign={align}
                          fontWeight="bold"
                          color={
                            highlightedOption === idx
                              ? "primary.main"
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
                      </Box>
                    ))}
                  </Stack>

                  {/* Slider */}
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
                        mt: 4,
                        "& .MuiSlider-thumb": {
                          width: 24,
                          height: 24,
                          bgcolor: "white",
                          border: "2px solid",
                          borderColor: "primary.main",
                        },
                        "& .MuiSlider-track": {
                          height: 8,
                          bgcolor: () => {
                            const percent =
                              (sliderValue / (optionCount - 1)) * 100;

                            if (percent <= 20) return "#FF5B5B"; // Red
                            if (percent <= 40) return "#FFC300"; // Yellow
                            if (percent <= 60) return "#8BC34A"; // Light Green
                            if (percent <= 80) return "#4CAF50"; // Dark Green
                            return "#388E3C"; // Deep Green
                          },
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
                /* Regular Options Grid */
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
                          "&:hover": canSelect ? { bgcolor: "grey.100" } : {},
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
                          <Typography variant="body1" fontWeight="bold">
                            {option.text}
                          </Typography>
                        </Stack>

                        {/* ✅ Show spinner or check icon */}
                        {isSelected &&
                          (submitting ? (
                            <CircularProgress size={24} color="primary" />
                          ) : (
                            <ICONS.checkCircle fontSize="small" />
                          ))}
                      </Box>
                    );
                  })}
                </Stack>
              )}

              {/* Next/Finish Button */}
              {pollType === "slider" && (
                <Button
                  variant="contained"
                  size="large"
                  disabled={highlightedOption === null || submitting}
                  onClick={() => handleVote()}
                  startIcon={
                    submitting && <CircularProgress size={20} color="inherit" />
                  }
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

        {/* Progress Circle */}
        <Box
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

          {/* Center Text */}
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
        </Box>
      </Box>

      {/* Powered By Branding */}
      {businessInfo?.poweredByUrl && (
        <Box
          sx={{
            mt: 4,
            py: 2,
            width: "100%",
            bgcolor: "#000",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src={businessInfo.poweredByUrl}
            alt="Powered By"
            style={{
              width: "auto",
              height: "130px",
              objectFit: "contain",
            }}
          />
        </Box>
      )}

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
        {/* Dialog Title */}
        <DialogTitle
          sx={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "primary.main",
            pb: 1,
          }}
        >
          🎉 {t.thankYou}
        </DialogTitle>

        {/* Dialog Content */}
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

        {/* Dialog Actions */}
        <DialogActions
          sx={{
            justifyContent: "center",
            mt: 4,
          }}
        >
          <Button variant="contained" size="large" onClick={handleRestart}>
            {t.done}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
