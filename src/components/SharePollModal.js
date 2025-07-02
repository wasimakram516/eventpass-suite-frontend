"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  Button,
  Stack,
} from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useRef } from "react";
import { useMessage } from "@/app/context/MessageContext";

export default function SharePollModal({ open, onClose, poll }) {
  const qrCodeRef = useRef(null);
  const { showMessage } = useMessage();

  if (!poll) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareableLink = `${origin}/polls/${poll.business?.slug}/vote`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      showMessage("Link copied to clipboard!", "info");
    } catch (error) {
      showMessage("Failed to copy link.", "error");
    }
  };

  const handleDownloadQRCode = () => {
    const canvas = qrCodeRef.current?.querySelector("canvas");
    if (!canvas) {
      showMessage("QR Code generation failed.", "error");
      return;
    }
    const qrDataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = qrDataURL;
    link.download = "Poll-QR-Code.png";
    link.click();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mx={2}
      >
        <DialogTitle
          sx={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "1.5rem",
            color: "primary.main",
          }}
        >
          Share Poll Link
        </DialogTitle>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <DialogContent sx={{ backgroundColor: "#fff", textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Share this poll with your participants using the link or QR code
          below.
        </Typography>

        {/* Shareable Link */}
        <Box
          sx={{
            backgroundColor: "#f9f9f9",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: 2,
            mb: 3,
            display: "flex",
            alignItems: "center",
          }}
        >
          <TextField
            value={shareableLink}
            fullWidth
            variant="standard"
            InputProps={{
              readOnly: true,
              disableUnderline: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleCopyLink}>
                    <ContentCopyIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* QR Code Section */}
        <Box
          ref={qrCodeRef}
          sx={{
            backgroundColor: "#f9f9f9",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <QRCodeCanvas value={shareableLink} size={180} />
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={handleDownloadQRCode}
          >
            Download QR Code
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
