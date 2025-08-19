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
        <Typography variant="body2" component="span" dir={dir} sx={{ textAlign: align }}>
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
        <Typography variant="body2" component="span" dir={dir} sx={{ textAlign: align }}>
          N/A
        </Typography>
      );

    const opt = findOpt(id);
    const label = opt?.label || "—";
    const img = opt?.imageUrl;

    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        {img && <OptionThumb url={img} label={label} size={20} />}
        <Typography variant="body2" component="span" dir={dir} sx={{ textAlign: align }}>
          {label}
        </Typography>
      </Stack>
    );
  };

  const renderText = () => {
    const text = ans?.text?.trim();
    if (!text)
      return (
        <Typography variant="body2" component="span" dir={dir} sx={{ textAlign: align }}>
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
        <Typography variant="body2" component="span" dir={dir} sx={{ textAlign: align, width: '100%' }}>
          N/A
        </Typography>
      );
    }

    const max = Number(q?.scale?.max ?? 5);

    return (
      <Stack direction="row" alignItems="center" spacing={1} dir={dir} sx={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start', width: '100%' }}>
        <Stack direction="row" spacing={0.25}>
          {Array.from({ length: max }).map((_, i) =>
            i < n ? (
              <ICONS.star key={i} fontSize="small" color="primary" />
            ) : (
              <ICONS.starBorder key={i} fontSize="small" color="primary" />
            )
          )}
        </Stack>
        <Typography variant="body2" component="span" dir={dir} sx={{ textAlign: align, flexGrow: 1 }}>
          {n} / {max}
        </Typography>
      </Stack>
    );
  };

  const renderNps = () => {
    const n = Number(ans?.number);
    if (!Number.isFinite(n))
      return (
        <Typography variant="body2" component="span" dir={dir} sx={{ textAlign: align }}>
          N/A
        </Typography>
      );
    const max = Number(q?.scale?.max ?? 10);
    return (
      <Typography variant="body2" component="span" dir={dir} sx={{ textAlign: align }}>
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
          <Typography variant="body2" component="span" dir={dir} sx={{ textAlign: align }}>
            {String(ans.number)}
          </Typography>
        );
      if (typeof ans?.bool === "boolean")
        return (
          <Typography variant="body2" component="span" dir={dir} sx={{ textAlign: align }}>
            {ans.bool ? "Yes" : "No"}
          </Typography>
        );
      return (
        <Typography variant="body2" component="span" dir={dir} sx={{ textAlign: align }}>
          N/A
        </Typography>
      );
  }
}

