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

const translations = {
  en: {
    pageTitle: "Events for",
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
    deleteEventMessage: "Are you sure you want to delete",
    slugLabel: "Slug:",
    dateLabel: "Date:",
  },
  ar: {
    pageTitle: "الفعاليات لـ",
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
    deleteEventMessage: "هل أنت متأكد أنك تريد حذف",
    slugLabel: ":المعرف",
    dateLabel: ":التاريخ",
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
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      const result = await getAllPublicEventsByBusiness(selectedBusiness);

      if (!result?.error) {
        setEvents(result.events ?? []);
      } else {
        setEvents([]);
      }

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

  const handleOpenEdit = (event) => {
    setSelectedEvent(event);
    setEditMode(true);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedEvent(null);
    setEditMode(false);
  };

  const handleSubmitEvent = async (formData, isEdit) => {
    let result;
    if (isEdit) {
      result = await updatePublicEvent(selectedEvent._id, formData);
      if (!result?.error) {
        setEvents((prev) =>
          prev.map((e) => (e._id === selectedEvent._id ? result : e))
        );
        handleCloseModal();
      }
    } else {
      result = await createPublicEvent(formData);
      if (!result?.error) {
        setEvents((prev) => [...prev, result]);
        handleCloseModal();
      }
    }
  };

  const handleDeleteEvent = async () => {
    const result = await deletePublicEvent(eventToDelete._id);
    if (!result?.error) {
      setEvents((prev) => prev.filter((e) => e._id !== eventToDelete._id));
    }
    setConfirmOpen(false);
    setEventToDelete(null);
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
        <Box sx={{ mb: 4 }}>
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
            {/* Title + Description */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                {user?.role === "admin" && !selectedBusiness
                  ? t.pageDescription
                  : `${t.pageTitle} "${selectedBusiness || ""}"`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t.pageDescription}
              </Typography>
            </Box>

            {/* Buttons */}
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
                  fullWidth
                >
                  {t.selectBusiness}
                </Button>
              )}
              {selectedBusiness && (
                <Button
                  variant="contained"
                  startIcon={<ICONS.add />}
                  onClick={handleOpenCreate}
                  fullWidth
                >
                  {t.createEvent}
                </Button>
              )}
            </Box>
          </Box>

          <Divider sx={{ mt: 2 }} />
        </Box>

        {!selectedBusiness ? (
          <EmptyBusinessState />
        ) : loading ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : events.length === 0 ? (
          <NoDataAvailable/>
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {events.map((event) => {
              const eventStatus = getEventStatus(event.date);
              return (
                <Grid item xs={12} sm={6} md={4} key={event._id}>
                  <Card
                    sx={{
                      maxWidth: 360,
                      width: "100%",
                      margin: "0 auto",
                      boxShadow: 3,
                      borderRadius: 2,
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Chip
                          label={eventStatus}
                          color={
                            eventStatus === "Expired"
                              ? "error"
                              : eventStatus === "Current"
                              ? "primary"
                              : "success"
                          }
                          sx={{
                            fontWeight: "bold",
                            textTransform: "uppercase",
                          }}
                        />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {event.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Slug:</strong> {event.slug}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Date:</strong> {formatDate(event.date)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ mb: 2 }}
                      >
                        <strong>Venue:</strong> {event.venue}
                      </Typography>
                      {event.logoUrl ? (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            mb: 2,
                          }}
                        >
                          <img
                            src={event.logoUrl}
                            alt="Event Logo"
                            style={{
                              maxWidth: "250px",
                              height: "auto",
                              objectFit: "contain",
                              borderRadius: "8px",
                            }}
                          />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No logo available
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: "center" }}>
                      {event.slug && (
                        <IconButton
                          color="primary"
                          onClick={() =>
                            router.replace(
                              `/cms/modules/eventreg/events/${event.slug}/registrations`
                            )
                          }
                        >
                          <ICONS.view fontSize="small" />
                        </IconButton>
                      )}

                      <IconButton
                        color="secondary"
                        onClick={() => handleOpenEdit(event)}
                      >
                        <ICONS.edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => {
                          setEventToDelete(event);
                          setConfirmOpen(true);
                        }}
                      >
                        <ICONS.delete fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          setEventToShare(event);
                          setShareModalOpen(true);
                        }}
                      >
                        <ICONS.share fontSize="small" />
                      </IconButton>
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
          message={`${t.deleteEventMessage} "${eventToDelete?.name}"?`}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleDeleteEvent}
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
          description={t.description}
        />
      </Container>
    </Box>
  );
}
