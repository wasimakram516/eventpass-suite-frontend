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
import ShareLinkModal from "@/components/modals/ShareLinkModal";
import PollModal from "@/components/modals/PollModal";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import { useAuth } from "@/contexts/AuthContext";
import { getAllBusinesses } from "@/services/businessService";
import {
    getPolls,
    createPoll,
    updatePoll,
    deletePoll,
    clonePoll,
} from "@/services/votecast/pollService";
import { getEventsByBusinessSlug } from "@/services/eventreg/eventService";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import EventCardBase from "@/components/cards/EventCard";

const translations = {
    en: {
        pageTitle: "Manage Polls",
        pageDescription: "Create and manage polls across all events.",
        createPoll: "Create Poll",
        selectBusiness: "Select Business",
        deletePollTitle: "Delete Poll?",
        deletePollMessage: "Are you sure you want to move this item to the Recycle Bin?",
        slugLabel: "Slug:",
        questions: "Questions",
        edit: "Edit",
        delete: "Delete",
        shareTitle: "Share",
        viewQuestions: "View Questions",
        insights: "Insights",
        viewResults: "View Results",
        createdBy: "Created:",
        updatedBy: "Updated:",
        createdAt: "Created At:",
        updatedAt: "Updated At:",
    },
    ar: {
        pageTitle: "إدارة الاستطلاعات",
        pageDescription: "إنشاء وإدارة الاستطلاعات عبر جميع الفعاليات.",
        createPoll: "إنشاء استطلاع",
        selectBusiness: "اختر العمل",
        deletePollTitle: "حذف الاستطلاع؟",
        deletePollMessage: "هل أنت متأكد من أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
        slugLabel: "المعرف:",
        questions: "الأسئلة",
        edit: "تعديل",
        delete: "حذف",
        shareTitle: "مشاركة",
        viewQuestions: "عرض الأسئلة",
        insights: "التحليلات",
        viewResults: "عرض النتائج",
        createdBy: "أنشئ:",
        updatedBy: "حدث:",
        createdAt: "تاريخ الإنشاء:",
        updatedAt: "تاريخ التحديث:",
    },
};

export default function ManagePollsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, selectedBusiness, setSelectedBusiness } = useAuth();
    const { t, dir, language } = useI18nLayout(translations);

    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allBusinesses, setAllBusinesses] = useState([]);
    const [eventRegEvents, setEventRegEvents] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [selectedPoll, setSelectedPoll] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pollToDelete, setPollToDelete] = useState(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [pollToShare, setPollToShare] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const initialSearch = searchParams.get("search");
        if (initialSearch) setSearchTerm(initialSearch.trim());
    }, [searchParams]);

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
            setPolls([]);
            setLoading(false);
            return;
        }
        const fetchPolls = async () => {
            setLoading(true);
            const [pollResult, eventsResult] = await Promise.all([
                getPolls(selectedBusiness),
                getEventsByBusinessSlug(selectedBusiness).catch(() => []),
            ]);
            if (!pollResult?.error) setPolls(Array.isArray(pollResult) ? pollResult : []);
            else setPolls([]);
            setEventRegEvents(Array.isArray(eventsResult) ? eventsResult : []);
            setLoading(false);
        };
        fetchPolls();
    }, [selectedBusiness]);

    const handleOpenCreate = () => {
        setSelectedPoll(null);
        setOpenModal(true);
    };

    const handleOpenEdit = (poll) => {
        setSelectedPoll(poll);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedPoll(null);
    };

    const handleSubmitPoll = async (payload, pollId) => {
        if (pollId) {
            const res = await updatePoll(pollId, payload);
            if (!res?.error) {
                setPolls(prev => prev.map(p => p._id === res._id ? { ...res, questionCount: p.questionCount } : p));
                handleCloseModal();
            }
        } else {
            const res = await createPoll(payload);
            if (!res?.error) {
                setPolls(prev => [...prev, { ...res, questionCount: 0 }]);
                handleCloseModal();
            }
        }
    };

    const handleDeletePoll = async () => {
        const res = await deletePoll(pollToDelete._id);
        if (!res?.error) {
            setPolls(prev => prev.filter(p => p._id !== pollToDelete._id));
        }
        setConfirmOpen(false);
    };

    const handleClone = async (pollId) => {
        const res = await clonePoll(pollId);
        if (!res?.error) setPolls(prev => [...prev, { ...res, questionCount: res.questions?.length || 0 }]);
    };

    const filteredPolls = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return polls;
        return polls.filter(p =>
            (p.title || "").toLowerCase().includes(term) ||
            (p.slug || "").toLowerCase().includes(term)
        );
    }, [polls, searchTerm]);

    // Map poll to the shape EventCardBase expects
    const toPollCard = (poll) => {
        const linkedEventId = poll.linkedEventRegId?._id || poll.linkedEventRegId;
        const linkedEvent = eventRegEvents.find(e => e._id === linkedEventId);
        return {
            ...poll,
            name: poll.title,
            pollCount: poll.questionCount ?? poll.questions?.length ?? 0,
            logoUrl: linkedEvent?.logoUrl || null,
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

            <Container maxWidth="lg">
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
                                {t.createPoll}
                            </Button>
                        )}
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {!selectedBusiness ? (
                    <EmptyBusinessState />
                ) : loading ? (
                    <Box sx={{ textAlign: "center", mt: 8 }}><CircularProgress /></Box>
                ) : filteredPolls.length === 0 ? (
                    <NoDataAvailable />
                ) : (
                    <Grid container spacing={3} justifyContent="center">
                        {filteredPolls.map(poll => (
                            <Grid item xs={12} sm={6} md={4} key={poll._id}>
                                <EventCardBase
                                    event={toPollCard(poll)}
                                    t={{ ...t, polls: t.questions, viewPolls: t.viewQuestions }}
                                    status={null}
                                    showRegistrations={false}
                                    showPollCount={true}
                                    hideVenue={true}
                                    hideDates={true}
                                    showAudit={true}
                                    locale={language === "ar" ? "ar-SA" : "en-GB"}
                                    onView={() => router.push(`/cms/modules/votecast/polls/${poll.slug}/questions`)}
                                    onViewResults={() => router.push(`/cms/modules/votecast/polls/${poll.slug}/results`)}
                                    onInsights={() => router.push(`/cms/modules/votecast/polls/${poll.slug}/insights`)}
                                    onEdit={() => handleOpenEdit(poll)}
                                    onDelete={() => { setPollToDelete(poll); setConfirmOpen(true); }}
                                    onShare={() => { setPollToShare(poll); setShareModalOpen(true); }}
                                />
                            </Grid>
                        ))}
                    </Grid>
                )}

                <PollModal
                    open={openModal}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmitPoll}
                    initialValues={selectedPoll}
                    selectedBusiness={selectedBusiness}
                />

                <ConfirmationDialog
                    open={confirmOpen}
                    title={t.deletePollTitle}
                    message={t.deletePollMessage}
                    onClose={() => setConfirmOpen(false)}
                    onConfirm={handleDeletePoll}
                    confirmButtonText={t.delete}
                    confirmButtonIcon={<ICONS.delete />}
                />

                <ShareLinkModal
                    open={shareModalOpen}
                    onClose={() => setShareModalOpen(false)}
                    url={
                        typeof window !== "undefined" && pollToShare?.slug
                            ? `${window.location.origin}/votecast/${pollToShare.slug}`
                            : ""
                    }
                    name={pollToShare?.title}
                    title={t.shareTitle}
                />
            </Container>
        </Box>
    );
}
