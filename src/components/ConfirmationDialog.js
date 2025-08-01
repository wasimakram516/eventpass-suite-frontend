"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText,
  confirmButtonIcon,
}) => {
  const [loading, setLoading] = useState(false);

  const { t, dir } = useI18nLayout({
    en: {
      cancel: "Cancel",
      yes: "Yes",
      processing: "Processing...",
    },
    ar: {
      cancel: "إلغاء",
      yes: "نعم",
      processing: "جارٍ المعالجة...",
    },
  });

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? null : onClose}
      dir={dir}
      disableScrollLock={true}
      PaperProps={{
        sx: {
          borderRadius: 2,
          padding: 2,
          maxWidth: "500px",
          width: "100%",
          backgroundColor: "#f9fafb",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          fontSize: "1.5rem",
          color: "#333",
          textAlign: "center",
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            textAlign: "center",
            margin: "1rem 0",
          }}
        >
          <DialogContentText
            sx={{
              fontSize: "1rem",
              color: "#555",
              lineHeight: 1.6,
            }}
          >
            {message}
          </DialogContentText>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 2,
          paddingBottom: "1rem",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          color="primary"
          disabled={loading}
          startIcon={<ICONS.cancel />}
          sx={{
            fontWeight: "bold",
            textTransform: "uppercase",
            padding: "0.5rem 2rem",
            ...getStartIconSpacing(dir),
          }}
        >
          {t.cancel}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              confirmButtonIcon
            )
          }
          sx={{
            fontWeight: "bold",
            textTransform: "uppercase",
            padding: "0.5rem 2rem",
            ...getStartIconSpacing(dir),
          }}
        >
          {confirmButtonText || t.yes}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
