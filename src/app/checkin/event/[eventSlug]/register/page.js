"use client";

import React, { useState, useEffect } from "react";
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
import { QRCodeCanvas } from "qrcode.react";
import { useParams, useRouter } from "next/navigation";

import { createCheckInRegistration } from "@/services/checkin/checkinRegistrationService";
import { getCheckInEventBySlug } from "@/services/checkin/checkinEventService";
import ICONS from "@/utils/iconUtil";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import Background from "@/components/Background";

export default function Registration() {
  const { eventSlug } = useParams();
  const router = useRouter();

  const { t, dir } = useI18nLayout({
    en: {
      getYourTable: "Get Your Table",
      employeeId: "Employee ID",
      submit: "Submit",
      pleaseEnterEmployeeId: "Please enter your Employee ID.",
      failedToCheckIn: "Failed to check in.",
      registrationSuccess: "Registration Successful!",
      okay: "Okay",
      yourToken: "Your Token",
      qrCode: "QR Code:",
      saveQr: "Save QR Code",
    },
    ar: {
      getYourTable: "احصل على طاولتك",
      employeeId: "معرف الموظف",
      submit: "إرسال",
      pleaseEnterEmployeeId: "يرجى إدخال معرف الموظف الخاص بك.",
      failedToCheckIn: "فشل في تسجيل الحضور.",
      registrationSuccess: "تم التسجيل بنجاح!",
      okay: "حسناً",
      yourToken: "رمزك",
      qrCode: "رمز الاستجابة السريعة:",
      saveQr: "حفظ رمز QR",
    },
  });

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [qrToken, setQrToken] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      const result = await getCheckInEventBySlug(eventSlug);
      if (!result?.error) {
        setEvent(result);
      }
    };
    fetchEvent();
  }, [eventSlug]);

  const handleSubmit = async () => {
    if (!employeeId) {
      setError(t.pleaseEnterEmployeeId);
      return;
    }

    setLoading(true);
    const result = await createCheckInRegistration({
      employeeId,
      slug: eventSlug,
    });

    setLoading(false);
    if (!result?.error) {
      const { employeeName, tableNumber, tableImage, token, showQrAfterRegistration } = result;
      setConfirmationData({
        message: `${employeeName}, your table number is ${tableNumber}.`,
        tableImage,
      });
      // Use the showQrAfterRegistration from the API response instead of event data
      if (showQrAfterRegistration && token) {
        setQrToken(token);
      }
      setEmployeeId("");
      setShowDialog(true);
    } else {
      setError(result.message || t.failedToCheckIn);
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
        px: 2,
        py: 4,
      }}
    >
      <Background/>
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 600,
          borderRadius: 3,
          p: 4,
          textAlign: "center",
        }}
        dir={dir}
      >
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ICONS.diningTable
            sx={{ fontSize: 40, color: "primary.main", mr: 2 }}
          />
          <Typography variant="h4" fontWeight="bold">
            {t.getYourTable}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label={t.employeeId}
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
          {loading ? <CircularProgress size={22} /> : t.submit}
        </Button>
      </Paper>

      <Dialog
        open={showDialog}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        dir={dir}
      >
        <DialogTitle sx={{ textAlign: "center" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <ICONS.checkCircle sx={{ fontSize: 70, color: "#28a745", mb: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              {t.registrationSuccess}
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
          {qrToken && (
            <>
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                {t.yourToken}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mt: 1,
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 0.5,
                    backgroundColor: "primary.main",
                    color: "#fff",
                    borderRadius: "20px",
                    fontWeight: 600,
                    fontFamily: "monospace",
                    fontSize: 16,
                  }}
                >
                  {qrToken}
                </Box>
              </Box>

              <Box mt={2} display="flex" justifyContent="center">
                <Paper
                  id="qr-container"
                  elevation={3}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#fff",
                    display: "inline-block",
                  }}
                >
                  <QRCodeCanvas value={qrToken} size={180} />
                </Paper>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          {qrToken ? (
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => {
                const canvas = document.querySelector("#qr-container canvas");
                const url = canvas.toDataURL("image/png");
                const a = document.createElement("a");
                a.href = url;
                a.download = `CheckinQR-${qrToken}.png`;
                a.click();
              }}
            >
              {t.saveQr}
            </Button>
          ) : (
            <Button onClick={handleDialogClose} variant="contained">
              {t.okay}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <LanguageSelector top={20} right={20} />
    </Box>
  );
}
