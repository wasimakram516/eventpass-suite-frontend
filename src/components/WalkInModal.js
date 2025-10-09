"use client";

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
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const WalkInModal = ({ open, onClose, registration }) => {
  const { t, dir, isArabic } = useI18nLayout({
    en: {
      title: "Walk-in Records",
      noRecords: "No walk-in records found for this registration.",
      scannedBy: "Scanned by",
      scannedAt: "Scanned at",
      close: "Close",
    },
    ar: {
      title: "سجلات الحضور",
      noRecords: "لا توجد سجلات حضور لهذا التسجيل.",
      scannedBy: "تم المسح بواسطة",
      scannedAt: "تم في",
      close: "إغلاق",
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth dir={dir}>
      <DialogTitle sx={{ textAlign: "center" }}>
        <Typography variant="h6" fontWeight="bold" component="div">
          {t.title}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {registration?.walkIns?.length > 0 ? (
          <List disablePadding>
            {registration.walkIns.map((walk, index) => (
              <Box key={index}>
                <ListItem alignItems="flex-start">
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ICONS.checkCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${t.scannedBy}: ${
                      walk.scannedBy?.name || walk.scannedBy?.email || "Unknown"
                    }`}
                    secondary={`${t.scannedAt}: ${new Date(
                      walk.scannedAt
                    ).toLocaleString()}`}
                    secondaryTypographyProps={{ color: "text.secondary" }}
                  />
                </ListItem>
                {index < registration.walkIns.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t.noRecords}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
        <Button
          onClick={onClose}
          startIcon={<ICONS.close />}
          sx={getStartIconSpacing(dir)}
          variant="outlined"
        >
          {t.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WalkInModal;
