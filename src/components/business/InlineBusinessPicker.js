"use client";

import { Box, Button, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import AppCard from "@/components/cards/AppCard";

const translations = {
  en: {
    title: "Choose a business",
    description: "Select a business to view and manage its records.",
    search: "Search businesses...",
    noMatches: "No businesses match your search.",
  },
  ar: {
    title: "اختر عملاً",
    description: "اختر عملاً لعرض سجلاته وإدارتها.",
    search: "ابحث عن الشركات...",
    noMatches: "لا توجد أعمال مطابقة للبحث.",
  },
};

export default function InlineBusinessPicker({ businesses = [], onSelect }) {
  const { t, dir, align } = useI18nLayout(translations);
  const [query, setQuery] = useState("");
  const visibleBusinesses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return businesses;
    return businesses.filter((business) =>
      `${business.name || ""} ${business.slug || ""}`.toLowerCase().includes(normalized),
    );
  }, [businesses, query]);

  return (
    <AppCard sx={{ mt: 3, p: { xs: 2, sm: 3 }, maxWidth: 760, mx: "auto", minHeight: "72vh", maxHeight: "78vh" }}>
      <Stack spacing={2} dir={dir} sx={{ flex: 1, minHeight: 0 }}>
        <Box sx={{ textAlign: align }}>
          <Typography variant="h6" fontWeight={700}>{t.title}</Typography>
          <Typography variant="body2" color="text.secondary">{t.description}</Typography>
        </Box>
        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.search}
          size="small"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start"><ICONS.search fontSize="small" /></InputAdornment>
              ),
            },
          }}
        />
        {visibleBusinesses.length ? (
          <Stack spacing={0.75} sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 0.5 }}>
            {visibleBusinesses.map((business) => (
              <Button
                key={business._id}
                variant="text"
                fullWidth
                onClick={() => onSelect(business.slug)}
                startIcon={<ICONS.business />}
                sx={{
                  justifyContent: "flex-start",
                  textTransform: "none",
                  color: "text.primary",
                  border: "1px solid",
                  borderColor: "divider",
                  px: 1.5,
                  py: 1,
                  "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                }}
              >
                <Box sx={{ flex: 1, textAlign: align }}>{business.name}</Box>
              </Button>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: align }}>
            {t.noMatches}
          </Typography>
        )}
      </Stack>
    </AppCard>
  );
}
