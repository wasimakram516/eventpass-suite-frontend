"use client";

import { Fragment, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import AppCard from "@/components/cards/AppCard";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { useMessage } from "@/contexts/MessageContext";
import {
  getPublicPollBySlug,
  getPollResults,
  getPollVoterResults,
  resetVotes,
} from "@/services/votecast/pollService";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import { getFieldIcon } from "@/utils/iconMapper";
import NoDataAvailable from "@/components/NoDataAvailable";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";

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
    failedToResetVotes: "Failed to reset votes.",
    pollNotFound: "Poll not found",
    unknownName: "Unknown voter",
    anonymous: "Anonymous",
    votedAt: "Voted At",
    voterDetails: "Voter Details",
    name: "Name",
    email: "Email",
    phone: "Phone",
    votesTitle: "Votes",
    voted: "VOTED",
    showMoreAnswers: "Show more",
    showLessAnswers: "Show fewer",
    records: "records",
    showing: "Showing",
    of: "of",
  },
  ar: {
    title: "عارض نتائج الاستطلاع",
    subtitle: "عرض النتائج والتحليلات لهذا الاستطلاع.",
    resetVotes: "إعادة تعيين الأصوات",
    viewFullScreen: "عرض بملء الشاشة",
    confirmVoteReset: "تأكيد إعادة تعيين الأصوات",
    resetConfirmation: "هل أنت متأكد من أنك تريد إعادة تعيين جميع الأصوات؟ لا يمكن التراجع عن هذا الإجراء.",
    resetButton: "إعادة تعيين",
    votesResetSuccess: "تم إعادة تعيين الأصوات بنجاح",
    failedToResetVotes: "فشل في إعادة تعيين الأصوات.",
    pollNotFound: "الاستطلاع غير موجود",
    unknownName: "مصوت مجهول",
    anonymous: "مجهول",
    votedAt: "وقت التصويت",
    voterDetails: "تفاصيل المصوت",
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    votesTitle: "الأصوات",
    voted: "صوّت",
    showMoreAnswers: "عرض المزيد",
    showLessAnswers: "عرض أقل",
    records: "سجلات",
    showing: "عرض",
    of: "من",
  },
};

function OptionThumb({ url, label, size = 18 }) {
  if (!url) return null;
  return (
    <Avatar
      variant="rounded"
      sx={{
        width: size,
        height: size,
        mr: 0.5,
        border: (t) => `1px solid ${t.palette.divider}`,
        bgcolor: "background.paper",
      }}
    >
      <img alt={label || "option"} src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </Avatar>
  );
}

// Identical to SurveyGuru's FieldRow
function FieldRow({ icon, primary, secondary, dir, align }) {
  return (
    <ListItem dense disableGutters sx={{ px: 0, py: 0.5 }} dir={dir}>
      {icon && (
        <ListItemIcon sx={{ minWidth: 34, color: "text.secondary" }}>
          {icon}
        </ListItemIcon>
      )}
      <ListItemText
        disableTypography
        primary={
          <Typography variant="body2" color="text.secondary" component="div" sx={{ textAlign: align }}>
            {primary}
          </Typography>
        }
        secondary={
          <Typography variant="body1" fontWeight={500} component="div" sx={{ textAlign: align }}>
            {secondary || "N/A"}
          </Typography>
        }
      />
    </ListItem>
  );
}

