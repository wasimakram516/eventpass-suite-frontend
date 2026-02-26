"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Divider,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import BusinessDrawer from "@/components/drawers/BusinessDrawer";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import EventFormModal from "@/components/modals/EventModal";
import ShareLinkModal from "@/components/modals/ShareLinkModal";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import { getEventStatus, formatDate } from "@/utils/dateUtils";
import { useAuth } from "@/contexts/AuthContext";
import { getAllBusinesses } from "@/services/businessService";
import {
  getAllCheckInEvents,
  createCheckInEvent,
  updateCheckInEvent,
  deleteCheckInEvent,
} from "@/services/checkin/checkinEventService";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import EventCardBase from "@/components/cards/EventCard";

const translations = {
  en: {
    pageTitle: "Manage Events",
    pageDescription: "Manage all closed check-in events for this business.",
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
    slugLabel: "Slug:",
    dateRange: "Dates",
    venue: "Venue",
    registrations: "Registrations",
    edit: "Edit",
    delete: "Delete",
    shareTitle: "Share",
    viewRegs: "View Registrations",
    viewWhatsAppLogs: "View WhatsApp Logs",
    createdBy: "Created:",
    updatedBy: "Updated:",
    createdAt: "Created At:",
    updatedAt: "Updated At:",
  },
  ar: {
    pageTitle: "إدارة الفعاليات",
    pageDescription: "إدارة جميع فعاليات تسجيل الحضور المغلقة لهذا العمل.",
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
      "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    slugLabel: ":المعرف",
    dateRange: "التواريخ",
    venue: "الموقع",
    registrations: "التسجيلات",
    edit: "تعديل",
    delete: "حذف",
    shareTitle: "مشاركة",
    viewRegs: "عرض التسجيلات",
    viewWhatsAppLogs: "عرض سجلات واتساب",
    createdBy: "أنشئ:",
    updatedBy: "حدث:",
    createdAt: "تاريخ الإنشاء:",
    updatedAt: "تاريخ التحديث:",
  },
};

export default function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, selectedBusiness, setSelectedBusiness } = useAuth();
  const { t, dir, align, language } = useI18nLayout(translations);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [eventToShare, setEventToShare] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const initialSearch = searchParams.get("search");
    if (initialSearch) {
      setSearchTerm(initialSearch.trim());
    }
  }, [searchParams]);

  useEffect(() => {
    getAllBusinesses()
      .then((businesses) => setAllBusinesses(businesses || []))
      .catch(() => setAllBusinesses([]));
  }, []);

  useEffect(() => {
    if (user?.role === "business" && user.business?.slug && !selectedBusiness) {
      setSelectedBusiness(user.business.slug);
    }
  }, [user, selectedBusiness, setSelectedBusiness]);

  useEffect(() => {
    if (!selectedBusiness) {
      setEvents([]);
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      const result = await getAllCheckInEvents(selectedBusiness);
      setEvents(result?.events ?? []);
      setLoading(false);
    };

    fetchEvents();
  }, [selectedBusiness]);

  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return events;
    return events.filter((ev) => {
      const name = (ev.name || "").toLowerCase();
      const slug = (ev.slug || "").toLowerCase();
      return name.includes(term) || slug.includes(term);
    });
  }, [events, searchTerm]);

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
      result = await updateCheckInEvent(selectedEvent._id, formData);
      if (!result?.error) {
        setEvents((prev) =>
          prev.map((e) => (e._id === selectedEvent._id ? result : e))
        );
        handleCloseModal();
      }
    } else {
      result = await createCheckInEvent(formData);
      if (!result?.error) {
        setEvents((prev) => [...prev, result]);
        handleCloseModal();
      }
    }
  };

  const handleDeleteEvent = async () => {
    const result = await deleteCheckInEvent(eventToDelete._id);
    if (!result?.error) {
      setEvents((prev) => prev.filter((e) => e._id !== eventToDelete._id));
    }
    setConfirmOpen(false);
    setEventToDelete(null);
  };

  return (
    <Box dir={dir}>
      {(user?.role === "admin" || user?.role === "superadmin") && (
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
              {(user?.role === "admin" || user?.role === "superadmin") && (
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

          <Divider sx={{ mt: 2 }} />
        </Box>

        {!selectedBusiness ? (
          <EmptyBusinessState />
        ) : loading ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredEvents.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {filteredEvents.map((event) => {
              const eventStatus =
                event?.startDate && event?.endDate
                  ? getEventStatus(event.startDate, event.endDate)
                  : "N/A";
              return (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={event._id}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  <EventCardBase
                    event={event}
                    t={t}
                    status={eventStatus}
                    showRegistrations
                    showAudit={true}
                    locale={language === "ar" ? "ar-SA" : "en-GB"}
                    onView={
                      event.slug
                        ? () =>
                          router.replace(
                            `/cms/modules/checkin/events/${event.slug}/registrations`
                          )
                        : undefined
                    }
                    onViewWhatsAppLogs={
                      event.slug
                        ? () =>
                          router.push(
                            `/cms/modules/checkin/events/${event.slug}/whatsapp`
                          )
                        : undefined
                    }
                    onEdit={() => handleOpenEdit(event)}
                    onDelete={() => {
                      setEventToDelete(event);
                      setConfirmOpen(true);
                    }}
                    onShare={() => {
                      setEventToShare(event);
                      setShareModalOpen(true);
                    }}
                  />
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
          isClosed={true}
          translations={translations}
        />

        <ConfirmationDialog
          open={confirmOpen}
          title={t.deleteEventTitle}
          message={t.deleteEventMessage}
          confirmButtonIcon={<ICONS.delete />}
          confirmButtonText={t.delete}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleDeleteEvent}
        />

        <ShareLinkModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          url={
            typeof window !== "undefined" && eventToShare?.slug
              ? `${window.location.origin}/checkin/event/${eventToShare.slug}`
              : ""
          }
          name={eventToShare?.name}
          title={t.shareTitle}
          description={t.description}
          customQrWrapper={eventToShare?.customQrWrapper}
        />
      </Container>
    </Box>
  );
}
