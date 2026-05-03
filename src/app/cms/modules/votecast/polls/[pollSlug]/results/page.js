"use client";

import * as XLSX from "xlsx";
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
  Grid,
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
    exportAll: "Export Raw Data",
    exporting: "Exporting...",
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
    pollName: "Poll Name",
    exportedAt: "Exported At",
    timezone: "Timezone",
    number: "#",
    company: "Company",
  },
  ar: {
    title: "عارض نتائج الاستطلاع",
    subtitle: "عرض النتائج والتحليلات لهذا الاستطلاع.",
    exportAll: "تصدير البيانات الخام",
    exporting: "جاري التصدير...",
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
    pollName: "اسم الاستطلاع",
    exportedAt: "تاريخ التصدير",
    timezone: "المنطقة الزمنية",
    number: "#",
    company: "الشركة",
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

  // Regex patterns for fields promoted to the header
  const EMAIL_RE   = /^e-?mail$/i;
  const PHONE_RE   = /^(phone|mobile|tel(ephone)?|cell)$/i;
  const COMPANY_RE = /^(company|org(anization|anisation)?)$/i;
  const NAME_RE    = /^(name|full.?name)$/i;

  const cfEntries = Object.entries(voter.customFields || {});
  const cfFind = (re) => cfEntries.find(([k]) => re.test(k.trim()))?.[1] || null;

  // Resolve from classic field first, then customFields
  const displayName    = voter.fullName || cfFind(NAME_RE) || null;
  const displayEmail   = voter.email    || cfFind(EMAIL_RE);
  const rawPhone       = voter.phone    || cfFind(PHONE_RE);
  const displayPhone   = rawPhone
    ? (voter.phoneCode ? `${voter.phoneCode}${rawPhone}` : rawPhone)
    : null;
  const displayCompany = voter.company  || cfFind(COMPANY_RE);

  // Body: only remaining custom fields not already shown in header
  const customEntries = cfEntries.filter(
    ([key, val]) =>
      val !== null && val !== "" && val !== undefined &&
      !EMAIL_RE.test(key.trim()) &&
      !PHONE_RE.test(key.trim()) &&
      !COMPANY_RE.test(key.trim()) &&
      !NAME_RE.test(key.trim())
  );

  const detailFields = customEntries.map(([key, val]) => ({
    key,
    icon: getFieldIcon(key),
    primary: key,
    secondary: String(val),
  }));
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
          sx={{
            display: "flex",
            alignItems: "flex-start",
            flexDirection: dir === "rtl" ? "row-reverse" : "row",
            gap: 1.25,
          }}
        >
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, mt: 0.5 }}>
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
              {isAnonymous ? t.anonymous : (displayName || t.unknownName)}
            </Typography>
            {!isAnonymous && (displayEmail || displayPhone || displayCompany) && (
              <Stack direction="column" spacing={0.25} sx={{ mt: 0.5 }}>
                {displayEmail && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <ICONS.emailOutline sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary">{displayEmail}</Typography>
                  </Box>
                )}
                {displayPhone && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <ICONS.phone sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary" dir="ltr" style={{ unicodeBidi: "embed" }}>
                      {displayPhone}
                    </Typography>
                  </Box>
                )}
                {displayCompany && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <ICONS.apartment sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary">{displayCompany}</Typography>
                  </Box>
                )}
              </Stack>
            )}
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
            company: voter.company || null,
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
  const [exportLoading, setExportLoading] = useState(false);

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


  const handleExportVoters = () => {
    if (!poll || voterList.length === 0) return;
    setExportLoading(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const getTimezoneLabel = (tz) => {
        try {
          const now = new Date();
          const longName = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "long" })
            .formatToParts(now).find((p) => p.type === "timeZoneName")?.value || tz;
          const shortOffset = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" })
            .formatToParts(now).find((p) => p.type === "timeZoneName")?.value || "";
          return shortOffset ? `${longName} (${shortOffset})` : longName;
        } catch { return tz || "UTC"; }
      };
      const formatDateTimeForExcel = (dateString) => {
        if (!dateString) return "";
        try {
          return new Intl.DateTimeFormat("en-US", {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
            timeZone: timezone,
          }).format(new Date(dateString));
        } catch { return String(dateString); }
      };
      const toNumericIfPossible = (val) => {
        if (language !== "ar") return val;
        if (typeof val === "number") return val;
        if (typeof val === "string") {
          const trimmed = val.trim();
          if (trimmed !== "" && Number.isFinite(Number(trimmed))) return Number(trimmed);
        }
        return val;
      };

      const wb = XLSX.utils.book_new();
      const wsData = [];

      // Regex patterns for header field detection (same as VoterCard)
      const EMAIL_RE   = /^e-?mail$/i;
      const PHONE_RE   = /^(phone|mobile|tel(ephone)?|cell)$/i;
      const COMPANY_RE = /^(company|org(anization|anisation)?)$/i;
      const NAME_RE    = /^(name|full.?name)$/i;

      // Collect unique custom field keys, excluding fields already in dedicated columns
      const cfKeySet = new Set();
      voterList.forEach((v) => Object.keys(v.customFields || {}).forEach((k) => {
        const trimmed = k.trim();
        if (!EMAIL_RE.test(trimmed) && !PHONE_RE.test(trimmed) && !COMPANY_RE.test(trimmed) && !NAME_RE.test(trimmed)) {
          cfKeySet.add(k);
        }
      }));
      const customFieldKeys = Array.from(cfKeySet);

      // Collect unique questions in appearance order
      const questionMap = new Map();
      voterList.forEach((v) => {
        (v.votes || []).forEach((vote) => {
          if (!questionMap.has(String(vote.questionId))) questionMap.set(String(vote.questionId), vote.question);
        });
      });
      const questionEntries = Array.from(questionMap.entries());

      // Total columns: # + name + email + phone + company + customFields + questions + votedAt
      const totalCols = 6 + customFieldKeys.length + questionEntries.length;

      // In Arabic, pad metadata rows so labels align with the rightmost column (#)
      const pushRow = (...cols) => {
        const normalized = cols.map((col) => (col === undefined || col === null ? "" : col));
        if (language === "ar") {
          if (normalized.length === 1) {
            wsData.push([...new Array(Math.max(0, totalCols - 1)).fill(""), normalized[0]]);
            return;
          }
          if (normalized.length === 2) {
            wsData.push([...new Array(Math.max(0, totalCols - 2)).fill(""), normalized[1], normalized[0]]);
            return;
          }
          if (normalized.length === 3) {
            wsData.push([...new Array(Math.max(0, totalCols - 3)).fill(""), normalized[2], normalized[1], normalized[0]]);
            return;
          }
        }
        wsData.push(normalized);
      };

      // Metadata
      pushRow(t.pollName, poll.title || poll.name || "");
      pushRow(t.exportedAt, formatDateTimeForExcel(new Date().toISOString()));
      pushRow(t.timezone, getTimezoneLabel(timezone));
      wsData.push([]);

      // In Arabic RTL view the last array position is visually rightmost (first read),
      // so reverse each row so that # (serial) ends up rightmost.
      const pushTableRow = (row) => {
        wsData.push(language === "ar" ? [...row].reverse() : row);
      };

      // Header row
      pushTableRow([
        t.number,
        t.name,
        t.email,
        t.phone,
        t.company,
        ...customFieldKeys,
        ...questionEntries.map(([, q]) => q),
        t.votedAt,
      ]);

      // Data rows
      voterList.forEach((voter, idx) => {
        const cf = voter.customFields || {};
        const cfEntries = Object.entries(cf);
        const cfFind = (re) => cfEntries.find(([k]) => re.test(k.trim()))?.[1] || null;

        const displayName    = voter.fullName    || cfFind(NAME_RE)    || "";
        const displayEmail   = voter.email       || cfFind(EMAIL_RE)   || "";
        const rawPhone       = voter.phone       || cfFind(PHONE_RE);
        const displayPhone   = rawPhone ? (voter.phoneCode ? `${voter.phoneCode}${rawPhone}` : rawPhone) : "";
        const displayCompany = voter.company     || cfFind(COMPANY_RE) || "";

        const customFieldValues = customFieldKeys.map((key) => {
          const val = cf[key];
          return val !== undefined && val !== null ? toNumericIfPossible(String(val)) : "";
        });
        const voteMap = new Map((voter.votes || []).map((v) => [String(v.questionId), v.optionText || ""]));
        const voteValues = questionEntries.map(([id]) => voteMap.get(id) || "");

        pushTableRow([
          toNumericIfPossible(String(idx + 1)),
          voter.isAnonymous ? t.anonymous : displayName,
          voter.isAnonymous ? "" : displayEmail,
          voter.isAnonymous ? "" : displayPhone,
          voter.isAnonymous ? "" : displayCompany,
          ...customFieldValues,
          ...voteValues,
          voter.votedAt ? formatDateTimeForExcel(voter.votedAt) : "",
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      if (language === "ar") ws["!views"] = [{ rightToLeft: true }];

      XLSX.utils.book_append_sheet(wb, ws, "Poll Voters");
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${poll.slug || "poll"}_voters_raw_data.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Poll voters export failed:", error);
      showMessage(t.exporting, "error");
    }
    setExportLoading(false);
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
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ gap: dir === "rtl" ? 2 : 0 }}>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={handleExportVoters}
                  disabled={exportLoading}
                  startIcon={
                    exportLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <ICONS.description fontSize="small" />
                    )
                  }
                  sx={getStartIconSpacing(dir)}
                >
                  {exportLoading ? t.exporting : t.exportAll}
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

                <Grid container spacing={2} alignItems="stretch" justifyContent="center">
                  {displayVoters.map((voter) => (
                    <Grid item xs={12} sm={6} md={6} lg={4} key={String(voter._id)}>
                      <VoterCard
                        voter={voter}
                        t={t}
                        dir={dir}
                        align={align}
                        language={language}
                        isAnonymous={voter.isAnonymous}
                      />
                    </Grid>
                  ))}
                </Grid>

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

    </>
  );
}
