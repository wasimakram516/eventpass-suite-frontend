"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
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

export default function ViewSurveyResponses() {
  const { slug } = useParams();

  const [formDetails, setFormDetails] = useState(null);
  const [responses, setResponses] = useState([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
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
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Get form details first
      const formRes = await getPublicFormBySlug(slug);
      if (formRes?.error) {
        setLoading(false);
        return;
      }
      setFormDetails(formRes);

      // Fetch all responses for this form
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

  if (loading) {
    return (
      <Box
        minHeight="60vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

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

      <Divider sx={{ my: 3 }} />

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        px={2}
      >
        <Typography>
          {t.showing} {(page - 1) * limit + 1}-
          {Math.min(page * limit, totalResponses)} {t.of} {totalResponses}{" "}
          {t.records}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150, ml: 2 }}>
          <InputLabel>{t.recordsPerPage}</InputLabel>
          <Select
            value={limit}
            onChange={handleLimitChange}
            label={t.recordsPerPage}
            sx={{ pr: dir === "rtl" ? 1 : undefined }}
          >
            {[5, 10, 20, 50, 100].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!responses.length ? (
        <NoDataAvailable />
      ) : (
        <>
          <Grid container spacing={4} justifyContent="center">
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
                <Card
                  sx={{
                    width: "100%",
                    minWidth: { sm: 250 },
                    maxWidth: { sm: 360 },
                    boxShadow: 3,
                    borderRadius: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <CardContent>
                    {/* Attendee (submitted) details */}
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ mb: 1 }}
                    >
                      Submitted Details
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t.name}:</strong> {resp.attendee?.name || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t.email}:</strong>{" "}
                      {resp.attendee?.email || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t.company}:</strong>{" "}
                      {resp.attendee?.company || "N/A"}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>{t.submittedAt}:</strong>{" "}
                      {formatDateTimeWithLocale(resp.submittedAt)}
                    </Typography>

                    {/* Original recipient details */}
                    {resp.recipientId && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          sx={{ mt: 1 }}
                        >
                          Original Participant Details
                        </Typography>
                        <Typography variant="body2">
                          <strong>Full Name:</strong>{" "}
                          {resp.recipientId.fullName || "N/A"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Email:</strong>{" "}
                          {resp.recipientId.email || "N/A"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Company:</strong>{" "}
                          {resp.recipientId.company || "N/A"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Status:</strong>{" "}
                          {resp.recipientId.status || "N/A"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Token:</strong>{" "}
                          {resp.recipientId.token || "N/A"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Created At:</strong>{" "}
                          {resp.recipientId.createdAt
                            ? formatDateTimeWithLocale(
                                resp.recipientId.createdAt
                              )
                            : "N/A"}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          <strong>Responded At:</strong>{" "}
                          {resp.recipientId.respondedAt
                            ? formatDateTimeWithLocale(
                                resp.recipientId.respondedAt
                              )
                            : "N/A"}
                        </Typography>
                      </>
                    )}

                    {/* Answers */}
                    <Divider sx={{ my: 1 }} />
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ mt: 1 }}
                    >
                      Answers
                    </Typography>
                    {formDetails?.questions?.map((q) => {
                      const ans = resp.answers?.find(
                        (a) => String(a.questionId) === String(q._id)
                      );
                      let val = "N/A";
                      if (ans) {
                        if (ans.optionIds?.length) {
                          val = ans.optionIds
                            .map(
                              (id) =>
                                q.options?.find(
                                  (opt) => String(opt._id) === String(id)
                                )?.label || ""
                            )
                            .join(" | ");
                        } else if (ans.text) {
                          val = ans.text;
                        } else if (typeof ans.number === "number") {
                          val = ans.number.toString();
                        }
                      }
                      return (
                        <Typography key={q._id} variant="body2">
                          <strong>{q.label || "Question"}:</strong> {val}
                        </Typography>
                      );
                    })}
                  </CardContent>
                </Card>
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
        </>
      )}
    </Container>
  );
}
