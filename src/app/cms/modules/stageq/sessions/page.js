"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import ShareLinkModal from "@/components/modals/ShareLinkModal";
import StageQSessionModal from "@/components/modals/StageQSessionModal";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import { useAuth } from "@/contexts/AuthContext";
import { getAllBusinesses } from "@/services/businessService";
import {
    getSessions,
    createSession,
    updateSession,
    deleteSession,
} from "@/services/stageq/stageqSessionService";
import { getEventsByBusinessSlug } from "@/services/eventreg/eventService";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import EventCardBase from "@/components/cards/EventCard";

const translations = {
    en: {
        pageTitle: "Manage Sessions",
        pageDescription: "Create and manage StageQ sessions linked to events.",
        createSession: "Create Session",
        selectBusiness: "Select Business",
        deleteSessionTitle: "Delete Session?",
        deleteSessionMessage: "Are you sure you want to move this item to the Recycle Bin?",
        slugLabel: "Slug:",
        questions: "Questions",
        edit: "Edit",
        delete: "Delete",
        shareTitle: "Share",
        viewQuestions: "View Questions",
        insights: "Insights",
        createdBy: "Created:",
        updatedBy: "Updated:",
        createdAt: "Created At:",
        updatedAt: "Updated At:",
    },
    ar: {
        pageTitle: "إدارة الجلسات",
        pageDescription: "إنشاء وإدارة جلسات StageQ المرتبطة بالفعاليات.",
        createSession: "إنشاء جلسة",
        selectBusiness: "اختر العمل",
        deleteSessionTitle: "حذف الجلسة؟",
        deleteSessionMessage: "هل أنت متأكد من أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
        slugLabel: "المعرف:",
        questions: "الأسئلة",
        edit: "تعديل",
        delete: "حذف",
        shareTitle: "مشاركة",
        viewQuestions: "عرض الأسئلة",
        insights: "التحليلات",
        createdBy: "أنشئ:",
        updatedBy: "حدث:",
        createdAt: "تاريخ الإنشاء:",
        updatedAt: "تاريخ التحديث:",
    },
};

