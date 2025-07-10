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
      setIsPublicEvent(eventResponse.eventType === "public");
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

    const csvHeaders = isPublicEvent
      ? ["Name", "Email", "Phone", "Company"]
      : ["Employee ID", "Employee Name", "Table Number", "Table Image URL"];

    const csvRows = registrations.map((reg) =>
      isPublicEvent
        ? [
            reg.employeeName || "N/A",
            reg.email || "N/A",
            reg.phone || "N/A",
            reg.company || "N/A",
          ]
        : [
            reg.employeeId || "N/A",
            reg.employeeName || "N/A",
            reg.tableNumber || "N/A",
            reg.tableImage || "N/A",
          ]
    );

    const eventMetadata = [
      ["Event Short Name:", eventDetails.slug || "N/A"],
      ["Event Name:", eventDetails.name || "N/A"],
      ["Event Date:", formatDate(eventDetails.date || "N/A")],
      ["Venue:", eventDetails.venue || "N/A"],
      ["Description:", eventDetails.description || "N/A"],
      ["Logo URL:", eventDetails.logoUrl || "N/A"],
      ["Event Type:", eventDetails.eventType || "N/A"],
      [],
    ];

    const csvContent = [
      ...eventMetadata.map((row) => row.join(",")),
      csvHeaders.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
    <Container maxWidth="lg">
      <BreadcrumbsNav />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems="flex-start"
        mb={2}
        spacing={2}
      >
        <Box flex={1}>
          <Typography variant="h4" fontWeight="bold">
            Event Details
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            View event details and manage registrations for this event. Export
            registration data or delete entries as needed.
          </Typography>
        </Box>

        <Box textAlign="right">
          {totalRegistrations > 0 && (
            <Button
              variant="contained"
              onClick={exportToCSV}
              color="primary"
              startIcon={<ICONS.download fontSize="small" />}
            >
              Export to CSV
            </Button>
          )}
        </Box>
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
          Showing {Math.min((page - 1) * limit + 1, totalRegistrations)}–{Math.min(page * limit, totalRegistrations)} of {totalRegistrations} records
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
          sx={{
            mt: 2,
            fontSize: "1.2rem",
            color: "text.secondary",
            textAlign: "center",
          }}
        >
          No registrations found for this event.
        </Typography>
      ) : (
        <>
          <Grid container spacing={4}>
            {registrations.map((registration) => (
              <Grid item xs={12} sm={6} md={4} key={registration._id}>
                <Card
                  sx={{
                    boxShadow: 3,
                    borderRadius: 2,
                    height: "100%",
                    position: "relative",
                  }}
                >
                  <IconButton
                    color="error"
                    sx={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                    }}
                    onClick={() => {
                      setRegistrationToDelete(registration._id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <ICONS.delete fontSize="small" />
                  </IconButton>
                  <CardContent>
                    {isPublicEvent ? (
                      <>
                        <Typography variant="h6" gutterBottom>
                          {registration.fullName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          <strong>Email:</strong> {registration.email}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          <strong>Phone:</strong> {registration.phone}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          <strong>Company:</strong> {registration.company || "N/A"}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="h6" gutterBottom>
                          {registration.employeeName}
                        </Typography>
                        {registration.employeeId && (
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            <strong>Employee ID:</strong> {registration.employeeId}
                          </Typography>
                        )}
                        {registration.tableNumber && (
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            <strong>Table Number:</strong> {registration.tableNumber}
                          </Typography>
                        )}
                        {registration.tableImage && (
                          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                            <img
                              src={registration.tableImage}
                              alt="Table"
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
    </Container>
  );
};

export default ViewRegistrations;
