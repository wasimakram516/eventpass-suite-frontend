"use client";

import {
  Box,
  Typography,
  Container,
  Stack,
  Divider,
  Button,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/navigation";
import useI18nLayout from "@/hooks/useI18nLayout";
import BreadcrumbsNav from "./BreadcrumbsNav";

export default function ModuleLandingPage({
  moduleIcon: Icon,
  ctaHref,
  translations,
}) {
  const { dir, align, t } = useI18nLayout(translations);
  const theme = useTheme();
  const router = useRouter();

  return (
    <Container maxWidth="lg" dir={dir}>
      <BreadcrumbsNav />
      <Stack spacing={4} alignItems="center">
        {Icon && (
          <Box
            sx={{
              bgcolor: `${theme.palette.primary.main}20`,
              p: 3,
              borderRadius: "50%",
              display: "inline-flex",
            }}
          >
            <Icon sx={{ fontSize: 60, color: "primary.main" }} />
          </Box>
        )}

        <Typography
          variant="h3"
          fontWeight="bold"
          textAlign={align}
          color="text.primary"
        >
          {t.title}
        </Typography>

        <Divider sx={{ width: "100%" }} />

        <Stack spacing={2} sx={{ width: "100%" }} textAlign={align}>
          {t.features.map((feat, i) => (
            <Typography
              key={i}
              variant="body1"
              color="text.secondary"
              sx={{ lineHeight: 1.8 }}
            >
              • {feat}
            </Typography>
          ))}
        </Stack>

        {t.ctaLabel && ctaHref && (
          <Button
            variant="contained"
            size="large"
            color="primary"
            onClick={() => router.push(ctaHref)}
            sx={{ mt: 4 }}
          >
            {t.ctaLabel}
          </Button>
        )}
      </Stack>
    </Container>
  );
}
