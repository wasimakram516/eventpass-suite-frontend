"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  IconButton,
  Button,
  Pagination,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Divider,
  Container,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  getCheckInRegistrationsByEvent,
  deleteCheckInRegistration,
} from "@/services/checkin/checkinRegistrationService";
import { getCheckInEventBySlug } from "@/services/checkin/checkinEventService";

import ConfirmationDialog from "@/components/ConfirmationDialog";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import { formatDate } from "@/utils/dateUtils";
import { useParams } from "next/navigation";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import NoDataAvailable from "@/components/NoDataAvailable";

const ViewRegistrations = () => {
  const { eventSlug } = useParams();
  const [registrations, setRegistrations] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [isPublicEvent, setIsPublicEvent] = useState(false);

  const { dir, align, isArabic, t } = useI18nLayout({
    en: {
      title: "Event Details",
      description:
        "View event details and manage registrations for this event. Export registration data or delete entries as needed.",
      export: "Export to CSV",
      records: "records",
      noRecords: "No registrations found for this event.",
      delete: "Delete Registration",
      deleteMessage: "Are you sure you want to delete this registration?",
      email: "Email:",
      phone: "Phone:",
      company: "Company:",
      employeeId: "Employee ID:",
      employeeName: "Employee Name:",
      tableNumber: "Table Number:",
      tableImage: "Table Image",
      recordsPerPage: "Records per page",
      showing: "Showing",
      to: "to",
      of: "of",
      deleteRecord: "Delete Registration",
    },
    ar: {
      title: "تفاصيل الحدث",
      description:
        "اعرض تفاصيل الحدث وقم بإدارة التسجيلات. يمكنك تصدير البيانات أو حذف السجلات.",
      export: "تصدير إلى CSV",
      records: "سجلات",
      noRecords: "لا توجد تسجيلات لهذا الحدث.",
      delete: "حذف التسجيل",
      deleteMessage: "هل أنت متأكد أنك تريد حذف هذا التسجيل؟",
      email: "البريد الإلكتروني:",
      phone: "الهاتف:",
      company: "الشركة:",
      employeeId: "معرف الموظف:",
      employeeName: "اسم الموظف:",
      tableNumber: "رقم الطاولة:",
      tableImage: "صورة الطاولة",
      recordsPerPage: "عدد السجلات لكل صفحة",
      showing: "عرض",
      to: "إلى",
      of: "من",
      deleteRecord: "حذف التسجيل",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [eventResponse, registrationResponse] = await Promise.all([
        getCheckInEventBySlug(eventSlug),
        getCheckInRegistrationsByEvent(eventSlug, page, limit),
      ]);

      if (!eventResponse?.error) {
        setEventDetails(eventResponse);
        setIsPublicEvent(eventResponse.eventType === "public");
      }

      if (!registrationResponse?.error) {
        setRegistrations(registrationResponse.data || []);
        setTotalRegistrations(
          registrationResponse.pagination?.totalRegistrations || 0
        );
      }

      setLoading(false);
    };

    if (eventSlug) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [eventSlug, page, limit]);

  const handleDelete = async () => {
    const result = await deleteCheckInRegistration(registrationToDelete);

    if (!result?.error) {
      setRegistrations((prev) =>
        prev.filter((reg) => reg._id !== registrationToDelete)
      );
      setTotalRegistrations((prev) => prev - 1);
      setRegistrationToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handlePageChange = (_, value) => setPage(value);

  const handleLimitChange = (event) => {
    setLimit(event.target.value);
    setPage(1);
  };

  const exportToCSV = () => {
    if (!eventDetails) return;

    const lines = [];

    // --- Event metadata ---
    lines.push([`Event Slug:`, eventDetails.slug || `N/A`].join(`,`));
    lines.push([`Event Name:`, eventDetails.name || `N/A`].join(`,`));
    lines.push(
      [
        `Event Dates:`,
        formatDate(eventDetails.startDate) +
          (eventDetails.endDate &&
          eventDetails.endDate !== eventDetails.startDate
            ? ` to ${formatDate(eventDetails.endDate)}`
            : ``),
      ].join(`,`)
    );
    lines.push([`Venue:`, eventDetails.venue || `N/A`].join(`,`));
    lines.push([`Description:`, eventDetails.description || `N/A`].join(`,`));
    lines.push([`Logo URL:`, eventDetails.logoUrl || `N/A`].join(`,`));
    lines.push([`Event Type:`, eventDetails.eventType || `N/A`].join(`,`));
    lines.push([]); // blank line

    // --- Headers ---
    const headers = [
      `Employee ID`,
      `Employee Name`,
      `Table Number`,
      `Table Image URL`,
      `Registered At`,
    ];
    lines.push(headers.join(`,`));

    // --- Data rows ---
    registrations.forEach((reg) => {
      const row = [
        reg.employeeId || `N/A`,
        reg.employeeName || `N/A`,
        reg.tableNumber || `N/A`,
        reg.tableImage || `N/A`,
        new Date(reg.createdAt).toLocaleString(),
      ];
      lines.push(
        row.map((v) => `"${v.toString().replace(/"/g, `""`)}"`).join(`,`)
      );
    });

    // --- Download CSV ---
    const blob = new Blob([lines.join(`\n`)], {
      type: `text/csv;charset=utf-8;`,
    });
    const link = document.createElement(`a`);
    link.href = URL.createObjectURL(blob);
    link.download = `${eventDetails.slug || `event`}_registrations.csv`;
    link.click();
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
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
          <Typography variant="h5" fontWeight="bold">
            {t.title}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t.description}
          </Typography>
        </Box>

        {totalRegistrations > 0 && (
          <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button
              variant="contained"
              onClick={exportToCSV}
              startIcon={<ICONS.download fontSize="small" />}
              sx={getStartIconSpacing(dir)}
              fullWidth
            >
              {t.export}
            </Button>
          </Box>
        )}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          px: 2,
        }}
      >
        <Typography variant="body1">
          {t.showing} {Math.min((page - 1) * limit + 1, totalRegistrations)}–
          {Math.min(page * limit, totalRegistrations)} {t.of}{" "}
          {totalRegistrations} {t.records}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="limit-select-label">{t.recordsPerPage}</InputLabel>
          <Select
            labelId="limit-select-label"
            value={limit}
            onChange={handleLimitChange}
            label={t.recordsPerPage}
          >
            {[5, 10, 20, 50, 100, 250, 500].map((value) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {registrations.length === 0 ? (
        <NoDataAvailable />
      ) : (
        <>
          <Grid container spacing={4} justifyContent="center">
            {registrations.map((registration) => (
              <Grid item xs={12} sm={6} md={4} key={registration._id}>
                <Card
                  sx={{
                    maxWidth: 360,
                    margin: "0 auto",
                    height: "100%",
                    boxShadow: 3,
                    borderRadius: 2,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {registration.employeeName || registration.fullName}
                    </Typography>

                    {isPublicEvent ? (
                      <>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>{t.email}</strong> {registration.email}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>{t.phone}</strong> {registration.phone}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>{t.company}</strong>{" "}
                          {registration.company || "N/A"}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>{t.employeeId}</strong>{" "}
                          {registration.employeeId}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>{t.tableNumber}</strong>{" "}
                          {registration.tableNumber}
                        </Typography>
                        {registration.tableImage && (
                          <Box
                            sx={{
                              mt: 2,
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <img
                              src={registration.tableImage}
                              alt={t.tableImage}
                              style={{
                                maxWidth: "250px",
                                height: "auto",
                                objectFit: "contain",
                                borderRadius: "8px",
                              }}
                            />
                          </Box>
                        )}
                      </>
                    )}
                  </CardContent>

                  <CardActions sx={{ justifyContent: "center" }}>
                    <Tooltip
                      title={t.deleteRecord}
                      placement={isArabic ? "left" : "top"}
                    >
                      <IconButton
                        color="error"
                        onClick={() => {
                          setRegistrationToDelete(registration._id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <ICONS.delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Pagination
              count={Math.ceil(totalRegistrations / limit)}
              page={page}
              onChange={handlePageChange}
            />
          </Box>
        </>
      )}

      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={t.delete}
        message={t.deleteMessage}
      />
    </Container>
  );
};

export default ViewRegistrations;
