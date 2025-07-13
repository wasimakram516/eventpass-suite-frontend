"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Slide,
  Typography,
  Box,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import { forwardRef } from "react";
import useI18nLayout from "@/hooks/useI18nLayout";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="left" ref={ref} {...props} />;
});

const translations = {
  en: {
    selectBusinessToAccessFilters:
      "Please select a business first to access filter options.",
  },
  ar: {
    selectBusinessToAccessFilters:
      "يرجى اختيار شركة أولاً للوصول إلى خيارات الفلاتر.",
  },
};

const FilterDialog = ({ open, onClose, title, children }) => {
  const { t, dir } = useI18nLayout(translations);

  const hasChildren =
    !!children &&
    (!Array.isArray(children) ||
      children.some((c) => c !== null && c !== false));

  return (
    <Dialog
      dir={dir}
      open={open}
      onClose={onClose}
      keepMounted
      fullWidth
      maxWidth="sm"
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 0,
        }}
      >
        {title}
        <IconButton onClick={onClose}>
          <ICONS.close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2, flex: 1 }}>
        {hasChildren ? (
          children
        ) : (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              color: "text.secondary",
              px: 3,
            }}
          >
            <Box>
              <ICONS.business sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body1">
                {t.selectBusinessToAccessFilters}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FilterDialog;