export default function ManageSessionsPage() {
    const router = useRouter();
    const { user, selectedBusiness, setSelectedBusiness } = useAuth();
    const { t, dir, language } = useI18nLayout(translations);

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allBusinesses, setAllBusinesses] = useState([]);
    const [eventRegEvents, setEventRegEvents] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [sessionToShare, setSessionToShare] = useState(null);

    useEffect(() => {
        getAllBusinesses()
            .then(businesses => setAllBusinesses(businesses || []))
            .catch(() => setAllBusinesses([]));
    }, []);

    useEffect(() => {
        if (user?.role === "business" && user.business?.slug && !selectedBusiness) {
            setSelectedBusiness(user.business.slug);
        }
    }, [user, selectedBusiness, setSelectedBusiness]);

    useEffect(() => {
        if (!selectedBusiness) {
            setSessions([]);
            setLoading(false);
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            const [sessionResult, eventsResult] = await Promise.all([
                getSessions(selectedBusiness),
                getEventsByBusinessSlug(selectedBusiness).catch(() => []),
            ]);
            if (!sessionResult?.error) setSessions(Array.isArray(sessionResult) ? sessionResult : []);
            else setSessions([]);
            setEventRegEvents(Array.isArray(eventsResult) ? eventsResult : []);
            setLoading(false);
        };
        fetchData();
    }, [selectedBusiness]);

    const handleOpenCreate = () => {
        setSelectedSession(null);
        setOpenModal(true);
    };

    const handleOpenEdit = (session) => {
        setSelectedSession(session);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedSession(null);
    };

    const handleSubmitSession = async (payload, sessionId) => {
        if (sessionId) {
            const res = await updateSession(sessionId, payload);
            if (!res?.error) {
                setSessions(prev => prev.map(s => s._id === res._id ? res : s));
                handleCloseModal();
            }
        } else {
            const res = await createSession(payload);
            if (!res?.error) {
                setSessions(prev => [...prev, res]);
                handleCloseModal();
            }
        }
    };

    const handleDeleteSession = async () => {
        const res = await deleteSession(sessionToDelete._id);
        if (!res?.error) {
            setSessions(prev => prev.filter(s => s._id !== sessionToDelete._id));
        }
        setConfirmOpen(false);
    };

    // Map session to the shape EventCardBase expects
    const toSessionCard = (session) => {
        const linkedEventId = session.linkedEventRegId?._id || session.linkedEventRegId;
        const linkedEvent = eventRegEvents.find(e => e._id === linkedEventId);
        return {
            ...session,
            name: session.title,
            pollCount: session.questionCount || 0,
            logoUrl: session.logoUrl || null,
        };
    };

    return (
        <Box dir={dir}>
            {(user?.role === "admin" || user?.role === "superadmin") && (
                <BusinessDrawer
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    businesses={allBusinesses}
                    selectedBusinessSlug={selectedBusiness}
                    onSelect={(slug) => { setSelectedBusiness(slug); setDrawerOpen(false); }}
                />
            )}

            <Container maxWidth={false} disableGutters>
                <BreadcrumbsNav />
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "stretch", sm: "center" },
                        mt: 2, mb: 1, gap: 2, flexWrap: "wrap",
                    }}
                >
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" fontWeight="bold">{t.pageTitle}</Typography>
                        <Typography variant="body2" color="text.secondary">{t.pageDescription}</Typography>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, width: { xs: "100%", sm: "auto" } }}>
                        {(user?.role === "admin" || user?.role === "superadmin") && (
                            <Button variant="outlined" onClick={() => setDrawerOpen(true)} startIcon={<BusinessIcon />} sx={getStartIconSpacing(dir)}>
                                {t.selectBusiness}
                            </Button>
                        )}
                        {selectedBusiness && (
                            <Button variant="contained" startIcon={<ICONS.add />} onClick={handleOpenCreate} sx={getStartIconSpacing(dir)}>
                                {t.createSession}
                            </Button>
                        )}
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {!selectedBusiness ? (
                    <EmptyBusinessState />
                ) : loading ? (
                    <Box sx={{ textAlign: "center", mt: 8 }}><CircularProgress /></Box>
                ) : sessions.length === 0 ? (
                    <NoDataAvailable />
                ) : (
                    <Grid container spacing={3} justifyContent="center">
                        {sessions.map(session => (
                            <Grid item xs={12} sm={6} md={4} key={session._id}>
                                <EventCardBase
                                    event={toSessionCard(session)}
                                    t={{ ...t, polls: t.questions, viewPolls: t.viewQuestions }}
                                    status={null}
                                    showRegistrations={false}
                                    showPollCount={true}
                                    hideVenue={true}
                                    hideDates={true}
                                    showAudit={true}
                                    locale={language === "ar" ? "ar-SA" : "en-GB"}
                                    onView={() => router.push(`/cms/modules/stageq/sessions/${session.slug}/questions`)}
                                    onInsights={() => router.push(`/cms/modules/stageq/sessions/${session.slug}/insights`)}
                                    onEdit={() => handleOpenEdit(session)}
                                    onDelete={() => { setSessionToDelete(session); setConfirmOpen(true); }}
                                    onShare={() => { setSessionToShare(session); setShareModalOpen(true); }}
                                    onViewFullScreen={() => window.open(`/stageq/${session.slug}/display`, "_blank")}
                                />
                            </Grid>
                        ))}
                    </Grid>
                )}

                <StageQSessionModal
                    open={openModal}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmitSession}
                    initialValues={selectedSession}
                    selectedBusiness={selectedBusiness}
                />

                <ConfirmationDialog
                    open={confirmOpen}
                    title={t.deleteSessionTitle}
                    message={t.deleteSessionMessage}
                    onClose={() => setConfirmOpen(false)}
                    onConfirm={handleDeleteSession}
                    confirmButtonText={t.delete}
                    confirmButtonIcon={<ICONS.delete />}
                />

                <ShareLinkModal
                    open={shareModalOpen}
                    onClose={() => setShareModalOpen(false)}
                    url={
                        typeof window !== "undefined" && sessionToShare?.slug
                            ? `${window.location.origin}/stageq/${sessionToShare.slug}`
                            : ""
                    }
                    name={sessionToShare?.title}
                    title={t.shareTitle}
                />
            </Container>
        </Box>
    );
}
