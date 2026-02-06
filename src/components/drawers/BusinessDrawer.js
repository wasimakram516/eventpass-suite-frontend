"use client";

import {
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  Stack,
  TextField,
  InputAdornment,
} from "@mui/material";
import { useMemo, useState } from "react";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import LoadingState from "../LoadingState";
import NoDataAvailable from "../NoDataAvailable";

export default function BusinessDrawer({
  open,
  onClose,
  businesses = [],
  selectedBusinessSlug,
  onSelect,
}) {
  const { t, dir, align } = useI18nLayout({
    en: {
      title: "Select Business",
      search: "Search businesses...",
      noBusinessesAvailable: "No businesses available",
      loading: "Loading businesses...",
    },
    ar: {
      title: "اختيار العمل",
      search: "ابحث عن الشركات...",
      noBusinessesAvailable: "لا توجد أعمال متاحة",
      loading: "جارٍ تحميل الشركات...",
    },
  });

  const [query, setQuery] = useState("");
  const isLoading = open && businesses === null;

  const filteredBusinesses = useMemo(() => {
    if (!Array.isArray(businesses)) return [];
    if (!query.trim()) return businesses;
    const q = query.trim().toLowerCase();
    return businesses.filter((b) =>
      `${b.name || ""} ${b.slug || ""}`.toLowerCase().includes(q)
    );
  }, [businesses, query]);

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
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {t.title}
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

        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          size="small"
          fullWidth
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <ICONS.search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* Content */}
        {isLoading ? (
          <Stack alignItems="center" spacing={2} sx={{ mt: 6 }}>
            <LoadingState size={40} />
            <Typography variant="body2" color="text.secondary" align={align}>
              {t.loading}
            </Typography>
          </Stack>
        ) : filteredBusinesses.length === 0 ? (
          <NoDataAvailable />
        ) : (
          filteredBusinesses.map((business) => (
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
                mb: 1.25,
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
              <Box
                sx={{
                  textAlign: align,
                  flex: 1,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  fontSize: "0.9rem",
                }}
              >
                {business.name}
              </Box>
            </Button>
          ))
        )}
      </Box>
    </Drawer>
  );
}
