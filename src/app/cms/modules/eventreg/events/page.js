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
    dateRange: "Dates",
    venue: "Venue",
    viewRegs: "View Registrations",
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
    dateRange: "التواريخ",
    venue: "الموقع",
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
              >
                {t.selectBusiness}
              </Button>
            )}
            {selectedBusiness && (
              <Button
                variant="contained"
                startIcon={<ICONS.add />}
                onClick={handleOpenCreate}
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
                      mx: "auto",
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
                          label={status}
                          color={
                            status === "Expired"
                              ? "error"
                              : status === "Current"
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
                        {ev.name}
                      </Typography>

                      <Typography variant="body2" color="textSecondary">
                        <strong>{t.slugLabel}</strong> {ev.slug}
                      </Typography>

                      <Typography variant="body2" color="textSecondary">
                        <strong>{t.dateRange}:</strong>{" "}
                        {ev?.startDate
                          ? formatDate(ev.startDate) +
                            (ev.endDate && ev.endDate !== ev.startDate
                              ? ` to ${formatDate(ev.endDate)}`
                              : "")
                          : "N/A"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ mb: 2 }}
                      >
                        <strong>{t.venue}:</strong> {ev.venue}
                      </Typography>

                      {ev.logoUrl ? (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            mb: 2,
                          }}
                        >
                          <img
                            src={ev.logoUrl}
                            alt="Event Logo"
                            style={{ maxWidth: "250px", borderRadius: 8 }}
                          />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No logo available
                        </Typography>
                      )}
                    </CardContent>

                    <CardActions sx={{ justifyContent: "center" }}>
                      <IconButton
                        color="primary"
                        onClick={() =>
                          router.replace(
                            `/cms/modules/eventreg/events/${ev.slug}/registrations`
                          )
                        }
                      >
                        <ICONS.view />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => handleOpenEdit(ev)}
                      >
                        <ICONS.edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => {
                          setEventToDelete(ev);
                          setConfirmOpen(true);
                        }}
                      >
                        <ICONS.delete />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          setEventToShare(ev);
                          setShareModalOpen(true);
                        }}
                      >
                        <ICONS.share />
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
          description={t.pageDescription}
        />
      </Container>
    </Box>
  );
}
