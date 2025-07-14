"use client";

import {
  Box,
  Container,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";
import { useEffect, useState } from "react";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import { useMessage } from "@/contexts/MessageContext";
import { getAllBusinesses } from "@/services/businessService";
import { useAuth } from "@/contexts/AuthContext";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    title: "Public QR Code Links for Visitor Questions",
    description:
      "Copy the business-specific link below and open it on any public screen. Visitors can scan the QR code shown on that page to submit or vote on questions.",
    copyLinkTooltip: "Copy public QR page link",
    copySuccessMessage: "Public QR page link copied to clipboard!",
    noBusinessesFound: "No businesses found.",
  },
  ar: {
    title: "روابط رمز الاستجابة السريعة العامة لأسئلة الزوار",
    description:
      "انسخ الرابط الخاص بالعمل أدناه وافتحه على أي شاشة عامة. يمكن للزوار مسح رمز الاستجابة السريعة المعروض في تلك الصفحة لتقديم أو التصويت على الأسئلة.",
    copyLinkTooltip: "نسخ رابط صفحة رمز الاستجابة السريعة العامة",
    copySuccessMessage:
      "تم نسخ رابط صفحة رمز الاستجابة السريعة العامة إلى الحافظة!",
    noBusinessesFound: "لم يتم العثور على أعمال.",
  },
};
export default function LinkSharingPage() {
  const { t, dir } = useI18nLayout(translations);
  const { showMessage } = useMessage();
  const [businesses, setBusinesses] = useState([]);
  const { user } = useAuth();
  useEffect(() => {
    const fetchBusinesses = async () => {
      if (user?.role === "business" && user?.business) {
        setBusinesses([user.business]);
      } else {
        const data = await getAllBusinesses();
        setBusinesses(data);
      }
    };
    if (user) {
      fetchBusinesses();
    }
  }, [user]);

  const handleCopy = (slug) => {
    const fullUrl = `${window.location.origin}/stageq/queries/${slug}/qr`;
    navigator.clipboard.writeText(fullUrl);
    showMessage(t.copySuccessMessage, "success");
  };

  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />
      <Stack spacing={2} mb={4}>
        <Typography variant="h4" fontWeight="bold">
          {t.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.description}
        </Typography>
        <Divider sx={{ mt: 2 }} />
      </Stack>
      <Stack spacing={3}>
        {businesses.length === 0 ? (
          <Typography>{t.noBusinessesFound}</Typography>
        ) : (
          businesses.map((business) => {
            return (
              <Card key={business._id} variant="outlined">
                <CardHeader
                  title={
                    <Typography fontWeight="bold">{business.name}</Typography>
                  }
                  action={
                    <Tooltip title={t.copyLinkTooltip}>
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(business.slug)}
                        aria-label="Copy link"
                      >
                        <ICONS.copy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                  sx={{ pb: 0 }}
                />
                <CardContent>
                  <Stack spacing={1} mt={1}>
                    {business.contactEmail && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <ICONS.email fontSize="small" />
                        <Typography variant="body2">
                          {business.contactEmail}
                        </Typography>
                      </Box>
                    )}
                    {business.contactPhone && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <ICONS.phone fontSize="small" />
                        <Typography variant="body2">
                          {business.contactPhone}
                        </Typography>
                      </Box>
                    )}
                    {business.address && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <ICONS.location fontSize="small" />
                        <Typography variant="body2">
                          {business.address}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            );
          })
        )}
      </Stack>
    </Container>
  );
}
