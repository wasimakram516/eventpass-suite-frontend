"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  CircularProgress,
  IconButton,
  Divider,
  Chip,
  Card,
  CardContent,
  CardActions,
  Tooltip,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import BusinessDrawer from "@/components/BusinessDrawer";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import EventFormModal from "@/components/EventModal";
import ShareLinkModal from "@/components/ShareLinkModal";

import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import { getEventStatus, formatDate } from "@/utils/dateUtils";
import { useAuth } from "@/contexts/AuthContext";
import { getAllBusinesses } from "@/services/businessService";
import {
  getAllPublicEventsByBusiness,
  deletePublicEvent,
  createPublicEvent,
  updatePublicEvent,
} from "@/services/eventreg/eventService";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import InitialsPlaceholder from "@/components/InitialsPlaceholder";

const translations = {
  en: {
    pageTitle: "Manage Events",
    pageDescription: "Manage all public registration events for this business.",
    createEvent: "Create Event",
    selectBusiness: "Select Business",
    noEvents: "No events found.",
    noBusinesses: "No businesses found.",
    eventCreated: "Event created!",
    eventUpdated: "Event updated!",
    eventDeleted: "Event deleted!",
    errorLoading: "Error loading data.",
    deleteEventTitle: "Delete Event?",
    deleteEventMessage:
      "Are you sure you want to move this item to the Recycle Bin?",
    delete: "Delete",
    slugLabel: "Slug:",
    dateRange: "Dates",
    venue: "Venue",
    registrations: "Registrations",
    viewRegs: "View Registrations",
  },
  ar: {
    pageTitle: "إدارة الفعاليات",
    pageDescription: "إدارة جميع فعاليات التسجيل العام لهذا العمل.",
    createEvent: "إنشاء فعالية",
    selectBusiness: "اختر العمل",
    noEvents: "لا توجد فعاليات.",
    noBusinesses: "لم يتم العثور على أي عمل.",
    eventCreated: "تم إنشاء الفعالية!",
    eventUpdated: "تم تحديث الفعالية!",
    eventDeleted: "تم حذف الفعالية!",
    errorLoading: "حدث خطأ أثناء تحميل البيانات.",
    deleteEventTitle: "حذف الفعالية؟",
    deleteEventMessage:
      "هل أنت متأكد من أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    delete: "حذف",
    slugLabel: ":المعرف",
    dateRange: "التواريخ",
    venue: "الموقع",
    registrations: "التسجيلات",
    viewRegs: "عرض التسجيلات",
  },
};

