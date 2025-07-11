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

import { createRegistration } from "@/services/eventreg/registrationService";
import ICONS from "@/utils/iconUtil";

export default function Registration() {
  const { eventSlug } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    company: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" && !/^\+?[0-9]*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    const { fullName, phone, email, company } = formData;
    if (!fullName || !phone || !email) {
      setError("Please fill all the required fields.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Invalid email format.");
      return;
    }

    setLoading(true);
    const result = await createRegistration({
      fullName,
      phone,
      email,
      company,
      slug: eventSlug,
    });

    setLoading(false);
    if (!result?.error) {
      setShowDialog(true);
      setFormData({ fullName: "", phone: "", email: "", company: "" });
    } else {
      setError(result.message || "Failed to register.");
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    router.replace(`/eventreg/event/${eventSlug}`);
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
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ICONS.appRegister
            sx={{ fontSize: 40, color: "primary.main", mr: 2 }}
          />
          <Typography variant="h4" fontWeight="bold">
            Register for the Event
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Phone Number"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          error={formData.email && !isValidEmail(formData.email)}
          helperText={
            formData.email && !isValidEmail(formData.email)
              ? "Invalid email"
              : ""
          }
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Company (optional)"
          name="company"
          value={formData.company}
          onChange={handleInputChange}
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

      <Dialog
        open={showDialog}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: "center" }}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <ICONS.checkCircle sx={{ fontSize: 70, color: "#28a745", mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" component="div">
              Registration Successful!
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Thank you for registering. We look forward to seeing you!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button onClick={handleDialogClose} variant="contained">
            View Event
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