// VoterCard — exact same structure as SurveyGuru ResponseCard
function VoterCard({ voter, t, dir, align, language, isAnonymous }) {
  const [showAllVotes, setShowAllVotes] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);

  const PREVIEW_COUNT = 4;

  const votes = voter.votes || [];
  const hasMoreVotes = votes.length > PREVIEW_COUNT;
  const visibleVotes = showAllVotes ? votes : votes.slice(0, PREVIEW_COUNT);

  const customEntries = Object.entries(voter.customFields || {}).filter(
    ([, val]) => val !== null && val !== "" && val !== undefined
  );

  const detailFields = [
    ...(voter.fullName ? [{ key: "__name", icon: <ICONS.personOutline fontSize="small" />, primary: t.name, secondary: voter.fullName }] : []),
    ...(voter.email ? [{ key: "__email", icon: <ICONS.emailOutline fontSize="small" />, primary: t.email, secondary: voter.email }] : []),
    ...(voter.phone ? [{ key: "__phone", icon: <ICONS.phone fontSize="small" />, primary: t.phone, secondary: <span dir="ltr" style={{ unicodeBidi: "embed" }}>{voter.phoneCode ? `${voter.phoneCode}${voter.phone}` : voter.phone}</span> }] : []),
    ...customEntries.map(([key, val]) => {
      const isPhone = /^(phone|mobile|tel(ephone)?|cell)$/i.test(String(key).trim());
      const secondary = isPhone && voter.phoneCode
        ? <span dir="ltr" style={{ unicodeBidi: "embed" }}>{`${voter.phoneCode}${val}`}</span>
        : String(val);
      return { key, icon: getFieldIcon(key), primary: key, secondary };
    }),
  ];
  const hasDetails = detailFields.length > 0;
  const hasMoreDetails = detailFields.length > PREVIEW_COUNT;
  const visibleDetails = showAllDetails ? detailFields : detailFields.slice(0, PREVIEW_COUNT);

  return (
    <AppCard
      sx={{ width: "100%", height: "100%", overflow: "hidden" }}
      dir={dir}
    >
      {/* HEADER */}
      <Box sx={{ p: 1.5, pb: 0.5 }}>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1.25 }}
        >
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
            <ICONS.personOutline />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body1"
              fontWeight={700}
              sx={{
                textAlign: align,
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {isAnonymous ? t.anonymous : (voter.fullName || t.unknownName)}
            </Typography>
          </Box>
        </Box>
      </Box>

      <CardContent sx={{ pt: 1, px: 1.5, pb: 1.5 }}>
        {/* Voted At */}
        <Box sx={{ mb: 1 }}>
          {voter.votedAt && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ICONS.eventOutline fontSize="small" color="text.secondary" />
              <Typography variant="caption" color="text.secondary">
                {t.votedAt}: {formatDateTimeWithLocale(voter.votedAt, language === "ar" ? "ar-SA" : "en-GB")}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Voter Details: email, phone, custom fields — hidden for anonymous votes */}
        {!isAnonymous && hasDetails && (
          <Fragment>
            <Typography variant="overline" sx={{ letterSpacing: 0.6, textAlign: align }}>
              {t.voterDetails}
            </Typography>
            <List dense sx={{ py: 0 }}>
              {visibleDetails.map((field) => (
                <FieldRow
                  key={field.key}
                  icon={field.icon || null}
                  primary={field.primary}
                  secondary={field.secondary}
                  dir={dir}
                  align={align}
                />
              ))}
            </List>
            {hasMoreDetails && (
              <Button
                size="small"
                variant="text"
                onClick={() => setShowAllDetails((v) => !v)}
                startIcon={showAllDetails ? <ICONS.expandLess /> : <ICONS.expandMore />}
                sx={{
                  mt: 0.25,
                  px: 0,
                  minWidth: 0,
                  fontWeight: 700,
                  alignSelf: align === "right" ? "flex-end" : "flex-start",
                  ...getStartIconSpacing(dir),
                }}
              >
                {showAllDetails
                  ? t.showLessAnswers
                  : `${t.showMoreAnswers} (${detailFields.length - PREVIEW_COUNT})`}
              </Button>
            )}
          </Fragment>
        )}

        {!isAnonymous && hasDetails && <Divider sx={{ my: 1 }} />}

        {/* Votes — same layout as SurveyGuru Answers section */}
        <Typography variant="overline" sx={{ letterSpacing: 0.6, textAlign: align }}>
          {t.votesTitle}
        </Typography>

        <List dense sx={{ py: 0 }}>
          {visibleVotes.map((v) => (
            <ListItem key={v.questionId} dense disableGutters sx={{ px: 0, py: 0.5, overflow: "hidden" }}>
              <ListItemIcon
                sx={{
                  minWidth: 34,
                  flexShrink: 0,
                  color: "text.secondary",
                  ...(dir === "rtl" ? { ml: 1 } : { mr: 1 }),
                }}
              >
                <ICONS.assignmentOutline fontSize="small" />
              </ListItemIcon>
              <ListItemText
                disableTypography
                sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}
                primary={
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: align, wordBreak: "break-word", overflowWrap: "break-word" }}>
                    {v.question}
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 0.25, textAlign: align, overflow: "hidden", maxWidth: "100%" }}>
                    <Chip
                      size="small"
                      label={v.optionText || "—"}
                      variant="outlined"
                      avatar={v.optionImage ? <OptionThumb url={v.optionImage} label={v.optionText} /> : undefined}
                      sx={{
                        maxWidth: "100%",
                        "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" },
                        ...(v.optionImage ? { "& .MuiChip-avatar": { width: 18, height: 18, borderRadius: 4 } } : {}),
                      }}
                    />
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        {hasMoreVotes && (
          <Button
            size="small"
            variant="text"
            onClick={() => setShowAllVotes((prev) => !prev)}
            startIcon={showAllVotes ? <ICONS.expandLess /> : <ICONS.expandMore />}
            sx={{
              mt: 0.25,
              px: 0,
              minWidth: 0,
              fontWeight: 700,
              alignSelf: align === "right" ? "flex-end" : "flex-start",
              ...getStartIconSpacing(dir),
            }}
          >
            {showAllVotes
              ? t.showLessAnswers
              : `${t.showMoreAnswers} (${votes.length - PREVIEW_COUNT})`}
          </Button>
        )}
      </CardContent>
    </AppCard>
  );
}

