"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
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
  confirmButtonColor = "error",
  checkboxOptions,
}) => {
  const [loading, setLoading] = useState(false);
  const [checkedValues, setCheckedValues] = useState({});

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

  // reset/initialize checkbox state every time dialog opens
  useEffect(() => {
    if (open && checkboxOptions?.length) {
      const initial = {};
      checkboxOptions.forEach((opt) => {
        initial[opt.key] = !!opt.defaultChecked;
      });
      setCheckedValues(initial);
    }
  }, [open]);
  const handleToggle = (key) => (e) => {
    const checked = e.target.checked;
    setCheckedValues((prev) => {
      const updated = { ...prev, [key]: checked };
      if (!checked) {
        // Unchecking a parent forces all its dependents off too
        checkboxOptions.forEach((opt) => {
          if (opt.dependsOn === key) {
            updated[opt.key] = false;
          }
        });
      }
      return updated;
    });
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (checkboxOptions?.length) {
        await onConfirm(checkedValues);
      } else {
        await onConfirm();
      }
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
      slotProps={{
        paper: {
          sx: (theme) => ({
            borderRadius: 2,
            padding: 2,
            maxWidth: "500px",
            width: "100%",
            backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.92 : 0.98),
            border: "1px solid",
            borderColor: theme.palette.divider,
            boxShadow: theme.palette.custom.shadow.shadow3,
          }),
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          fontSize: "1.5rem",
          color: "text.primary",
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
              color: "text.secondary",
              lineHeight: 1.6,
            }}
          >
            {message}
          </DialogContentText>

          {checkboxOptions?.length > 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                mt: 2,
                textAlign: dir === "rtl" ? "right" : "left",
              }}
            >
              {checkboxOptions.map((opt) => {
                const parentSatisfied = opt.dependsOn
                  ? !!checkedValues[opt.dependsOn]
                  : true;
                if (opt.dependsOn && !parentSatisfied) return null;

                return (
                  <FormControlLabel
                    key={opt.key}
                    control={
                      <Checkbox
                        checked={!!checkedValues[opt.key]}
                        onChange={handleToggle(opt.key)}
                        color="primary"
                        disabled={loading}
                      />
                    }
                    label={opt.label}
                    sx={opt.dependsOn ? { marginInlineStart: 3 } : {}} />
                );
              })}
            </Box>
          )}
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
          color={confirmButtonColor}
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
