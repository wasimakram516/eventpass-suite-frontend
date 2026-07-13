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
import { alpha } from "@mui/material/styles";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { useAuth } from "@/contexts/AuthContext";
import { createWalkIn } from "@/services/eventreg/registrationService";

const WalkInModal = ({ open, onClose, registration, onCheckInSuccess, createWalkInFn, isDigiPass = false }) => {
  const { user } = useAuth();
  const [checkingIn, setCheckingIn] = useState(false);

  const canCheckIn =
    user?.role === "admin" ||
    user?.role === "superadmin" ||
    user?.role === "business";

  const walkInsCount = registration?.walkIns?.length || 0;

  const { t, dir } = useI18nLayout({
    en: {
      title: "Walk-in Records",
      activitiesCompleted: "Completed Activities",
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
      activitiesCompleted: "الأنشطة المكتملة",
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

  const modalTitle = isDigiPass
    ? `${t.activitiesCompleted}: ${walkInsCount}`
    : t.title;

  const handleCheckIn = async () => {
    if (!registration?._id || checkingIn || !canCheckIn) return;

    setCheckingIn(true);
    try {
      const createFn = createWalkInFn || createWalkIn;
      await createFn(registration._id);
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
        <Typography variant="h6" component="div" sx={{
          fontWeight: "bold"
        }}>
          {modalTitle}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: dir === "rtl" ? "auto" : 8,
            left: dir === "rtl" ? 8 : "auto",
            top: "50%",
            transform: "translateY(-50%)",
            bgcolor: "background.paper",
            color: "primary.main",
            border: "1px solid",
            borderColor: "primary.main",
            "&:hover": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
              borderColor: "primary.main",
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
                          spacing={1}
                          sx={{
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap"
                          }}>
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
                                bgcolor: (theme) => alpha(theme.palette[staffType === "door" ? "secondary" : "primary"].main, theme.palette.mode === "dark" ? 0.22 : 0.12),
                                color: "text.primary",
                                "& .MuiChip-icon": {
                                  color: "text.primary",
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
                          component="span"
                          sx={{
                            color: "text.secondary",
                            mt: 0.4
                          }}>
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
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            {t.noRecords}
          </Typography>
        )}
      </DialogContent>
      {(onCheckInSuccess && canCheckIn) && (
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
              bgcolor: "success.main",
              color: "success.contrastText",
              "&:hover": { bgcolor: "success.dark" },
              "&:disabled": { bgcolor: "success.light", color: "success.contrastText" },
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