function ResponseCard({ resp, t, dir, formDetails, align }) {
  const name = resp.attendee?.name;
  const email = resp.attendee?.email;
  const company = resp.attendee?.company;
  const submittedAt = resp.submittedAt;

  const rec = resp.recipientId;

  const statusChip = rec ? (
    <Chip
      size="small"
      icon={rec.status === "responded" ? <ICONS.verified /> : undefined}
      label={(rec.status || t.statusUnknown || "UNKNOWN").toUpperCase()}
      color={rec.status === "responded" ? "success" : "default"}
      variant={rec.status === "responded" ? "filled" : "outlined"}
      sx={
        rec.status === "responded" && dir === "rtl"
          ? { minWidth: 110, px: 2 }
          : undefined
      }
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
          <Avatar
            sx={{
              bgcolor: "primary.main",
              ...(dir === "rtl"
                ? { ml: 0.5, mr: 0 }
                : { mr: 0.5, ml: 0 }),
            }}
          >
            <ICONS.personOutline />
          </Avatar>
        }
        titleTypographyProps={{ fontWeight: 700 }}
        title={
          <Typography dir={dir} variant="body1" fontWeight={700} sx={{ textAlign: align }}>
            {name || t.unknownName || "Unnamed respondent"}
          </Typography>
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
          "& .MuiCardHeader-action": {
            alignSelf: "center",
            ...(dir === "rtl" ? { ml: 1, mr: 0 } : { mr: 1, ml: 0 }),
          },
        }}
      />

      <CardContent sx={{ pt: 1.5 }}>
        <Box sx={{ mb: 2 }}>
          {submittedAt ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: dir === "rtl" ? 1 : 1 }}>
              <ICONS.eventOutline fontSize="small" color="text.secondary" />
              <Typography
                variant="caption"
                color="text.secondary"
                dir={dir}
              >
                {t.submittedAt}: {formatDateTimeWithLocale(submittedAt)}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" dir={dir}>
              {t.noSubmitTime || "Submission time not available"}
            </Typography>
          )}
        </Box>

        <Typography variant="overline" sx={{ letterSpacing: 0.6, textAlign: align }} dir={dir}>
          {t.submittedDetails || "Submitted Details"}
        </Typography>
        <List dense sx={{ py: 0 }}>
          <FieldRow
            icon={<ICONS.personOutline fontSize="small" />}
            primary={t.name || "Name"}
            secondary={name}
            dir={dir}
            align={align}
          />
          <FieldRow
            icon={<ICONS.emailOutline fontSize="small" />}
            primary={t.email || "Email"}
            secondary={email}
            dir={dir}
            align={align}
          />
          <FieldRow
            icon={<ICONS.apartment fontSize="small" />}
            primary={t.company || "Company"}
            secondary={company}
            dir={dir}
            align={align}
          />
        </List>

        {rec && (
          <Fragment>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="overline" sx={{ letterSpacing: 0.6, textAlign: align }} dir={dir}>
              {t.originalParticipantDetails || "Original Participant Details"}
            </Typography>
            <List dense sx={{ py: 0 }}>
              <FieldRow
                icon={<ICONS.personOutline fontSize="small" />}
                primary={t.fullName || "Full Name"}
                secondary={rec.fullName}
                dir={dir}
                align={align}
              />
              <FieldRow
                icon={<ICONS.emailOutline fontSize="small" />}
                primary={t.email || "Email"}
                secondary={rec.email}
                dir={dir}
                align={align}
              />
              <FieldRow
                icon={<ICONS.apartment fontSize="small" />}
                primary={t.company || "Company"}
                secondary={rec.company}
                dir={dir}
                align={align}
              />
              <FieldRow
                icon={<ICONS.verified fontSize="small" />}
                primary={t.status || "Status"}
                secondary={rec.status}
                dir={dir}
                align={align}
              />
              <FieldRow
                icon={<ICONS.vpnKey fontSize="small" />}
                primary={t.token || "Token"}
                secondary={rec.token}
                dir={dir}
                align={align}
              />
              <FieldRow
                icon={<ICONS.timeOutline fontSize="small" />}
                primary={t.createdAt || "Created At"}
                secondary={rec.createdAt ? formatDateTimeWithLocale(rec.createdAt) : "N/A"}
                dir={dir}
                align={align}
              />
              <FieldRow
                icon={<ICONS.timeOutline fontSize="small" />}
                primary={t.respondedAt || "Responded At"}
                secondary={rec.respondedAt ? formatDateTimeWithLocale(rec.respondedAt) : "N/A"}
                dir={dir}
                align={align}
              />
            </List>
          </Fragment>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Answers */}
        <Typography variant="overline" sx={{ letterSpacing: 0.6, textAlign: align }} dir={dir}>
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
                <ListItemIcon sx={{ minWidth: 34, color: "text.secondary", ...(dir === "rtl" ? { ml: 1, mr: 0 } : { mr: 1, ml: 0 }) }}>
                  <ICONS.assignmentOutline fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  disableTypography
                  primary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      component="div"
                      dir={dir}
                      sx={{ textAlign: align }}
                    >
                      {q.label || "Question"}
                    </Typography>
                  }
                  secondary={
                    <Box component="div" sx={{ mt: 0.25, textAlign: align, width: '100%' }}>
                      {renderAnswer({ q, ans, dir, align })}
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


  const [formDetails, setFormDetails] = useState(null);
  const [responses, setResponses] = useState([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);



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
                  align={align}
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