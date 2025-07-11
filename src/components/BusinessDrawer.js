"use client";

import {
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  Stack,
} from "@mui/material";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

export default function BusinessDrawer({
  open,
  onClose,
  businesses = [],
  selectedBusinessSlug,
  onSelect,
  title,
  noDataText, 
}) {
  const { dir, align } = useI18nLayout();

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 320,
          p: 3,
          bgcolor: "background.paper",
          borderTopRightRadius: 12,
          borderBottomRightRadius: 12,
        },
      }}
    >
      <Box dir={dir}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              bgcolor: "grey.100",
              "&:hover": { bgcolor: "grey.200" },
            }}
          >
            <ICONS.close />
          </IconButton>
        </Box>

        {/* Content */}
        {businesses.length > 0 ? (
          businesses.map((business) => (
            <Button
              key={business._id}
              onClick={() => onSelect(business.slug)}
              color="primary"
              variant={
                selectedBusinessSlug === business.slug
                  ? "contained"
                  : "outlined"
              }
              fullWidth
              sx={{
                ...getStartIconSpacing(dir),
                mb: 1.5,
                justifyContent: "flex-start",
                borderRadius: 3,
                boxShadow:
                  selectedBusinessSlug === business.slug
                    ? "0px 6px 12px rgba(0,0,0,0.1)"
                    : "none",
                transition: "all 0.2s ease-in-out",
              }}
              startIcon={<ICONS.business />}
            >
              {business.name}
            </Button>
          ))
        ) : (
          <Stack alignItems="center" spacing={2} sx={{ mt: 6 }}>
            <ICONS.business sx={{ fontSize: 48, color: "grey.400" }} />
            <Typography variant="body2" color="text.secondary" align={align}>
              {noDataText}
            </Typography>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
