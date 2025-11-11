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
  Stack,
  Chip,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const WalkInModal = ({ open, onClose, registration }) => {
  const { t, dir } = useI18nLayout({
    en: {
      title: "Walk-in Records",
      noRecords: "No walk-in records found for this registration.",
      scannedBy: "Scanned by",
      scannedAt: "Scanned at",
      staffType: "Staff Type",
      close: "Close",
    },
    ar: {
      title: "سجلات الحضور",
      noRecords: "لا توجد سجلات حضور لهذا التسجيل.",
      scannedBy: "تم المسح بواسطة",
      scannedAt: "تم في",
      staffType: "نوع الطاقم",
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
                            {t.scannedBy}:{" "}
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
                          {t.scannedAt}:{" "}
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
