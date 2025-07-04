"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Typography,
  Button,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useMessage } from "../contexts/MessageContext";
import { useLanguage } from "../contexts/LanguageContext";

const ShareGameModal = ({ open, onClose, gameSlug }) => {
  const { showMessage } = useMessage();

  const gameLink = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/quiznest/game/${gameSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(gameLink);
    showMessage("Game link copied to clipboard!", "success");
  };
  const { language } = useLanguage(); //Language Usage
  const shareGameTranslations = {
    en: {
      title: "Share Game",
      description: "Use the following link to share this game:",
      copyTooltip: "Copy to Clipboard",
      closeButton: "Close",
    },
    ar: {
      title: "مشاركة اللعبة",
      description: "استخدم الرابط التالي لمشاركة هذه اللعبة:",
      copyTooltip: "نسخ إلى الحافظة",
      closeButton: "إغلاق",
    },
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: "primary.main", color: "white" }}>
        {shareGameTranslations[language].title}
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ mt: 2 }}>
          {shareGameTranslations[language].description}
        </Typography>
        <TextField
          fullWidth
          value={gameLink}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <Tooltip title={shareGameTranslations[language].copyTooltip}>
                <IconButton onClick={handleCopyLink}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            ),
          }}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} color="error">
          {shareGameTranslations[language].closeButton}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareGameModal;
