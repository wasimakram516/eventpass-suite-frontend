"use client";

import React, { useState, useEffect, Fragment } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
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
} from "@mui/material";

import { useParams } from "next/navigation";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import NoDataAvailable from "@/components/NoDataAvailable";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

import { getPublicFormBySlug } from "@/services/surveyguru/surveyFormService";
import {
  listFormResponses,
  exportFormResponsesCsv,
} from "@/services/surveyguru/surveyResponseService";

const {
  personOutline: PersonOutlineIcon,
  emailOutline: EmailOutlinedIcon,
  apartment: ApartmentOutlinedIcon,
  eventOutline: EventOutlinedIcon,
  timeOutline: QueryBuilderOutlinedIcon,
  vpnKey: VpnKeyOutlinedIcon,
  verified: VerifiedOutlinedIcon,
  assignmentOutline: AssignmentOutlinedIcon,
} = ICONS;

/* ------------ Small UI helpers ------------ */
function FieldRow({ icon, primary, secondary }) {
  return (
    <ListItem dense disableGutters sx={{ px: 0, py: 0.5 }}>
      {icon && (
        <ListItemIcon sx={{ minWidth: 34, color: "text.secondary" }}>
          {icon}
        </ListItemIcon>
      )}
      <ListItemText
        disableTypography
        primary={
          <Typography variant="body2" color="text.secondary" component="div">
            {primary}
          </Typography>
        }
        secondary={
          <Typography variant="body1" fontWeight={500} component="div">
            {secondary || "N/A"}
          </Typography>
        }
      />
    </ListItem>
  );
}

function OptionThumb({ url, label, size = 22 }) {
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
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={label || "option"}
        src={url}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </Avatar>
  );
}

function renderAnswer({ q, ans }) {
  if (!q) return null;

  const findOpt = (id) =>
    (q.options || []).find((opt) => String(opt._id) === String(id));

  const renderMulti = () => {
    const ids = ans?.optionIds || [];
    if (!ids.length)
      return (
        <Typography variant="body2" component="span">
          N/A
        </Typography>
      );

    return (
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
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
        <Typography variant="body2" component="span">
          N/A
        </Typography>
      );

    const opt = findOpt(id);
    const label = opt?.label || "—";
    const img = opt?.imageUrl;

    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        {img && <OptionThumb url={img} label={label} size={20} />}
        <Typography variant="body2" component="span">
          {label}
        </Typography>
      </Stack>
    );
  };

  const renderText = () => {
    const text = ans?.text?.trim();
    if (!text)
      return (
        <Typography variant="body2" component="span">
          N/A
        </Typography>
      );
    return (
      <Typography
        variant="body2"
        component="span"
        sx={{ whiteSpace: "pre-wrap" }}
      >
        {text}
      </Typography>
    );
  };

  const renderRating = () => {
    const n = Number(ans?.number);
    if (!Number.isFinite(n)) {
      return (
        <Typography variant="body2" component="span">
          N/A
        </Typography>
      );
    }

    const max = Number(q?.scale?.max ?? 5);

    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Stack direction="row" spacing={0.25}>
          {Array.from({ length: max }).map((_, i) =>
            i < n ? (
              <ICONS.star key={i} fontSize="small" color="primary" />
            ) : (
              <ICONS.starBorder key={i} fontSize="small" color="primary" />
            )
          )}
        </Stack>
        <Typography variant="body2" component="span">
          {n} / {max}
        </Typography>
      </Stack>
    );
  };

  const renderNps = () => {
    const n = Number(ans?.number);
    if (!Number.isFinite(n))
      return (
        <Typography variant="body2" component="span">
          N/A
        </Typography>
      );
    const max = Number(q?.scale?.max ?? 10);
    return (
      <Typography variant="body2" component="span">
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
          <Typography variant="body2" component="span">
            {String(ans.number)}
          </Typography>
        );
      if (typeof ans?.bool === "boolean")
        return (
          <Typography variant="body2" component="span">
            {ans.bool ? "Yes" : "No"}
          </Typography>
        );
      return (
        <Typography variant="body2" component="span">
          N/A
        </Typography>
      );
  }
}

