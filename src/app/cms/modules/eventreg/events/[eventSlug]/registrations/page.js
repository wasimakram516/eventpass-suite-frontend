"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
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
  CardActions,
  Tooltip,
} from "@mui/material";

import {
  getRegistrationsByEvent,
  deleteRegistration,
} from "@/services/eventreg/registrationService";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";

import ConfirmationDialog from "@/components/ConfirmationDialog";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import { formatDate } from "@/utils/dateUtils";
import { useParams } from "next/navigation";
import ICONS from "@/utils/iconUtil";
import WalkInModal from "@/components/WalkInModal";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

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
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);

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
      viewWalkIns: "View Walk-in Records",
      deleteRecord: "Delete Registration",
      recordsPerPage: "Records per page",
      showing: "Showing",
      to: "to",
      of: "of",
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
      viewWalkIns: "عرض سجلات الحضور",
      deleteRecord: "حذف التسجيل",
      recordsPerPage: "عدد السجلات لكل صفحة",
      showing: "عرض",
      to: "إلى",
      of: "من",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [eventResponse, registrationResponse] = await Promise.all([
        getPublicEventBySlug(eventSlug),
        getRegistrationsByEvent(eventSlug, page, limit),
      ]);

      // Handle event data
      if (!eventResponse?.error) {
        setEventDetails(eventResponse);
      }

      // Handle registration data
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
    const result = await deleteRegistration(registrationToDelete);

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

    const csvHeaders = ["Name", "Email", "Phone", "Company"];
    const csvContent = [];

    // Event metadata
    const eventMetadata = [
      ["Event Slug:", eventDetails.slug || "N/A"],
      ["Event Name:", eventDetails.name || "N/A"],
      ["Event Date:", formatDate(eventDetails.date || "N/A")],
      ["Venue:", eventDetails.venue || "N/A"],
      ["Description:", eventDetails.description || "N/A"],
      ["Logo URL:", eventDetails.logoUrl || "N/A"],
      ["Event Type:", eventDetails.eventType || "N/A"],
      [],
    ];
    eventMetadata.forEach((row) => csvContent.push(row.join(",")));

    // Main headers
    csvContent.push(csvHeaders.join(","));

    registrations.forEach((reg, index) => {
      const mainRow = [
        reg.fullName || "N/A",
        reg.email || "N/A",
        reg.phone || "N/A",
        reg.company || "N/A",
      ];
      csvContent.push(mainRow.join(","));

      if (Array.isArray(reg.walkIns) && reg.walkIns.length > 0) {
        csvContent.push(
          `Walk-in Records for ${reg.fullName || `#${index + 1}`}:`
        );
        csvContent.push("Scanned At,Scanned By");

        reg.walkIns.forEach((walkin) => {
          const scannedAt = new Date(walkin.scannedAt).toLocaleString();
          const scannedBy =
            walkin.scannedBy?.name || walkin.scannedBy?.email || "Unknown";
          csvContent.push(`${scannedAt},${scannedBy}`);
        });

        csvContent.push(""); // blank line after walk-ins
      }
    });

    const blob = new Blob([csvContent.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${eventDetails.name || "event"}_registrations.csv`;
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
        {/* Left: Title + Description */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            {t.title}
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            {t.description}
          </Typography>
        </Box>

        {/* Right: Export Button */}
        {totalRegistrations > 0 && (
          <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button
              variant="contained"
              onClick={exportToCSV}
              color="primary"
              startIcon={<ICONS.download fontSize="small" />}
              fullWidth
              sx={getStartIconSpacing(dir)}
            >
              {t.export}
            </Button>
          </Box>
        )}
      </Stack>

      <Divider sx={{ my: 3 }} />

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
        <FormControl size="small" sx={{ minWidth: 150, ml: 2 }}>
          <InputLabel id="limit-select-label">Records per page</InputLabel>
          <Select
            labelId="limit-select-label"
            value={limit}
            onChange={handleLimitChange}
            label="Records per page"
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
        <Typography
          sx={{ textAlign: "center", color: "text.secondary", mt: 2 }}
        >
          {t.noRecords}
        </Typography>
      ) : (
        <>
          <Grid container spacing={4} justifyContent="center">
            {registrations.map((registration) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={registration._id}
                sx={{ display: "flex", justifyContent: "center" }}
              >
                <Card
                  sx={{
                    width: "100%",
                    maxWidth: 360,
                    boxShadow: 3,
                    borderRadius: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {registration.fullName}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mt: 1 }}
                    >
                      <strong>{t.email}</strong> {registration.email}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mt: 1 }}
                    >
                      <strong>{t.phone}</strong> {registration.phone}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mt: 1 }}
                    >
                      <strong>{t.company}</strong>{" "}
                      {registration.company || "N/A"}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ justifyContent: "center", gap: 1 }}>
                    <Tooltip
                      title={t.viewWalkIns}
                      placement={isArabic ? "left" : "top"}
                    >
                      <IconButton
                        color="info"
                        onClick={() => {
                          setSelectedRegistration(registration);
                          setWalkInModalOpen(true);
                        }}
                      >
                        <ICONS.view fontSize="small" />
                      </IconButton>
                    </Tooltip>

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
              color="primary"
            />
          </Box>
        </>
      )}

      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Registration"
        message="Are you sure you want to delete this registration?"
      />

      <WalkInModal
        open={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        registration={selectedRegistration}
      />
    </Container>
  );
};

export default ViewRegistrations;
