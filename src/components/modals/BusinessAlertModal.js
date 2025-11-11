"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Divider,
  Avatar,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BusinessIcon from "@mui/icons-material/Business";
import { orange } from "@mui/material/colors";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    title: "Action Required",
    heading: "Complete Your Business Profile",
    message:
      "You haven’t created your business profile yet. Please set it up to access all CMS features.",
    button: "Go to Business Settings",
  },
  ar: {
    title: "مطلوب إجراء",
    heading: "أكمل ملف شركتك",
    message:
      "لم تقم بإنشاء ملف شركتك بعد. يرجى إعداده للوصول إلى جميع ميزات النظام.",
    button: "الذهاب لإعدادات الشركة",
  },
};

const BusinessAlertModal = ({ open, onNavigate }) => {
  const { t, dir } = useI18nLayout(translations);

  return (
    <Dialog
      open={open}
      dir={dir}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: 8,
        },
      }}
    >
      <Box
        sx={{
          backgroundColor: orange[50],
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 3,
        }}
      >
        <Avatar
          sx={{
            bgcolor: orange[100],
            width: 72,
            height: 72,
          }}
        >
          <WarningAmberIcon sx={{ fontSize: 40, color: orange[700] }} />
        </Avatar>
      </Box>

      <DialogTitle sx={{ textAlign: "center", fontWeight: "bold", mt: 1 }}>
        {t.title}
      </DialogTitle>

      <Divider sx={{ mx: 4, mb: 2 }} />

      <DialogContent sx={{ textAlign: "center", px: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t.heading}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
        <Button
          onClick={onNavigate}
          variant="contained"
          size="large"
          color="primary"
          startIcon={<BusinessIcon />}
          sx={{
            px: 4,
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            boxShadow: 3,
          }}
        >
          {t.button}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BusinessAlertModal;
