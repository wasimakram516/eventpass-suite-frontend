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
import { getResults } from "@/services/votecast/pollsResultService";
import { resetVotes } from "@/services/votecast/pollService";
import { getVoteCastEventBySlug } from "@/services/votecast/eventService";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    title: "Poll Results Viewer",
    subtitle: "View poll results and analytics for this event.",
    resetVotes: "Reset Votes",
    viewFullScreen: "View Full Screen",
    confirmVoteReset: "Confirm Vote Reset",
    resetConfirmation:
      "Are you sure you want to reset all votes for this event's polls? This action cannot be undone.",
    resetButton: "Reset",
    votesResetSuccess: "Votes reset successfully",
    failedToFetchResults: "Failed to fetch poll results.",
    failedToResetVotes: "Failed to reset votes.",
    eventNotFound: "Event not found",
  },
  ar: {
    title: "عارض نتائج الاستطلاع",
    subtitle: "عرض نتائج الاستطلاع والتحليلات لهذه الفعالية.",
    resetVotes: "إعادة تعيين الأصوات",
    viewFullScreen: "عرض بملء الشاشة",
    confirmVoteReset: "تأكيد إعادة تعيين الأصوات",
    resetConfirmation:
      "هل أنت متأكد من أنك تريد إعادة تعيين جميع الأصوات لاستطلاعات هذه الفعالية؟ لا يمكن التراجع عن هذا الإجراء.",
    resetButton: "إعادة تعيين",
    votesResetSuccess: "تم إعادة تعيين الأصوات بنجاح",
    failedToFetchResults: "فشل في جلب نتائج الاستطلاع.",
    failedToResetVotes: "فشل في إعادة تعيين الأصوات.",
    eventNotFound: "الفعالية غير موجودة",
  },
};

export default function ResultsPage() {
  const { eventSlug } = useParams();
  const { showMessage } = useMessage();
  const { t, dir } = useI18nLayout(translations);
  const [event, setEvent] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const fetchEventAndResults = async () => {
      if (!eventSlug) return;

      setLoading(true);
      try {
        const eventData = await getVoteCastEventBySlug(eventSlug);
        if (eventData?.error || !eventData) {
          showMessage(t.eventNotFound, "error");
          setLoading(false);
          return;
        }
        setEvent(eventData);

        const resultsData = await getResults(eventData._id);
        setResults(resultsData || []);
      } catch (error) {
        showMessage(t.failedToFetchResults, "error");
      }
      setLoading(false);
    };

    fetchEventAndResults();
  }, [eventSlug]);

  const handleResetVotes = async () => {
    if (!event?._id) return;

    setLoading(true);

    try {
      await resetVotes(event._id);
      const resultsData = await getResults(event._id);
      setResults(resultsData || []);
      showMessage(t.votesResetSuccess, "success");
    } catch (error) {
      showMessage(t.failedToResetVotes, "error");
    }

    setLoading(false);
    setConfirmReset(false);
  };

  const handleViewFullScreen = () => {
    if (!event?.slug) return;
    window.open(`/votecast/${event.slug}/results`, "_blank");
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
              <Typography variant="h4" fontWeight="bold">
                {t.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {t.subtitle}
              </Typography>
            </Box>

            {event && results.length > 0 && (
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                alignItems="flex-start"
                sx={{
                  gap: dir === "rtl" ? 1 : 0,
                }}
              >
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

          {!event ? (
            <EmptyBusinessState />
          ) : loading && results.length === 0 ? (
            <Box sx={{ textAlign: "center", mt: 8 }}>
              <CircularProgress />
            </Box>
          ) : results.length === 0 ? (
            <NoDataAvailable />
          ) : (
            results.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 4,
                  py: 4,
                }}
              >
                {results.map((poll) => (
                  <ResultsChart key={poll._id} poll={poll} />
                ))}
              </Box>
            )
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

