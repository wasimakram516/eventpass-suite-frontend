"use client";

import {
  Box,
  Typography,
  Container,
  Stack,
  Divider,
  Button,
  Paper,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/navigation";
import useI18nLayout from "@/hooks/useI18nLayout";
import BreadcrumbsNav from "./nav/BreadcrumbsNav";

export default function ModuleLandingPage({
  moduleIcon: Icon,
  ctaHref,
  translations,
}) {
  const { dir, align, t } = useI18nLayout(translations);
  const isRtl = dir === "rtl";
  const router = useRouter();
  const theme = useTheme();

  return (
    <Box
      dir={dir}
      sx={{
        minHeight: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        bgcolor: "background.default",
        backgroundImage: `radial-gradient(1200px 600px at 85% -10%, ${theme.palette.primary.main}1A, transparent), radial-gradient(800px 500px at -10% 15%, ${theme.palette.secondary.main}1A, transparent)`,
        color: "text.primary",
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(0deg, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.65))",
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ pt: 3, zIndex: 1 }}>
        <BreadcrumbsNav />
      </Container>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        <Container maxWidth="lg" sx={{ direction: dir }}>
          <Stack
            spacing={4}
            alignItems={{ xs: "stretch", md: "center" }}
            direction={{ xs: "column", md: isRtl ? "row-reverse" : "row" }}
          >
            <Box
              sx={{
                flex: 1,
                textAlign: align,
                order: {
                  xs: isRtl ? 2 : 1,
                  md: isRtl ? 2 : 1,
                },
              }}
            >
              <Stack spacing={3}>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent={{ xs: "center", sm: align }}
                >
                  {Icon && (
                    <Box
                      sx={{
                        bgcolor: `${theme.palette.primary.main}20`,
                        p: 1.5,
                        borderRadius: "14px",
                        display: "inline-flex",
                      }}
                    >
                      <Icon sx={{ fontSize: 60, color: "primary.main" }} />
                    </Box>
                  )}
                </Stack>

                <Typography
                  variant="h3"
                  fontWeight={800}
                  textAlign={{ xs: "center", sm: align }}
                  color="text.primary"
                >
                  {t.title}
                </Typography>

                {t.subtitle && (
                  <Typography
                    variant="h6"
                    textAlign={align}
                    color="text.secondary"
                    sx={{ maxWidth: 560 }}
                  >
                    {t.subtitle}
                  </Typography>
                )}

                <Divider
                  sx={{ width: "100%", maxWidth: 520, alignSelf: align }}
                />

                {t.ctaLabel && ctaHref && (
                  <Stack
                    direction={{
                      xs: "column",
                      sm: dir === "rtl" ? "row-reverse" : "row",
                    }}
                    spacing={2}
                    justifyContent={align}
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => router.push(ctaHref)}
                      sx={{
                        px: 4,
                      }}
                    >
                      {t.ctaLabel}
                    </Button>
                    {t.secondaryCta && (
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => router.push(t.secondaryCta.href)}
                        sx={{
                          px: 4,
                        }}
                      >
                        {t.secondaryCta.label}
                      </Button>
                    )}
                  </Stack>
                )}
              </Stack>
            </Box>

            <Box
              sx={{
                flex: 1,
                order: {
                  xs: isRtl ? 1 : 2,
                  md: isRtl ? 1 : 2,
                },
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  bgcolor: "background.paper",
                  boxShadow: `0 24px 60px ${theme.palette.primary.main}1F`,
                  textAlign: align,
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    letterSpacing: 2,
                    color: "text.secondary",
                    fontWeight: 700,
                    textAlign: align,
                  }}
                >
                  {t.featuresTitle ||
                    (dir === "rtl" ? "المزايا" : "Key Features")}
                </Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {(t.features || []).map((feat, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: "flex",
                        flexDirection: isRtl ? "row-reverse" : "row",
                        alignItems: "flex-start",
                        columnGap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "background.default",
                        border: `1px solid ${theme.palette.divider}`,
                        textAlign: align,
                      }}
                    >
                      <Box
                        sx={{
                          minWidth: 36,
                          height: 36,
                          borderRadius: "10px",
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </Box>
                      <Typography
                        variant="body1"
                        color="text.primary"
                        sx={{ lineHeight: 1.7, textAlign: align }}
                      >
                        {feat}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Box>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
