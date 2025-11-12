"use client";

import {
  Box,
  Container,
  Typography,
  Stack,
  Divider,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import { useEffect, useState } from "react";
import { getAllVisitors } from "@/services/stageq/visitorService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@mui/material";
import { getAllBusinesses } from "@/services/businessService";
import BusinessDrawer from "@/components/drawers/BusinessDrawer";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import LoadingState from "@/components/LoadingState";
import NoDataAvailable from "@/components/NoDataAvailable";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    title: "Visitor Tracking",
    description:
      "View all visitors and the businesses they have interacted with during events.",
    selectBusinessButton: "Select Business",
    selectBusinessTitle: "Select Business",
    noBusinessesAvailable: "No businesses available",
    notProvided: "Not provided",
    eventParticipation: "Event Participation",
    unknownBusiness: "Unknown Business",
    visits: "Visits",
    lastVisit: "Last",
  },
  ar: {
    title: "تتبع الزوار",
    description: "عرض جميع الزوار والأعمال التي تفاعلوا معها أثناء الأحداث.",
    selectBusinessButton: "اختيار العمل",
    selectBusinessTitle: "اختيار العمل",
    noBusinessesAvailable: "لا توجد أعمال متاحة",
    notProvided: "غير مقدم",
    eventParticipation: "المشاركة في الأحداث",
    unknownBusiness: "عمل غير معروف",
    visits: "الزيارات",
    lastVisit: "آخر زيارة",
  },
};

export default function VisitorsPage() {
  const { t, dir } = useI18nLayout(translations);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, selectedBusiness, setSelectedBusiness } = useAuth();
  const fetchVisitorsWithBusinessList = async (businessSlug, businessList) => {
    const data = await getAllVisitors();
    if (businessSlug) {
      const selectedBusinessObj = businessList.find(
        (b) => b.slug === businessSlug
      );

      if (selectedBusinessObj) {
        const filteredVisitors = data.filter((visitor) => {
          return visitor.eventHistory?.some((event) => {
            return event.business?._id === selectedBusinessObj._id;
          });
        });
        setVisitors(filteredVisitors);
      } else {
        setVisitors([]);
      }
    } else {
      setVisitors(data);
    }
    setLoading(false);
  };
  const fetchVisitors = async (businessSlug = null) => {
    return fetchVisitorsWithBusinessList(businessSlug, businesses);
  };
  useEffect(() => {
    const fetchBusinesses = async () => {
      const businessList = await getAllBusinesses();
      setBusinesses(businessList);
    };

    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (user?.role === "business" && user.business?.slug && !selectedBusiness) {
      setSelectedBusiness(user.business.slug);
    }
  }, [user, selectedBusiness, setSelectedBusiness]);

  useEffect(() => {
    if (!selectedBusiness) {
      setVisitors([]);
      setLoading(false);
      return;
    }

    const loadVisitors = async () => {
      setLoading(true);
      await fetchVisitorsWithBusinessList(selectedBusiness, businesses);
    };

    if (businesses.length > 0) {
      loadVisitors();
    }
  }, [selectedBusiness, businesses]);

  const handleBusinessSelect = (businessSlug) => {
    setSelectedBusiness(businessSlug);
    fetchVisitors(businessSlug);
    setDrawerOpen(false);
  };
  return (
    <Box dir={dir} sx={{ display: "flex", minHeight: "100vh" }}>
      {/* BusinessDrawer for admin only */}
      {user?.role === "admin" && (
        <BusinessDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          businesses={businesses}
          selectedBusinessSlug={selectedBusiness}
          onSelect={handleBusinessSelect}

        />
      )}
      <Container maxWidth="lg">
        <BreadcrumbsNav />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "flex-start" }}
          spacing={2}
          mb={3}
        >
          {/* Title and Description */}
          <Stack spacing={1} alignItems="flex-start" flex={1}>
            <Typography variant="h4" fontWeight="bold">
              {t.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.description}
            </Typography>
          </Stack>

          {/* Select Business Button (Admin Only) */}
          {user?.role === "admin" && (
            <Button
              variant="outlined"
              onClick={() => setDrawerOpen(true)}
              startIcon={<ICONS.business fontSize="small" />}
              fullWidth={{ xs: true, sm: false }}
              sx={{
                alignSelf: { xs: "stretch", sm: "flex-start" },
                ...getStartIconSpacing(dir),
              }}
            >
              {t.selectBusinessButton}
            </Button>
          )}
        </Stack>

        <Divider sx={{ width: "100%", mb: 4 }} />

        {!selectedBusiness ? (
          <EmptyBusinessState />
        ) : loading ? (
          <LoadingState />
        ) : visitors.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <Grid container spacing={3} justifyContent={"center"}>
            {visitors.map((v) => (
              <Grid item xs={12} sm={6} md={4} key={v._id} sx={{ width: { xs: "100%", sm: "auto" } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ gap: dir === "rtl" ? 2 : 1 }}>
                        <ICONS.person fontSize="small" />
                        <Typography variant="subtitle1" fontWeight="bold">
                          {v.name}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ gap: dir === "rtl" ? 1 : 0 }}>
                        <ICONS.phone fontSize="small" />
                        <Typography variant="body2">
                          {v.phone || "Not provided"}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ gap: dir === "rtl" ? 1 : 0 }}>
                        <ICONS.business fontSize="small" />
                        <Typography variant="body2">
                          {v.company || "Not provided"}
                        </Typography>
                      </Stack>
                    </Stack>

                    {/* Event History */}
                    {v.eventHistory?.length > 0 && (
                      <Box mt={3} p={2} borderRadius={2} bgcolor="grey.100">
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          {t.eventParticipation}
                        </Typography>

                        <Stack spacing={1}>
                          {v.eventHistory.map((event, idx) => (
                            <Box
                              key={idx}
                              display="flex"
                              flexDirection="column"
                            >
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ gap: dir === "rtl" ? 1 : 0 }}
                              >
                                <ICONS.business fontSize="small" />
                                <Typography variant="body2" fontWeight="medium">
                                  {event.business?.name || t.unknownBusiness}
                                </Typography>
                              </Stack>
                              <Stack
                                direction="row"
                                spacing={2}
                                sx={{ pl: 4, gap: dir === "rtl" ? 3 : 2 }}
                                alignItems="center"
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {t.visits}: {event.count}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {t.lastVisit}:{" "}
                                  {new Date(
                                    event.lastInteraction
                                  ).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </Typography>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
