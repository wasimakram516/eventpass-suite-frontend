"use client";

import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Divider,
  Link,
  useTheme,
} from "@mui/material";
import {
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  Language as LanguageIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LanguageSelector from "@/components/LanguageSelector";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";

export default function GeneralInfo({
  title,
  subtitle,
  description,
  ctaText,
  ctaHref,
  moduleIcon: Icon,
}) {
  const router = useRouter();
  const theme = useTheme();
  const { globalConfig } = useGlobalConfig();
  const { dir, align } = useI18nLayout();

  return (
    <Box
      dir={dir}
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        px: 2,
        py: 4,
        textAlign: align,
      }}
    >
      <LanguageSelector top={20} right={20} />

      <Container maxWidth="md" sx={{ textAlign: "center" }}>
        {Icon && (
          <Box
            sx={{
              bgcolor: `${theme.palette.primary.main}20`,
              p: 3,
              borderRadius: "50%",
              display: "inline-flex",
              mb: 3,
            }}
          >
            <Icon sx={{ fontSize: 60, color: "primary.main" }} />
          </Box>
        )}

        <Typography variant="h3" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {subtitle}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
          {description}
        </Typography>

        {ctaText && ctaHref && (
          <Button
            variant="contained"
            size="large"
            sx={{ mt: 4 }}
            onClick={() => router.push(ctaHref)}
          >
            {ctaText}
          </Button>
        )}

        <Divider sx={{ my: 6 }} />
      </Container>

      {globalConfig && (
        <Stack spacing={3} alignItems="center">
          {globalConfig.logoUrl && (
            <Box
              sx={{
                width: { xs: 100, sm: 120 },
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                src={globalConfig.logoUrl}
                alt={globalConfig.appName || "Logo"}
                width={120}
                height={40}
                style={{ width: "100%", height: "auto", objectFit: "contain" }}
              />
            </Box>
          )}

          
          {(globalConfig?.contact?.email || globalConfig?.contact?.phone) && (
            <Stack spacing={1} direction="column" alignItems="center">
              {globalConfig?.contact?.email && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EmailIcon fontSize="small" />
                  <Typography variant="body2">
                    {globalConfig.contact.email}
                  </Typography>
                </Stack>
              )}
              {globalConfig?.contact?.phone && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PhoneIcon fontSize="small" />
                  <Typography variant="body2">
                    {globalConfig.contact.phone}
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}

          
          <Stack direction="row" spacing={2}>
            {globalConfig?.socialLinks?.facebook && (
              <Link
                href={globalConfig.socialLinks.facebook}
                target="_blank"
                color="inherit"
              >
                <FacebookIcon />
              </Link>
            )}
            {globalConfig?.socialLinks?.instagram && (
              <Link
                href={globalConfig.socialLinks.instagram}
                target="_blank"
                color="inherit"
              >
                <InstagramIcon />
              </Link>
            )}
            {globalConfig?.socialLinks?.linkedin && (
              <Link
                href={globalConfig.socialLinks.linkedin}
                target="_blank"
                color="inherit"
              >
                <LinkedInIcon />
              </Link>
            )}
            {globalConfig?.socialLinks?.website && (
              <Link
                href={globalConfig.socialLinks.website}
                target="_blank"
                color="inherit"
              >
                <LanguageIcon />
              </Link>
            )}
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
