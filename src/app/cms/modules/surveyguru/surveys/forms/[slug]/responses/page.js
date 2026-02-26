"use client";

import React, { useState, useEffect, Fragment } from "react";
import {
  Box,
  Typography,
  Grid,
  CardContent,
  CircularProgress,
  Button,
  Pagination,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Divider,  
  Container,
  Stack,
  Chip,
  Avatar,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
} from "@mui/material";

import { useParams, useSearchParams } from "next/navigation";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import NoDataAvailable from "@/components/NoDataAvailable";
import ICONS from "@/utils/iconUtil";
import AppCard from "@/components/cards/AppCard";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { pickFullName } from "@/utils/customFieldUtils";

import { getPublicFormBySlug } from "@/services/surveyguru/surveyFormService";
import {
  listFormResponses,
  exportFormResponsesCsv,
} from "@/services/surveyguru/surveyResponseService";

// ------------ Small UI helpers ------------
function FieldRow({ icon, primary, secondary, dir, align }) {
  return (
    <ListItem dense disableGutters sx={{ px: 0, py: 0.5 }} dir={dir}>
      {icon && (
        <ListItemIcon
          sx={{
            minWidth: 34,
            color: "text.secondary",
          }}
        >
          {icon}
        </ListItemIcon>
      )}
      <ListItemText
        disableTypography
        primary={
          <Typography
            variant="body2"
            color="text.secondary"
            component="div"
            sx={{ textAlign: align }}
          >
            {primary}
          </Typography>
        }
        secondary={
          <Typography
            variant="body1"
            fontWeight={500}
            component="div"
            sx={{ textAlign: align }}
          >
            {secondary || "N/A"}
          </Typography>
        }
      />
    </ListItem>
  );
}

function OptionThumb({ url, label, size = 22, dir }) {
  if (!url) return null;
  return (
    <Avatar
      variant="rounded"
      sx={{
        width: size,
        height: size,
        mr: 0.75,
        border: (t) => `1px solid ${t.palette.divider}`,
        bgcolor: "background.paper",
      }}
      dir={dir}
    >
      <img
        alt={label || "option"}
        src={url}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </Avatar>
  );
}

