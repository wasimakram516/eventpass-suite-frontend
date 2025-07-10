"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";

import { createCheckInRegistration } from "@/services/checkin/checkinRegistrationService";
import ICONS from "@/utils/iconUtil";

export default function Registration() {
  const { eventSlug } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);

  const handleSubmit = async () => {
    if (!employeeId) {
      setError("Please enter your Employee ID.");
      return;
    }

    setLoading(true);
    const result = await createCheckInRegistration({
      employeeId,
      slug: eventSlug,
    });

    setLoading(false);
    if (!result?.error) {
      const { employeeName, tableNumber, tableImage } = result;
      setConfirmationData({
        message: `${employeeName}, your table number is ${tableNumber}.`,
        tableImage,
      });
      setEmployeeId("");
      setShowDialog(true);
    } else {
      setError(result.message || "Failed to check in.");
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    router.replace(`/checkin/event/${eventSlug}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        px: 2,
        py: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 600,
          borderRadius: 3,
          p: 4,
          textAlign: "center",
        }}
      >
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ICONS.diningTable sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
          <Typography variant="h4" fontWeight="bold">
            Get Your Table
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Employee ID"
          type="number"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          sx={{ mb: 3 }}
        />
        <Button
          variant="contained"
          fullWidth
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? <CircularProgress size={22} /> : "Submit"}
        </Button>
      </Paper>

      <Dialog open={showDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: "center" }}>
  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <ICONS.checkCircle sx={{ fontSize: 70, color: "#28a745", mb: 1 }} />
    <Typography variant="h6" fontWeight="bold">
      Welcome!
    </Typography>
  </Box>
</DialogTitle>

        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {confirmationData?.message}
          </Typography>
          {confirmationData?.tableImage && (
            <Box sx={{ mt: 2 }}>
              <img
                src={confirmationData.tableImage}
                alt="Table"
                style={{
                  maxWidth: "100%",
                  height: "200px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button onClick={handleDialogClose} variant="contained">
            Okay
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
