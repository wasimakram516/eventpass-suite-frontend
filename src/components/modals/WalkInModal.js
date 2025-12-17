"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Box,
  Stack,
  Chip,
  IconButton,
  CircularProgress,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { useAuth } from "@/contexts/AuthContext";
import { createWalkIn } from "@/services/eventreg/registrationService";

const WalkInModal = ({ open, onClose, registration, onCheckInSuccess }) => {
  const { user } = useAuth();
  const [checkingIn, setCheckingIn] = useState(false);

  const canCheckIn =
    user?.role === "admin" ||
    user?.role === "business";
  const { t, dir } = useI18nLayout({
    en: {
      title: "Walk-in Records",
      noRecords: "No walk-in records found for this registration.",
      scannedBy: "Scanned by",
      scannedAt: "Scanned at",
      checkedInBy: "Checked in by",
      checkedInAt: "Checked in at",
      staffType: "Staff Type",
      close: "Close",
      checkIn: "Check In",
    },
    ar: {
      title: "سجلات الحضور",
      noRecords: "لا توجد سجلات حضور لهذا التسجيل.",
      scannedBy: "تم المسح بواسطة",
      scannedAt: "تم في",
      checkedInBy: "تم تسجيل الحضور بواسطة",
      checkedInAt: "تم تسجيل الحضور في",
      staffType: "نوع الطاقم",
      close: "إغلاق",
      checkIn: "تسجيل الحضور",
    },
  });

  const handleCheckIn = async () => {
    if (!registration?._id || checkingIn || !canCheckIn) return;

    setCheckingIn(true);
    try {
      await createWalkIn(registration._id);
      if (onCheckInSuccess) {
        onCheckInSuccess();
      }
      onClose();
    } catch (error) {
      console.error("Failed to check in:", error);
    } finally {
      setCheckingIn(false);
    }
  };

  const adminName = user?.name || user?.email || "Unknown";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth dir={dir}>
      <DialogTitle
        sx={{
          textAlign: "center",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold" component="div">
          {t.title}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: dir === "rtl" ? "auto" : 8,
            left: dir === "rtl" ? 8 : "auto",
            top: "50%",
            transform: "translateY(-50%)",
            bgcolor: "#ffffff",
            color: "#0077b6",
            border: "1px solid #0077b6",
            "&:hover": {
              bgcolor: "#0077b6",
              color: "#ffffff",
              borderColor: "#0077b6",
            },
          }}
        >
          <ICONS.close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {registration?.walkIns?.length > 0 ? (
          <List disablePadding>
            {registration.walkIns.map((walk, index) => {
              const staffType = walk.scannedBy?.staffType;
              const label =
                staffType && staffType.length
                  ? staffType.charAt(0).toUpperCase() + staffType.slice(1)
                  : null;

              return (
                <Box key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ICONS.checkCircle color="success" />
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={1}
                          flexWrap="wrap"
                        >
                          <Typography variant="body1" component="span">
                            {staffType ? t.scannedBy : t.checkedInBy}:{" "}
                            {walk.scannedBy?.name ||
                              walk.scannedBy?.email ||
                              "Unknown"}
                          </Typography>

                          {label && (
                            <Chip
                              icon={
                                staffType === "door" ? (
                                  <ICONS.door />
                                ) : (
                                  <ICONS.desk />
                                )
                              }
                              label={label}
                              size="small"
                              sx={{
                                bgcolor:
                                  staffType === "door" ? "#e1bee7" : "#4fc3f7",
                                color: "#000000",
                                "& .MuiChip-icon": {
                                  color: "#000000",
                                  ...(dir === "rtl" && {
                                    marginRight: "5px",
                                    marginLeft: "8px",
                                  }),
                                },
                              }}
                            />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.4 }}
                          component="span"
                        >
                          {staffType ? t.scannedAt : t.checkedInAt}:{" "}
                          {new Date(walk.scannedAt).toLocaleString()}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < registration.walkIns.length - 1 && <Divider />}
                </Box>
              );
            })}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t.noRecords}
          </Typography>
        )}
      </DialogContent>

      {onCheckInSuccess && canCheckIn && (
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button
            onClick={handleCheckIn}
            disabled={checkingIn}
            startIcon={
              checkingIn ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <ICONS.checkCircle />
              )
            }
            sx={{
              ...getStartIconSpacing(dir),
              bgcolor: "#2e7d32",
              color: "#ffffff",
              "&:hover": {
                bgcolor: "#1b5e20",
              },
              "&:disabled": {
                bgcolor: "#66bb6a",
                color: "#ffffff",
              },
            }}
            variant="contained"
          >
            {t.checkIn}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default WalkInModal;