function renderAnswer({ q, ans, dir, align }) {
  if (!q) return null;

  const findOpt = (id) =>
    (q.options || []).find((opt) => String(opt._id) === String(id));

  const renderMulti = () => {
    const ids = ans?.optionIds || [];
    if (!ids.length)
      return (
        <Typography
          variant="body2"
          component="span"
          dir={dir}
          sx={{ textAlign: align }}
        >
          N/A
        </Typography>
      );

    return (
      <Stack
        direction="row"
        spacing={0.75}
        flexWrap="wrap"
        useFlexGap
        dir={dir}
      >
        {ids.map((id) => {
          const opt = findOpt(id);
          const label = opt?.label || "—";
          const img = opt?.imageUrl;

          return (
            <Chip
              key={id}
              size="small"
              label={label}
              variant="outlined"
              avatar={
                img ? (
                  <OptionThumb url={img} label={label} size={18} />
                ) : undefined
              }
              sx={{
                mr: 0.5,
                mb: 0.5,
                "& .MuiChip-avatar": {
                  width: 18,
                  height: 18,
                  mr: 0.5,
                  borderRadius: 4,
                },
              }}
            />
          );
        })}
      </Stack>
    );
  };

  const renderSingle = () => {
    const id = ans?.optionId || ans?.optionIds?.[0];
    if (!id)
      return (
        <Typography
          variant="body2"
          component="span"
          dir={dir}
          sx={{ textAlign: align }}
        >
          N/A
        </Typography>
      );

    const opt = findOpt(id);
    const label = opt?.label || "—";
    const img = opt?.imageUrl;

    return (
      <Stack direction="row" alignItems="center" spacing={1} dir={dir}>
        {img && <OptionThumb url={img} label={label} size={20} />}
        <Typography variant="body2" component="span" sx={{ textAlign: align }}>
          {label}
        </Typography>
      </Stack>
    );
  };

  const renderText = () => {
    const text = ans?.text?.trim();
    if (!text)
      return (
        <Typography
          variant="body2"
          component="span"
          dir={dir}
          sx={{ textAlign: align }}
        >
          N/A
        </Typography>
      );
    return (
      <Typography
        variant="body2"
        component="span"
        sx={{ whiteSpace: "pre-wrap", textAlign: align }}
        dir={dir}
      >
        {text}
      </Typography>
    );
  };

  const renderRating = () => {
    const n = Number(ans?.number);
    if (!Number.isFinite(n)) {
      return (
        <Typography
          variant="body2"
          component="span"
          dir={dir}
          sx={{ textAlign: align, width: "100%" }}
        >
          N/A
        </Typography>
      );
    }

    const max = Number(q?.scale?.max ?? 5);

    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        dir={dir}
        sx={{
          justifyContent: align === "right" ? "flex-end" : "flex-start",
          width: "100%",
        }}
      >
        <Stack direction="row" spacing={0.25}>
          {Array.from({ length: max }).map((_, i) =>
            i < n ? (
              <ICONS.star key={i} fontSize="small" color="primary" />
            ) : (
              <ICONS.starBorder key={i} fontSize="small" color="primary" />
            )
          )}
        </Stack>
        <Typography
          variant="body2"
          component="span"
          sx={{ textAlign: align, flexGrow: 1 }}
        >
          {n} / {max}
        </Typography>
      </Stack>
    );
  };

  const renderNps = () => {
    const n = Number(ans?.number);
    if (!Number.isFinite(n))
      return (
        <Typography
          variant="body2"
          component="span"
          dir={dir}
          sx={{ textAlign: align }}
        >
          N/A
        </Typography>
      );
    const max = Number(q?.scale?.max ?? 10);
    return (
      <Typography
        variant="body2"
        component="span"
        dir={dir}
        sx={{ textAlign: align }}
      >
        {n} / {max}
      </Typography>
    );
  };

  switch (q.type) {
    case "multi":
      return renderMulti();
    case "single":
      return renderSingle();
    case "text":
      return renderText();
    case "rating":
      return renderRating();
    case "nps":
      return renderNps();
    default:
      if (typeof ans?.number === "number")
        return (
          <Typography
            variant="body2"
            component="span"
            dir={dir}
            sx={{ textAlign: align }}
          >
            {String(ans.number)}
          </Typography>
        );
      if (typeof ans?.bool === "boolean")
        return (
          <Typography
            variant="body2"
            component="span"
            dir={dir}
            sx={{ textAlign: align }}
          >
            {ans.bool ? "Yes" : "No"}
          </Typography>
        );
      return (
        <Typography
          variant="body2"
          component="span"
          dir={dir}
          sx={{ textAlign: align }}
        >
          N/A
        </Typography>
      );
  }
}