/* ------------ Response Card ------------ */
function ResponseCard({ resp, t, dir, formDetails }) {
  const name = resp.attendee?.name;
  const email = resp.attendee?.email;
  const company = resp.attendee?.company;
  const submittedAt = resp.submittedAt;

  const rec = resp.recipientId;

  const statusChip = rec ? (
    <Chip
      size="small"
      icon={rec.status === "responded" ? <VerifiedOutlinedIcon /> : undefined}
      label={(rec.status || t.statusUnknown || "UNKNOWN").toUpperCase()}
      color={rec.status === "responded" ? "success" : "default"}
      variant={rec.status === "responded" ? "filled" : "outlined"}
    />
  ) : null;

  const questions = formDetails?.questions || [];

  return (
    <Card
      sx={{
        width: "100%",
        minWidth: { sm: 280 },
        maxWidth: { sm: 380 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        boxShadow: 3,
        overflow: "hidden",
        bgcolor: "background.paper",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 6,
        },
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <PersonOutlineIcon />
          </Avatar>
        }
        titleTypographyProps={{ fontWeight: 700 }}
        subheaderTypographyProps={{ color: "text.secondary" }}
        title={name || t.unknownName || "Unnamed respondent"}
        subheader={
          submittedAt ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <EventOutlinedIcon fontSize="small" />
              <Typography variant="caption">
                {t.submittedAt}: {formatDateTimeWithLocale(submittedAt)}
              </Typography>
            </Stack>
          ) : (
            <Typography variant="caption" color="text.secondary">
              {t.noSubmitTime || "Submission time not available"}
            </Typography>
          )
        }
        action={
          rec ? (
            <Tooltip title={t.originalParticipant || "Original participant"}>
              {statusChip}
            </Tooltip>
          ) : null
        }
        sx={{
          pb: 0.5,
          "& .MuiCardHeader-action": { alignSelf: "center", mr: 1 },
        }}
      />

      <CardContent sx={{ pt: 1.5 }}>
        {/* Submitted details */}
        <Typography variant="overline" sx={{ letterSpacing: 0.6 }}>
          {t.submittedDetails || "Submitted Details"}
        </Typography>
        <List dense sx={{ py: 0 }}>
          <FieldRow
            icon={<PersonOutlineIcon fontSize="small" />}
            primary={t.name || "Name"}
            secondary={name}
          />
          <FieldRow
            icon={<EmailOutlinedIcon fontSize="small" />}
            primary={t.email || "Email"}
            secondary={email}
          />
          <FieldRow
            icon={<ApartmentOutlinedIcon fontSize="small" />}
            primary={t.company || "Company"}
            secondary={company}
          />
        </List>

        {/* Original recipient (if any) */}
        {rec && (
          <Fragment>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="overline" sx={{ letterSpacing: 0.6 }}>
              {t.originalParticipantDetails || "Original Participant Details"}
            </Typography>
            <List dense sx={{ py: 0 }}>
              <FieldRow
                icon={<PersonOutlineIcon fontSize="small" />}
                primary={t.fullName || "Full Name"}
                secondary={rec.fullName}
              />
              <FieldRow
                icon={<EmailOutlinedIcon fontSize="small" />}
                primary={t.email || "Email"}
                secondary={rec.email}
              />
              <FieldRow
                icon={<ApartmentOutlinedIcon fontSize="small" />}
                primary={t.company || "Company"}
                secondary={rec.company}
              />
              <FieldRow
                icon={<VerifiedOutlinedIcon fontSize="small" />}
                primary={t.status || "Status"}
                secondary={rec.status}
              />
              <FieldRow
                icon={<VpnKeyOutlinedIcon fontSize="small" />}
                primary={t.token || "Token"}
                secondary={rec.token}
              />
              <FieldRow
                icon={<QueryBuilderOutlinedIcon fontSize="small" />}
                primary={t.createdAt || "Created At"}
                secondary={
                  rec.createdAt
                    ? formatDateTimeWithLocale(rec.createdAt)
                    : "N/A"
                }
              />
              <FieldRow
                icon={<QueryBuilderOutlinedIcon fontSize="small" />}
                primary={t.respondedAt || "Responded At"}
                secondary={
                  rec.respondedAt
                    ? formatDateTimeWithLocale(rec.respondedAt)
                    : "N/A"
                }
              />
            </List>
          </Fragment>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Answers */}
        <Typography variant="overline" sx={{ letterSpacing: 0.6 }}>
          {t.answersTitle || "Answers"}
        </Typography>

        <List dense sx={{ py: 0 }}>
          {questions.map((q) => {
            const ans = (resp.answers || []).find(
              (a) => String(a.questionId) === String(q._id)
            );
            return (
              <ListItem
                key={q._id}
                dense
                disableGutters
                sx={{ px: 0, py: 0.75 }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: "text.secondary" }}>
                  <AssignmentOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  disableTypography
                  primary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      component="div"
                    >
                      {q.label || "Question"}
                    </Typography>
                  }
                  secondary={
                    <Box component="div" sx={{ mt: 0.25 }}>
                      {renderAnswer({ q, ans })}
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
}

/* ------------ Page ------------ */
export default function ViewSurveyResponses() {
  const { slug } = useParams();

  const [formDetails, setFormDetails] = useState(null);
  const [responses, setResponses] = useState([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const { dir, t } = useI18nLayout({
    en: {
      title: "Survey Responses",
      description: "View all responses for this survey form.",
      export: "Export to CSV",
      exporting: "Exporting...",
      records: "records",
      noRecords: "No responses found for this survey.",
      name: "Name",
      email: "Email",
      company: "Company",
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
      company: "الشركة",
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
    },
  });

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
        </Box>

        {totalResponses > 0 && (
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

      {/* Top bar */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        px={1}
      >
        <Typography variant="body2" color="text.secondary">
          {t.showing} {(page - 1) * limit + 1}-
          {Math.min(page * limit, totalResponses)} {t.of} {totalResponses}{" "}
          {t.records}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 170, ml: 2 }}>
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
      </Box>

      {/* Cards */}
      {!responses.length ? (
        <NoDataAvailable />
      ) : (
        <Fragment>
          <Grid container spacing={3} justifyContent="center">
            {responses.slice((page - 1) * limit, page * limit).map((resp) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={resp._id}
                sx={{
                  display: { xs: "flex", sm: "block" },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                <ResponseCard
                  resp={resp}
                  t={t}
                  dir={dir}
                  formDetails={formDetails}
                />
              </Grid>
            ))}
          </Grid>

          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              dir="ltr"
              count={Math.ceil(totalResponses / limit)}
              page={page}
              onChange={handlePageChange}
            />
          </Box>
        </Fragment>
      )}
    </Container>
  );
}
