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
import { useMessage } from "@/contexts/MessageContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import slugify from "@/utils/slugify";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    shareTitle: "Share Link",
    description: "Share this with others using the link or QR code below.",
    copySuccess: "Link copied to clipboard!",
    copyError: "Failed to copy link.",
    qrError: "QR Code generation failed.",
    downloadQR: "Download QR Code",
  },
  ar: {
    shareTitle: "مشاركة الرابط",
    description: "شارك هذا الرابط باستخدام الرابط أو رمز الاستجابة السريعة أدناه.",
    copySuccess: "تم نسخ الرابط!",
    copyError: "فشل في نسخ الرابط.",
    qrError: "فشل في إنشاء رمز الاستجابة السريعة.",
    downloadQR: "تحميل رمز QR",
  },
};

export default function ShareLinkModal({
  open,
  onClose,
  url = "",
  title,
  description,
  name = "qr-code",
}) {
  const qrCodeRef = useRef(null);
  const { showMessage } = useMessage();
  const { t, dir } = useI18nLayout(translations);

  const downloadName = `${slugify(name)}.png`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showMessage(t.copySuccess, "info");
    } catch (error) {
      showMessage(t.copyError, "error");
    }
  };

  const handleDownloadQRCode = () => {
    const canvas = qrCodeRef.current?.querySelector("canvas");
    if (!canvas) {
      showMessage(t.qrError, "error");
      return;
    }
    const qrDataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = qrDataURL;
    link.download = downloadName;
    link.click();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth dir={dir}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mx={2}
        mt={1}
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            fontSize: "1.5rem",
            color: "primary.main",
            flex: 1,
            textAlign: "center",
          }}
        >
          {title || t.shareTitle}
        </DialogTitle>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>

      <DialogContent sx={{ backgroundColor: "#fff", textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {description || t.description}
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
            value={url}
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
          <QRCodeCanvas value={url} size={180} />
          <Button
            variant="contained"
            startIcon={<ICONS.download />}
            onClick={handleDownloadQRCode}
            sx={getStartIconSpacing(dir)}
          >
            {t.downloadQR}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