function ResponseCard({ resp, t, dir, formDetails, align }) {
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const isAnonymous = formDetails?.isAnonymous;

  const name = resp.attendee?.name;
  const email = resp.attendee?.email;
  const company = resp.attendee?.company;
  const hasSubmittedName = Boolean(name?.trim?.());
  const hasSubmittedEmail = Boolean(email?.trim?.());
  const hasSubmittedCompany = Boolean(company?.trim?.());
  const hasSubmittedAttendeeFields =
    hasSubmittedName || hasSubmittedEmail || hasSubmittedCompany;
  const submittedAt = resp.submittedAt;

  const rec = resp.recipientId;
  const registrationName =
    rec?.fullName?.trim?.() || pickFullName(rec?.customFields) || "";

  const chipStyles = {
    minWidth: dir === "rtl" ? "140px" : "auto",
    px: dir === "rtl" ? 1.5 : 1,
  };

  const statusChip = rec ? (
    <Chip
      size="small"
      icon={rec.status === "responded" ? <ICONS.verified /> : undefined}
      label={(rec.status || t.statusUnknown).toUpperCase()}
      color={rec.status === "responded" ? "success" : "default"}
      variant={rec.status === "responded" ? "filled" : "outlined"}
      sx={chipStyles}
    />
  ) : null;

  const questions = formDetails?.questions || [];
  const ANSWER_PREVIEW_COUNT = 4;
  const hasMoreAnswers = questions.length > ANSWER_PREVIEW_COUNT;
  const visibleQuestions = showAllAnswers
    ? questions
    : questions.slice(0, ANSWER_PREVIEW_COUNT);

  return (
    <AppCard
      sx={{
        width: "100%",
        maxWidth: { xs: "100%", sm: 420 },
        mx: "auto",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2.5,
        boxShadow: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: 4,
        },
      }}
      dir={dir}
    >
      <Box sx={{ p: 1.5, pb: 0.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: dir === "rtl" ? "row-reverse" : "row",
            gap: 1.25,
          }}
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
              {isAnonymous
                ? t.anonymous
                : name || registrationName || t.unknownName}
            </Typography>
          </Box>

          {!isAnonymous && rec && (
            <Tooltip title={t.originalParticipant}>{statusChip}</Tooltip>
          )}
        </Box>
      </Box>

      <CardContent sx={{ pt: 1, px: 1.5, pb: 1.5 }}>
        <Box sx={{ mb: 1 }}>
          {submittedAt ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ICONS.eventOutline fontSize="small" color="text.secondary" />
              <Typography variant="caption" color="text.secondary">
                {t.submittedAt}: {formatDateTimeWithLocale(submittedAt)}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t.noSubmitTime}
            </Typography>
          )}
        </Box>

        {hasSubmittedAttendeeFields && (
          <Fragment>
            <Typography
              variant="overline"
              sx={{ letterSpacing: 0.6, textAlign: align }}
            >
              {t.submittedDetails}
            </Typography>

            <List dense sx={{ py: 0 }}>
              {hasSubmittedName && (
                <FieldRow
                  icon={<ICONS.personOutline fontSize="small" />}
                  primary={t.name}
                  secondary={name}
                  align={align}
                />
              )}
              {hasSubmittedEmail && (
                <FieldRow
                  icon={<ICONS.emailOutline fontSize="small" />}
                  primary={t.email}
                  secondary={email}
                  align={align}
                />
              )}
              {hasSubmittedCompany && (
                <FieldRow
                  icon={<ICONS.apartment fontSize="small" />}
                  primary={t.company}
                  secondary={company}
                  align={align}
                />
              )}
            </List>
          </Fragment>
        )}

        {/* Original Participant Section */}
        {!isAnonymous && rec && !hasSubmittedAttendeeFields && (
          <Fragment>
            <Divider sx={{ my: 1 }} />
            <Typography
              variant="overline"
              sx={{ letterSpacing: 0.6, textAlign: align }}
            >
              {t.originalParticipantDetails}
            </Typography>
            <List dense sx={{ py: 0 }}>
              <FieldRow
                icon={<ICONS.personOutline fontSize="small" />}
                primary={t.fullName}
                secondary={registrationName}
                align={align}
              />
              <FieldRow
                icon={<ICONS.emailOutline fontSize="small" />}
                primary={t.email}
                secondary={rec.email}
                align={align}
              />
              <FieldRow
                icon={<ICONS.apartment fontSize="small" />}
                primary={t.company}
                secondary={rec.company}
                align={align}
              />
            </List>
          </Fragment>
        )}

        <Divider sx={{ my: 1 }} />

        {/* Answers */}
        <Typography
          variant="overline"
          sx={{ letterSpacing: 0.6, textAlign: align }}
        >
          {t.answersTitle}
        </Typography>

        <List dense sx={{ py: 0 }}>
          {visibleQuestions.map((q) => {
            const ans = (resp.answers || []).find(
              (a) => String(a.questionId) === String(q._id)
            );
            return (
              <ListItem key={q._id} dense disableGutters sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon
                  sx={{
                    minWidth: 34,
                    color: "text.secondary",
                    ...(dir === "rtl" ? { ml: 1 } : { mr: 1 }),
                  }}
                >
                  <ICONS.assignmentOutline fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  disableTypography
                  primary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: align }}
                    >
                      {q.label}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 0.25, textAlign: align }}>
                      {renderAnswer({ q, ans, dir, align })}
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
        {hasMoreAnswers && (
          <Button
            size="small"
            variant="text"
            onClick={() => setShowAllAnswers((v) => !v)}
            startIcon={showAllAnswers ? <ICONS.expandLess /> : <ICONS.expandMore />}
            sx={{
              mt: 0.25,
              px: 0,
              minWidth: 0,
              fontWeight: 700,
              alignSelf: align === "right" ? "flex-end" : "flex-start",
              ...getStartIconSpacing(dir),
            }}
          >
            {showAllAnswers
              ? (t.showLessAnswers || "Show fewer answers")
              : `${t.showMoreAnswers || "Show more answers"} (${questions.length - ANSWER_PREVIEW_COUNT})`}
          </Button>
        )}
      </CardContent>
    </AppCard>
  );
}

