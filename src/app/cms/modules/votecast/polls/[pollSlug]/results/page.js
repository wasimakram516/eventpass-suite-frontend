"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Divider,
} from "@mui/material";
import ResultsChart from "@/components/cards/ResultsChart";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { useMessage } from "@/contexts/MessageContext";
import { getPublicPollBySlug, getPollResults, resetVotes } from "@/services/votecast/pollService";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import NoDataAvailable from "@/components/NoDataAvailable";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    title: "Poll Results Viewer",
    subtitle: "View results and analytics for this poll.",
    resetVotes: "Reset Votes",
    viewFullScreen: "View Full Screen",
    confirmVoteReset: "Confirm Vote Reset",
    resetConfirmation: "Are you sure you want to reset all votes for this poll? This action cannot be undone.",
    resetButton: "Reset",
    votesResetSuccess: "Votes reset successfully",
    failedToFetchResults: "Failed to fetch poll results.",
    failedToResetVotes: "Failed to reset votes.",
    pollNotFound: "Poll not found",
  },
  ar: {
    title: "عارض نتائج الاستطلاع",
    subtitle: "عرض النتائج والتحليلات لهذا الاستطلاع.",
    resetVotes: "إعادة تعيين الأصوات",
    viewFullScreen: "عرض بملء الشاشة",
    confirmVoteReset: "تأكيد إعادة تعيين الأصوات",
    resetConfirmation: "هل أنت متأكد من أنك تريد إعادة تعيين جميع الأصوات لهذا الاستطلاع؟ لا يمكن التراجع عن هذا الإجراء.",
    resetButton: "إعادة تعيين",
    votesResetSuccess: "تم إعادة تعيين الأصوات بنجاح",
    failedToFetchResults: "فشل في جلب نتائج الاستطلاع.",
    failedToResetVotes: "فشل في إعادة تعيين الأصوات.",
    pollNotFound: "الاستطلاع غير موجود",
  },
};

export default function PollResultsPage() {
  const { pollSlug } = useParams();
  const { showMessage } = useMessage();
  const { t, dir } = useI18nLayout(translations);

  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);

  const fetchResults = async (pollId) => {
    const data = await getPollResults(pollId);
    setResults(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (!pollSlug) return;
    const init = async () => {
      setLoading(true);
      const pollData = await getPublicPollBySlug(pollSlug);
      if (!pollData || pollData.error) {
        showMessage(t.pollNotFound, "error");
        setLoading(false);
        return;
      }
      setPoll(pollData);
      await fetchResults(pollData._id);
      setLoading(false);
    };
    init();
  }, [pollSlug]);

  const handleResetVotes = async () => {
    if (!poll?._id) return;
    setLoading(true);
    try {
      await resetVotes(poll._id);
      await fetchResults(poll._id);
      showMessage(t.votesResetSuccess, "success");
    } catch {
      showMessage(t.failedToResetVotes, "error");
    }
    setLoading(false);
    setConfirmReset(false);
  };

  const handleViewFullScreen = () => {
    if (!poll?.slug) return;
    window.open(`/votecast/${poll.slug}/results`, "_blank");
  };

  return (
    <>
      <Box dir={dir}>
        <Container maxWidth="lg">
          <BreadcrumbsNav />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
            mb={2}
          >
            <Box>
              <Typography variant="h4" fontWeight="bold">{t.title}</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {t.subtitle}
              </Typography>
            </Box>

            {poll && results.length > 0 && (
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setConfirmReset(true)}
                  startIcon={<ICONS.refresh fontSize="small" />}
                  sx={getStartIconSpacing(dir)}
                >
                  {t.resetVotes}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleViewFullScreen}
                  startIcon={<ICONS.fullscreen fontSize="small" />}
                  sx={getStartIconSpacing(dir)}
                >
                  {t.viewFullScreen}
                </Button>
              </Stack>
            )}
          </Stack>

          <Divider sx={{ mb: 4 }} />

          {loading ? (
            <Box sx={{ textAlign: "center", mt: 8 }}>
              <CircularProgress />
            </Box>
          ) : results.length === 0 ? (
            <NoDataAvailable />
          ) : (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 4,
                py: 4,
              }}
            >
              {results.map((question) => (
                <ResultsChart key={question._id} poll={question} />
              ))}
            </Box>
          )}
        </Container>
      </Box>

      <ConfirmationDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleResetVotes}
        title={t.confirmVoteReset}
        message={t.resetConfirmation}
        confirmButtonText={t.resetButton}
        confirmButtonIcon={<ICONS.refresh fontSize="small" />}
      />
    </>
  );
}
