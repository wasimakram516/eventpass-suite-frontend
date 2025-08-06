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
import BusinessDrawer from "@/components/BusinessDrawer";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
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
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const handleBusinessSelect = (businessSlug) => {
    const business = businesses.find(b => b.slug === businessSlug);
    setSelectedBusiness(business);
    setDrawerOpen(false);
  };

  return (
    <Box dir={dir} sx={{ display: "flex", minHeight: "100vh" }}>
      {user?.role === "admin" && (
        <BusinessDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          businesses={businesses}
          selectedBusinessSlug={selectedBusiness?.slug}
          onSelect={handleBusinessSelect}
        />
      )}

      <Container maxWidth="lg">
        <BreadcrumbsNav />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          mb={1}
          sx={{ minHeight: "auto" }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {t.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.description}
            </Typography>
          </Box>

          {user?.role === "admin" && (
            <Button
              variant="outlined"
              onClick={() => setDrawerOpen(true)}
              startIcon={<ICONS.business fontSize="small" />}
              size="medium"
              sx={{
                whiteSpace: "nowrap",
                ...getStartIconSpacing(dir),
              }}
            >
              {t.selectBusinessButton}
            </Button>
          )}
        </Stack>
        <Divider sx={{ my: 3 }} />

        {!selectedBusiness ? (
          <EmptyBusinessState />
        ) : (
          <Grid container spacing={3} justifyContent={{ xs: "stretch", sm: "center" }}>
            <Grid item xs={12} sm={6} md={4} sx={{ width: { xs: "100%", sm: "auto" } }}>
              <Card
                elevation={4}
                sx={{
                  height: "100%",
                  p: 3,
                  borderRadius: 3,
                  background: "#fdfefe",
                  boxShadow: 2,
                  width: { xs: "100%", sm: "300px" },
                  maxWidth: { xs: "100%", sm: "300px" },
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "0.3s ease",
                  "&:hover": {
                    boxShadow: 4,
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  mb={1}
                  sx={{
                    gap: dir === "rtl" ? 1 : 0,
                  }}
                >
                  {selectedBusiness.logoUrl ? (
                    <Avatar
                      src={selectedBusiness.logoUrl}
                      alt={selectedBusiness.name}
                      sx={{ width: 40, height: 40 }}
                    />
                  ) : (
                    <Avatar>{selectedBusiness.name.charAt(0)}</Avatar>
                  )}
                  <Box flexGrow={1}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        whiteSpace: "normal",
                        fontSize: "1rem",
                      }}
                    >
                      {selectedBusiness.name}
                    </Typography>
                  </Box>
                  <Tooltip title={t.shareTooltip}>
                    <IconButton
                      onClick={() => handleShare(selectedBusiness)}
                      color="primary"
                      aria-label="share"
                    >
                      <ICONS.share />
                    </IconButton>
                  </Tooltip>
                </Stack>

                <CardContent>
                  <Stack spacing={1}>
                    {selectedBusiness?.contact?.email && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <ICONS.email fontSize="small" />
                        <Typography
                          variant="body2"
                          sx={{
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          {selectedBusiness?.contact?.email}
                        </Typography>
                      </Box>
                    )}
                    {selectedBusiness?.contact?.phone && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <ICONS.phone fontSize="small" />
                        <Typography
                          variant="body2"
                          sx={{ wordBreak: "break-word", whiteSpace: "normal" }}
                        >
                          {selectedBusiness?.contact?.phone}
                        </Typography>
                      </Box>
                    )}
                    {selectedBusiness?.address && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <ICONS.location fontSize="small" />
                        <Typography
                          variant="body2"
                          sx={{ wordBreak: "break-word", whiteSpace: "normal" }}
                        >
                          {selectedBusiness?.address}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
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
    </Box>
  );
}