// Reshape per-question/option/voter data → flat per-voter list
function buildVoterList(voterResults) {
  const voterMap = new Map();
  for (const question of voterResults.questions || []) {
    for (let optIdx = 0; optIdx < (question.options || []).length; optIdx++) {
      const option = question.options[optIdx];
      for (const voter of option.voters || []) {
        const key = String(voter._id);
        if (!voterMap.has(key)) {
          voterMap.set(key, {
            _id: voter._id,
            fullName: voter.fullName,
            email: voter.email,
            phone: voter.phone,
            phoneCode: voter.phoneCode || null,
            votedAt: voter.votedAt,
            customFields: voter.customFields || {},
            isAnonymous: voter.isAnonymous === true,
            votes: [],
          });
        }
        voterMap.get(key).votes.push({
          questionId: question._id,
          question: question.question,
          optionText: option.text,
          optionImage: option.imageUrl || null,
        });
      }
    }
  }
  return Array.from(voterMap.values());
}

const CARDS_PER_PAGE = 12;

export default function PollResultsPage() {
  const { pollSlug } = useParams();
  const { showMessage } = useMessage();
  const { t, dir, align, language } = useI18nLayout(translations);

  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState([]);
  const [voterResults, setVoterResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const [page, setPage] = useState(1);

  const fetchResults = async (pollId) => {
    const [data, voterData] = await Promise.all([
      getPollResults(pollId),
      getPollVoterResults(pollId),
    ]);
    setResults(Array.isArray(data) ? data : []);
    setVoterResults(voterData || null);
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
      setPage(1);
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

  const voterList = voterResults ? buildVoterList(voterResults) : [];
  const totalVoters = voterList.length;
  const displayVoters = voterList.slice((page - 1) * CARDS_PER_PAGE, page * CARDS_PER_PAGE);

  return (
    <>
      <Box dir={dir}>
        <Container maxWidth={false} disableGutters>
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

            {poll && totalVoters > 0 && (
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
            /* ALL POLLS → voter cards (SurveyGuru-style); anonymous for unlinked */
            !totalVoters ? (
              <NoDataAvailable />
            ) : (
              <Fragment>
                <Typography variant="body2" color="text.secondary" mb={2.5} px={0.5}>
                  {t.showing} {Math.min((page - 1) * CARDS_PER_PAGE + 1, totalVoters)}–{Math.min(page * CARDS_PER_PAGE, totalVoters)} {t.of} {totalVoters} {t.records}
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
                  {displayVoters.map((voter) => (
                    <Box
                      key={String(voter._id)}
                      sx={{ width: { xs: "100%", sm: "calc(50% - 8px)", md: "calc(33.333% - 11px)" }, minWidth: 0 }}
                    >
                      <VoterCard
                        voter={voter}
                        t={t}
                        dir={dir}
                        align={align}
                        language={language}
                        isAnonymous={voter.isAnonymous}
                      />
                    </Box>
                  ))}
                </Box>

                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    dir="ltr"
                    count={Math.ceil(totalVoters / CARDS_PER_PAGE)}
                    page={Math.min(page, Math.ceil(totalVoters / CARDS_PER_PAGE) || 1)}
                    onChange={(_, v) => setPage(v)}
                  />
                </Box>
              </Fragment>
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