/* ------------ Page ------------ */
function responseMatchesSearch(resp, term) {
  const t = term.toLowerCase();
  const attendee = resp.attendee || {};
  const rec = resp.recipientId;
  const registrationName =
    rec?.fullName?.trim?.() || pickFullName(rec?.customFields) || "";
  const haystack = [
    attendee.name,
    attendee.email,
    attendee.company,
    registrationName,
    rec?.email,
    rec?.company,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(t);
}

export default function ViewSurveyResponses() {
  const { slug } = useParams();
  const searchParams = useSearchParams();

  const { dir, t, align } = useI18nLayout({
    en: {
      title: "Survey Responses",
      description: "View all responses for this survey form.",
      export: "Export to CSV",
      exporting: "Exporting...",
      records: "records",
      noRecords: "No responses found for this survey.",
      name: "Name",
      email: "Email",
      company: "Organization",
      submittedAt: "Submitted At",
      recordsPerPage: "Records per page",
      showing: "Showing",
      to: "to",
      of: "of",
      unknownName: "Unnamed respondent",
      noSubmitTime: "Submission time not available",
      submittedDetails: "Submitted Details",
      originalParticipant: "Original participant",
      originalParticipantDetails: "Original Participant Details",
      fullName: "Full Name",
      status: "Status",
      token: "Token",
      createdAt: "Created At",
      respondedAt: "Responded At",
      statusUnknown: "Unknown",
      answersTitle: "Answers",
      showMoreAnswers: "Show more answers",
      showLessAnswers: "Show fewer answers",
      anonymousSurvey: "Anonymous Survey",
      anonymous: "Anonymous",
      anonymousMessage: "This is an anonymous response.",
      searchPlaceholder: "Filter by name, email, or organization",
      clearFilter: "Clear filter",
    },
    ar: {
      title: "ردود الاستبيان",
      description: "عرض جميع الردود لهذا الاستبيان.",
      export: "تصدير إلى CSV",
      exporting: "جاري التصدير...",
      records: "سجلات",
      noRecords: "لا توجد ردود لهذا الاستبيان.",
      name: "الاسم",
      email: "البريد الإلكتروني",
      company: "المؤسسة",
      submittedAt: "تاريخ الإرسال",
      recordsPerPage: "عدد السجلات لكل صفحة",
      showing: "عرض",
      to: "إلى",
      of: "من",
      unknownName: "مشارك بدون اسم",
      noSubmitTime: "وقت الإرسال غير متاح",
      submittedDetails: "تفاصيل الإرسال",
      originalParticipant: "المشارك الأصلي",
      originalParticipantDetails: "تفاصيل المشارك الأصلي",
      fullName: "الاسم الكامل",
      status: "الحالة",
      token: "الرمز",
      createdAt: "تاريخ الإنشاء",
      respondedAt: "تاريخ الرد",
      statusUnknown: "غير معروف",
      answersTitle: "الإجابات",
      anonymousSurvey: "استبيان مجهول الهوية",
      anonymous: "مجهول",
      anonymousMessage: "هذا رد مجهول الهوية.",
      searchPlaceholder: "تصفية حسب الاسم أو البريد أو المؤسسة",
      clearFilter: "إزالة التصفية",
    },
  });

  const [formDetails, setFormDetails] = useState(null);
  const [responses, setResponses] = useState([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInitialized, setSearchInitialized] = useState(false);

  useEffect(() => {
    if (!searchInitialized) {
      const param = searchParams.get("search");
      if (param) setSearchTerm(param.trim().toLowerCase());
      setSearchInitialized(true);
    }
  }, [searchInitialized, searchParams]);

  const filteredResponses = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return responses;
    return responses.filter((r) => responseMatchesSearch(r, term));
  }, [responses, searchTerm]);

  const displayTotal = searchTerm ? filteredResponses.length : totalResponses;
  const displayResponses = searchTerm ? filteredResponses : responses;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const formRes = await getPublicFormBySlug(slug);
      if (formRes?.error) {
        setLoading(false);
        return;
      }
      setFormDetails(formRes);

      const respRes = await listFormResponses(formRes._id);
      if (!respRes?.error) {
        setResponses(respRes || []);
        setTotalResponses((respRes || []).length);
      }
      setLoading(false);
    };

    if (slug) fetchData();
  }, [slug]);

  const handlePageChange = (_, value) => setPage(value);
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };
  const handleClearSearch = () => {
    setSearchTerm("");
    setPage(1);
  };
  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const exportToCSV = async () => {
    if (!formDetails) return;
    setExportLoading(true);
    await exportFormResponsesCsv(formDetails._id);
    setExportLoading(false);
  };

  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ my: 3 }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            {t.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t.description}
          </Typography>
          {formDetails?.isAnonymous && (
            <Chip
              label={t.anonymousSurvey}
              color="warning"
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {displayTotal > 0 && (
          <Button
            variant="contained"
            onClick={exportToCSV}
            disabled={exportLoading}
            startIcon={
              exportLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ICONS.download />
              )
            }
            sx={getStartIconSpacing(dir)}
          >
            {exportLoading ? t.exporting : t.export}
          </Button>
        )}
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* Search */}
      <Stack direction="row" spacing={1} mb={2} alignItems="center">
        <TextField
          size="small"
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ minWidth: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <ICONS.search fontSize="small" sx={{ opacity: 0.7 }} />
              </InputAdornment>
            ),
          }}
        />
        {searchTerm && (
          <Button size="small" onClick={handleClearSearch}>
            {t.clearFilter}
          </Button>
        )}
      </Stack>

      {/* Top bar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1.25}
        mb={2.5}
        px={0.5}
      >
        <Typography variant="body2" color="text.secondary">
          {t.showing} {(page - 1) * limit + 1}-
          {Math.min(page * limit, displayTotal)} {t.of} {displayTotal}{" "}
          {t.records}
        </Typography>
        <FormControl
          size="small"
          sx={{
            minWidth: { xs: "100%", sm: 170 },
            ml: { xs: 0, sm: 2 },
          }}
        >
          <InputLabel>{t.recordsPerPage}</InputLabel>
          <Select
            value={limit}
            onChange={handleLimitChange}
            label={t.recordsPerPage}
            sx={{ pr: dir === "rtl" ? 1 : undefined }}
          >
            {[6, 12, 18, 24, 48].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Cards */}
      {!displayResponses.length ? (
        <NoDataAvailable />
      ) : (
        <Fragment>
          <Grid container spacing={2} alignItems="stretch" justifyContent="center">
            {displayResponses.slice((page - 1) * limit, page * limit).map((resp) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={6}
                lg={4}
                key={resp._id}
              >
                <ResponseCard
                  resp={resp}
                  t={t}
                  dir={dir}
                  formDetails={formDetails}
                  align={align}
                />
              </Grid>
            ))}
          </Grid>

          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              dir="ltr"
              count={Math.ceil(displayTotal / limit)}
              page={Math.min(page, Math.ceil(displayTotal / limit) || 1)}
              onChange={handlePageChange}
            />
          </Box>
        </Fragment>
      )}
    </Container>
  );
}
