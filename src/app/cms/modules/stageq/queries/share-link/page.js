"use client";

import {
  Box,
  Container,
  Typography,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Avatar,
  Stack,
  Button,
  Divider,
} from "@mui/material";
import { useEffect, useState } from "react";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import { getAllBusinesses } from "@/services/businessService";
import { useAuth } from "@/contexts/AuthContext";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import ShareLinkModal from "@/components/ShareLinkModal";
import EmptyBusinessState from "@/components/EmptyBusinessState";

const translations = {
  en: {
    title: "Public QR Code Links for Visitor Questions",
    description:
      "Select a business and share its public link for displaying QR codes to visitors. They can scan to post or vote on questions.",
    shareTooltip: "Share public QR code link",
    copySuccessMessage: "Public QR page link copied to clipboard!",
    noBusinessesFound: "No businesses found.",
    selectBusinessButton: "Select Business",
    drawerTitle: "Select Business",
    noBusinessesAvailable: "No businesses available",
  },
  ar: {
    title: "روابط رمز الاستجابة السريعة العامة لأسئلة الزوار",
    description:
      "اختر نشاطًا تجاريًا وشارك رابطه العام لعرض رموز QR للزوار. يمكنهم المسح لإرسال أو التصويت على الأسئلة.",
    shareTooltip: "مشاركة رابط رمز الاستجابة السريعة",
    copySuccessMessage: "تم نسخ رابط صفحة رمز الاستجابة السريعة!",
    noBusinessesFound: "لم يتم العثور على أعمال.",
    selectBusinessButton: "اختيار العمل",
    drawerTitle: "اختيار العمل",
    noBusinessesAvailable: "لا توجد أعمال متاحة",
  },
};

export default function LinkSharingPage() {
  const { t, dir } = useI18nLayout(translations);
  const { user } = useAuth();

  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchBusinesses = async () => {
      const data = await getAllBusinesses();
      if (!data.error) {
        if (user?.role === "business") {
          const business = data.find((b) => b.slug === user.business?.slug);
          if (business) {
            setBusinesses([business]);
            setSelectedBusiness(business);
          }
        } else {
          setBusinesses(data);
        }
      } else {
        setBusinesses([]);
      }
    };
    if (user) fetchBusinesses();
  }, [user]);

  const handleShare = (business) => {
    setSelectedBusiness(business);
    setModalOpen(true);
  };

  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        mb={2}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {t.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t.description}
          </Typography>
        </Box>
      </Stack>
      <Divider sx={{ my: 4 }} />

      {!businesses.length === 0 ? (
        <EmptyBusinessState />
      ) : (
        <Grid container spacing={3} justifyContent="center">
          {businesses.map((business) => (
            <Grid item key={business._id} xs={12} sm={6} md={4}>
              <Card elevation={4} sx={{ height: "100%" }}>
                <CardHeader
                  avatar={
                    business.logoUrl ? (
                      <Avatar
                        src={business.logoUrl}
                        alt={business.name}
                        sx={{ width: 40, height: 40 }}
                      />
                    ) : (
                      <Avatar>{business.name.charAt(0)}</Avatar>
                    )
                  }
                  title={
                    <Typography fontWeight="bold">{business.name}</Typography>
                  }
                  action={
                    <Tooltip title={t.shareTooltip}>
                      <IconButton
                        onClick={() => handleShare(business)}
                        color="primary"
                        aria-label="share"
                      >
                        <ICONS.share />
                      </IconButton>
                    </Tooltip>
                  }
                />
                <CardContent>
                  <Stack spacing={1}>
                    {business?.contact?.email && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <ICONS.email fontSize="small" />
                        <Typography variant="body2">
                          {business?.contact?.email}
                        </Typography>
                      </Box>
                    )}
                    {business?.contact?.phone && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <ICONS.phone fontSize="small" />
                        <Typography variant="body2">
                          {business?.contact?.phone}
                        </Typography>
                      </Box>
                    )}
                    {business?.address && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <ICONS.location fontSize="small" />
                        <Typography variant="body2">
                          {business?.address}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Share Modal */}
      <ShareLinkModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        url={
          selectedBusiness
            ? `${window.location.origin}/stageq/queries/${selectedBusiness.slug}/qr`
            : ""
        }
        qrUrl={
          selectedBusiness
            ? `${window.location.origin}/stageq/queries/${selectedBusiness.slug}/ask`
            : ""
        }
        name={selectedBusiness?.name || "QR"}
      />
    </Container>
  );
}
