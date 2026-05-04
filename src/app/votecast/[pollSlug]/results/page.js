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
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Pagination,
  Typography,
} from "@mui/material";
import AppCard from "@/components/cards/AppCard";
import { getPublicPollBySlug, getPollVoterResults } from "@/services/votecast/pollService";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import { getFieldIcon } from "@/utils/iconMapper";
import NoDataAvailable from "@/components/NoDataAvailable";
import LanguageSelector from "@/components/LanguageSelector";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";

const translations = {
  en: {
    anonymous: "Anonymous",
    unknownName: "Unknown voter",
    votedAt: "Voted At",
    voterDetails: "VOTER DETAILS",
    votesTitle: "VOTES",
    name: "Name",
    email: "Email",
    phone: "Phone",
    showMoreAnswers: "Show more",
    showLessAnswers: "Show less",
    noResults: "No results available.",
    pollNotFound: "Poll not found",
    records: "records",
    showing: "Showing",
    of: "of",
  },
  ar: {
    anonymous: "مجهول",
    unknownName: "ناخب غير معروف",
    votedAt: "وقت التصويت",
    voterDetails: "تفاصيل الناخب",
    votesTitle: "الأصوات",
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    showMoreAnswers: "عرض المزيد",
    showLessAnswers: "عرض أقل",
    noResults: "لا توجد نتائج متاحة.",
    pollNotFound: "الاستطلاع غير موجود",
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

const PREVIEW_COUNT = 4;

function VoterCard({ voter, t, dir, align, language, isAnonymous }) {
  const [showAllVotes, setShowAllVotes] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
            <ICONS.personOutline />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body1"
              fontWeight={700}
              sx={{ textAlign: align, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              {isAnonymous ? t.anonymous : (voter.fullName || t.unknownName)}
            </Typography>
          </Box>
        </Box>
      </Box>

      <CardContent sx={{ pt: 1, px: 1.5, pb: 1.5 }}>
        {voter.votedAt && (
          <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <ICONS.eventOutline fontSize="small" color="text.secondary" />
            <Typography variant="caption" color="text.secondary">
              {t.votedAt}: {formatDateTimeWithLocale(voter.votedAt, language === "ar" ? "ar-SA" : "en-GB")}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 1 }} />

        {!isAnonymous && hasDetails && (
          <Fragment>
            <Typography variant="overline" sx={{ letterSpacing: 0.6, textAlign: align }}>
              {t.voterDetails}
            </Typography>
            <List dense sx={{ py: 0 }}>
              {visibleDetails.map((field) => (
                <FieldRow key={field.key} icon={field.icon || null} primary={field.primary} secondary={field.secondary} dir={dir} align={align} />
              ))}
            </List>
            {hasMoreDetails && (
              <Button
                size="small"
                variant="text"
                onClick={() => setShowAllDetails((v) => !v)}
                startIcon={showAllDetails ? <ICONS.expandLess /> : <ICONS.expandMore />}
                sx={{ mt: 0.25, px: 0, minWidth: 0, fontWeight: 700 }}
              >
                {showAllDetails ? t.showLessAnswers : `${t.showMoreAnswers} (${detailFields.length - PREVIEW_COUNT})`}
              </Button>
            )}
          </Fragment>
        )}

        {!isAnonymous && hasDetails && <Divider sx={{ my: 1 }} />}

        <Typography variant="overline" sx={{ letterSpacing: 0.6, textAlign: align }}>
          {t.votesTitle}
        </Typography>

        <List dense sx={{ py: 0 }}>
          {visibleVotes.map((v) => (
            <ListItem key={v.questionId} dense disableGutters sx={{ px: 0, py: 0.5, overflow: "hidden" }}>
              <ListItemIcon sx={{ minWidth: 34, flexShrink: 0, color: "text.secondary", ...(dir === "rtl" ? { ml: 1 } : { mr: 1 }) }}>
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
            sx={{ mt: 0.25, px: 0, minWidth: 0, fontWeight: 700 }}
          >
            {showAllVotes ? t.showLessAnswers : `${t.showMoreAnswers} (${votes.length - PREVIEW_COUNT})`}
          </Button>
        )}
      </CardContent>
    </AppCard>
  );
}

function buildVoterList(voterResults) {
  const voterMap = new Map();
  for (const question of voterResults.questions || []) {
    for (const option of question.options || []) {
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

export default function FullScreenResultsPage() {
  const { pollSlug } = useParams();
  const { t, dir, align, language } = useI18nLayout(translations);
  const [voterResults, setVoterResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!pollSlug) return;
    const init = async () => {
      setLoading(true);
      const pollData = await getPublicPollBySlug(pollSlug);
      if (!pollData || pollData.error) { setLoading(false); return; }
      setPoll(pollData);
      const voterData = await getPollVoterResults(pollData._id);
      setVoterResults(voterData || null);
      setLoading(false);
    };
    init();
  }, [pollSlug]);

  if (loading) {
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!poll) {
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
        <Typography variant="h6" color="error">{t.pollNotFound}</Typography>
      </Box>
    );
  }

  const voterList = voterResults ? buildVoterList(voterResults) : [];
  const totalVoters = voterList.length;
  const displayVoters = voterList.slice((page - 1) * CARDS_PER_PAGE, page * CARDS_PER_PAGE);

  return (
    <>
      <LanguageSelector top={20} right={20} />
      <Box
        dir={dir}
        sx={{
          minHeight: "100vh",
          backgroundColor: "#f9f9f9",
          pt: { xs: 8, md: 10 },
          px: { xs: 1.5, md: 4 },
          pb: 4,
        }}
      >
        {!totalVoters ? (
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
        )}
      </Box>
    </>
  );
}