export default function EventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, dir, align } = useI18nLayout(translations);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [eventToShare, setEventToShare] = useState(null);

  useEffect(() => {
    getAllBusinesses()
      .then((businesses) => setAllBusinesses(businesses || []))
      .catch(() => setAllBusinesses([]));
  }, []);

  useEffect(() => {
    if (user?.role === "business" && user.business?.slug) {
      setSelectedBusiness(user.business.slug);
    }
  }, [user]);

  useEffect(() => {
    if (!selectedBusiness) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      const result = await getAllPublicEventsByBusiness(selectedBusiness);
      if (!result?.error) setEvents(result.events || []);
      else setEvents([]);
      setLoading(false);
    };

    fetchEvents();
  }, [selectedBusiness]);

  const handleBusinessSelect = (slug) => {
    setSelectedBusiness(slug);
    setDrawerOpen(false);
  };

  const handleOpenCreate = () => {
    setSelectedEvent(null);
    setEditMode(false);
    setOpenModal(true);
  };

  const handleOpenEdit = (ev) => {
    setSelectedEvent(ev);
    setEditMode(true);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedEvent(null);
    setEditMode(false);
  };

  const handleSubmitEvent = async (formData, isEdit) => {
    let res;
    if (isEdit) {
      res = await updatePublicEvent(selectedEvent._id, formData);
      if (!res?.error) {
        setEvents((prev) => prev.map((e) => (e._id === res._id ? res : e)));
        handleCloseModal();
      }
    } else {
      res = await createPublicEvent(formData);
      if (!res?.error) {
        setEvents((prev) => [...prev, res]);
        handleCloseModal();
      }
    }
  };

  const handleDeleteEvent = async () => {
    const res = await deletePublicEvent(eventToDelete._id);
    if (!res?.error) {
      setEvents((prev) => prev.filter((e) => e._id !== eventToDelete._id));
    }
    setConfirmOpen(false);
  };

  return (
    <Box dir={dir}>
      {user?.role === "admin" && (
        <BusinessDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          businesses={allBusinesses}
          selectedBusinessSlug={selectedBusiness}
          onSelect={handleBusinessSelect}
        />
      )}

      <Container maxWidth="lg">
        <BreadcrumbsNav />
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            mt: 2,
            mb: 1,
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              {t.pageTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.pageDescription}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {user?.role === "admin" && (
              <Button
                variant="outlined"
                onClick={() => setDrawerOpen(true)}
                startIcon={<BusinessIcon />}
                sx={getStartIconSpacing(dir)}
              >
                {t.selectBusiness}
              </Button>
            )}
            {selectedBusiness && (
              <Button
                variant="contained"
                startIcon={<ICONS.add />}
                onClick={handleOpenCreate}
                sx={getStartIconSpacing(dir)}
              >
                {t.createEvent}
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {!selectedBusiness ? (
          <EmptyBusinessState />
        ) : loading ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : events.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {events.map((ev) => {
              const status =
                ev?.startDate && ev?.endDate
                  ? getEventStatus(ev.startDate, ev.endDate)
                  : "N/A";
              return (
                <Grid item xs={12} sm={6} md={4} key={ev._id}>
                  <Card
                    sx={{
                      maxWidth: 360,
                      minHeight: 420,
                      mx: "auto",
                      borderRadius: 4,
                      overflow: "hidden",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
                      },
                    }}
                  >
                    {/* Cover Image + Overlay */}
                    <Box sx={{ position: "relative", height: 200 }}>
                      {ev.logoUrl ? (
                        <img
                          src={ev.logoUrl}
                          alt={ev.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 8,
                          }}
                        />
                      ) : (
                        <InitialsPlaceholder
                          name={ev.name}
                          size={200}
                          variant="rounded"
                        />
                      )}

                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          width: "100%",
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.75) 20%, rgba(0,0,0,0) 90%)",
                          p: 2,
                          color: "white",
                        }}
                      >
                        {/* Status Chip with icon */}
                        <Chip
                          icon={
                            status === "Expired" ? (
                              <ICONS.errorOutline fontSize="small" />
                            ) : status === "Current" ? (
                              <ICONS.checkCircle fontSize="small" />
                            ) : (
                              <ICONS.info fontSize="small" />
                            )
                          }
                          label={status}
                          size="small"
                          sx={{
                            bgcolor:
                              status === "Expired"
                                ? "error.main"
                                : status === "Current"
                                ? "primary.main"
                                : "success.main",
                            color: "white",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            mb: 1,
                            borderRadius: 1.5,
                            px: 1,
                            "& .MuiChip-icon": {
                              color: "white",
                              ml: 0.5,
                            },
                          }}
                        />

                        {/* Event Name */}
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            lineHeight: 1.2,
                            mb: 0.3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ev.name}
                        </Typography>

                        {/* Venue */}
                        <Typography
                          variant="body2"
                          sx={{
                            opacity: 0.85,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <ICONS.location fontSize="small" /> {ev.venue}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Info Section */}
                    <CardContent sx={{ px: 2, py: 2, flexGrow: 1 }}>
                      {/* Slug */}
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 0.7,
                          color: "text.secondary",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.8,
                        }}
                      >
                        <ICONS.qrcode fontSize="small" sx={{ opacity: 0.7 }} />
                        <strong>{t.slugLabel}</strong> {ev.slug}
                      </Typography>

                      {/* Dates */}
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 0.7,
                          color: "text.secondary",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.8,
                          flexWrap: "wrap", // allows wrapping properly on small screens
                        }}
                      >
                        <ICONS.event fontSize="small" sx={{ opacity: 0.7 }} />
                        <strong>{t.dateRange}:</strong>{" "}
                        {ev?.startDate
                          ? `${formatDate(ev.startDate)} → ${formatDate(
                              ev.endDate
                            )}`
                          : "N/A"}
                      </Typography>

                      {/* Registrations */}
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.8,
                        }}
                      >
                        <ICONS.people fontSize="small" sx={{ opacity: 0.7 }} />
                        <strong>{t.registrations}:</strong> {ev.registrations}
                      </Typography>
                    </CardContent>

                    {/* Actions */}
                    <CardActions
                      sx={{
                        justifyContent: "space-around",
                        borderTop: "1px solid rgba(0,0,0,0.06)",
                        p: 1,
                        bgcolor: "rgba(0,0,0,0.02)",
                      }}
                    >
                      <Tooltip title={t.viewRegs}>
                        <IconButton
                          color="primary"
                          onClick={() =>
                            router.replace(
                              `/cms/modules/eventreg/events/${ev.slug}/registrations`
                            )
                          }
                          sx={{
                            "&:hover": { transform: "scale(1.1)" },
                            transition: "0.2s",
                          }}
                        >
                          <ICONS.view />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={t.edit}>
                        <IconButton
                          color="warning"
                          onClick={() => handleOpenEdit(ev)}
                          sx={{
                            "&:hover": { transform: "scale(1.1)" },
                            transition: "0.2s",
                          }}
                        >
                          <ICONS.edit />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={t.delete}>
                        <IconButton
                          color="error"
                          onClick={() => {
                            setEventToDelete(ev);
                            setConfirmOpen(true);
                          }}
                          sx={{
                            "&:hover": { transform: "scale(1.1)" },
                            transition: "0.2s",
                          }}
                        >
                          <ICONS.delete />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={t.shareTitle || "Share"}>
                        <IconButton
                          color="primary"
                          onClick={() => {
                            setEventToShare(ev);
                            setShareModalOpen(true);
                          }}
                          sx={{
                            "&:hover": { transform: "scale(1.1)" },
                            transition: "0.2s",
                          }}
                        >
                          <ICONS.share />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        <EventFormModal
          open={openModal}
          onClose={handleCloseModal}
          onSubmit={handleSubmitEvent}
          editMode={editMode}
          initialValues={selectedEvent}
          selectedBusiness={selectedBusiness}
          isEmployee={false}
        />

        <ConfirmationDialog
          open={confirmOpen}
          title={t.deleteEventTitle}
          message={t.deleteEventMessage}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleDeleteEvent}
          confirmButtonText={t.delete}
          confirmButtonIcon={<ICONS.delete />}
        />

        <ShareLinkModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          url={
            typeof window !== "undefined" && eventToShare?.slug
              ? `${window.location.origin}/eventreg/event/${eventToShare.slug}`
              : ""
          }
          name={eventToShare?.name}
          title={t.shareTitle}
          description={t.pageDescription}
        />
      </Container>
    </Box>
  );
}
