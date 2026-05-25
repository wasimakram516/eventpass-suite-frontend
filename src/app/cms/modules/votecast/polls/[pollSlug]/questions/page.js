"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
    Box,
    Container,
    Typography,
    Grid,
    Button,
    CircularProgress,
    Stack,
    IconButton,
    CardContent,
    CardActions,
    Avatar,
    Tooltip,
    Divider,
} from "@mui/material";
import AppCard from "@/components/cards/AppCard";
import { useAuth } from "@/contexts/AuthContext";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import QuestionFormDrawer from "@/components/drawers/QuestionFormDrawer";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import ICONS from "@/utils/iconUtil";
import {
    getPolls,
    getPollQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    cloneQuestion,
    exportQuestionsToExcel,
} from "@/services/votecast/pollService";
import useI18nLayout from "@/hooks/useI18nLayout";
import NoDataAvailable from "@/components/NoDataAvailable";
import RecordMetadata from "@/components/RecordMetadata";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
    en: {
        questionsTitle: 'Questions for "{pollTitle}" poll',
        questionsDescription: "Type: {pollType} | Total Questions: {questionCount}",
        createQuestion: "Create Question",
        edit: "Edit",
        clone: "Clone",
        delete: "Delete",
        deleteQuestionTitle: "Delete Question",
        deleteConfirmation: "Are you sure you want to delete this question?",
        deleteButton: "Delete",
        noQuestions: "No questions yet.",
        option: "Option",
        loading: "Loading...",
        pollNotFound: "Poll not found.",
        exportQuestions: "Export Questions",
        typeRating: "Rating",
        typeNps: "NPS",
        typeText: "Text",
        typeOptions: "Options",
    },
    ar: {
        questionsTitle: 'أسئلة استطلاع "{pollTitle}"',
        questionsDescription: "النوع: {pollType} | إجمالي الأسئلة: {questionCount}",
        createQuestion: "إنشاء سؤال",
        edit: "تحرير",
        clone: "نسخ",
        delete: "حذف",
        deleteQuestionTitle: "حذف السؤال",
        deleteConfirmation: "هل أنت متأكد من حذف هذا السؤال؟",
        deleteButton: "حذف",
        noQuestions: "لا توجد أسئلة بعد.",
        option: "الخيار",
        loading: "جارٍ التحميل...",
        pollNotFound: "الاستطلاع غير موجود.",
        typeRating: "Rating",
        typeNps: "NPS",
        typeText: "Text",
        typeOptions: "خيارات",
    },
};

export default function QuestionsPage() {
    const { pollSlug } = useParams();
    const { user, selectedBusiness } = useAuth();
    const { t, dir, language } = useI18nLayout(translations);

    const [poll, setPoll] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editQuestion, setEditQuestion] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
    const [exportLoading, setExportLoading] = useState(false);

    // Fetch poll + questions
    useEffect(() => {
        if (!pollSlug) return;
        const fetchData = async () => {
            setLoading(true);
            // Find poll by slug using getPolls (businessSlug may not be available, use selected)
            // We get questions directly from getPollQuestions after finding poll ID
            // First, find poll ID via slug by using the polls list if selectedBusiness is set
            // Or use the public slug endpoint
            try {
                const { getPublicPollBySlug } = await import("@/services/votecast/pollService");
                const pollData = await getPublicPollBySlug(pollSlug);
                if (pollData && !pollData.error) {
                    setPoll(pollData);
                    const qData = await getPollQuestions(pollData._id);
                    setQuestions(Array.isArray(qData?.questions) ? qData.questions : []);
                }
            } catch {
                // ignore
            }
            setLoading(false);
        };
        fetchData();
    }, [pollSlug]);

    const handleSubmitQuestion = async (payload, questionId) => {
        if (!poll?._id) return;
        if (questionId) {
            const result = await updateQuestion(poll._id, questionId, payload);
            if (!result?.error) {
                setQuestions(prev => prev.map(q => q._id === questionId ? { ...q, ...result } : q));
                setDrawerOpen(false);
                setEditQuestion(null);
            }
        } else {
            const result = await addQuestion(poll._id, payload);
            if (!result?.error) {
                setQuestions(prev => [...prev, result]);
                setDrawerOpen(false);
                setEditQuestion(null);
            }
        }
    };

    const handleClone = async (questionId) => {
        if (!poll?._id) return;
        const result = await cloneQuestion(poll._id, questionId);
        if (!result?.error) setQuestions(prev => [...prev, result]);
    };

    const handleExport = async () => {
        if (!poll?._id) return;
        setExportLoading(true);
        try {
            await exportQuestionsToExcel(poll._id, poll.slug);
        } catch {
            // ignore
        }
        setExportLoading(false);
    };

    const handleDelete = async () => {
        if (!poll?._id) return;
        await deleteQuestion(poll._id, confirmDelete.id);
        setQuestions(prev => prev.filter(q => q._id !== confirmDelete.id));
        setConfirmDelete({ open: false, id: null });
    };

    if (loading) {
        return (
            <Box sx={{ textAlign: "center", mt: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!poll) {
        return (
            <Container maxWidth={false} disableGutters sx={{ mt: 4 }}>
                <Typography>{t.pollNotFound}</Typography>
            </Container>
        );
    }

    return (
        <Box dir={dir}>
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
                        <Typography variant="h5" sx={{
                            fontWeight: "bold"
                        }}>
                            {t.questionsTitle.replace("{pollTitle}", poll.title)}
                        </Typography>
                        <Typography variant="body2" sx={{
                            color: "text.secondary"
                        }}>
                            {t.questionsDescription
                                .replace("{pollType}", t[`type${poll.type.charAt(0).toUpperCase() + poll.type.slice(1)}`] || poll.type)
                                .replace("{questionCount}", questions.length)}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} sx={{
                        flexWrap: "wrap"
                    }}>
                        <Button
                            variant="contained"
                            startIcon={<ICONS.add />}
                            onClick={() => { setEditQuestion(null); setDrawerOpen(true); }}
                            sx={getStartIconSpacing(dir)}
                        >
                            {t.createQuestion}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={exportLoading ? <CircularProgress size={18} color="inherit" /> : <ICONS.download />}
                            onClick={handleExport}
                            disabled={exportLoading || questions.length === 0}
                            sx={getStartIconSpacing(dir)}
                        >
                            {t.exportQuestions}
                        </Button>
                    </Stack>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {questions.length === 0 ? (
                    <NoDataAvailable />
                ) : (
                    <Grid container spacing={3} sx={{
                        justifyContent: "center"
                    }}>
                        {questions.map((q, idx) => (
                            <Grid
                                key={q._id}
                                sx={{ display: "flex", justifyContent: "center", width: { xs: "100%", sm: 420 } }}
                                size={{
                                    xs: 12,
                                    sm: 6,
                                    md: 4,
                                    lg: 3
                                }}>
                                <AppCard
                                    sx={{
                                        width: { xs: "100%", sm: 420 },
                                        maxWidth: { xs: "100%", sm: 420 },
                                        display: "flex", flexDirection: "column",
                                        position: "relative", p: 0, overflow: "hidden",
                                    }}
                                >
                                    <Box sx={{ px: 2, pt: 2, flexGrow: 1 }}>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            sx={{
                                                alignItems: "center",
                                                mb: 1
                                            }}>
                                            <Avatar sx={{ bgcolor: "primary.main" }}>
                                                <ICONS.poll fontSize="small" />
                                            </Avatar>
                                            <Box sx={{
                                                flexGrow: 1
                                            }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical"
                                                    }}>
                                                    {q.question}
                                                </Typography>
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Typography variant="caption" color="primary" sx={{
                                                        fontWeight: "bold"
                                                    }}>
                                                        {q.type === 'rating' ? t.typeRating : 
                                                        q.type === 'nps' ? t.typeNps : 
                                                        q.type === 'text' ? t.typeText : t.typeOptions}
                                                    </Typography>
                                                    {(q.type === 'rating' || q.type === 'nps') && (
                                                        <Typography variant="caption" sx={{ ml: 1, opacity: 0.8 }}>
                                                            ({q.scale?.min ?? 1}-{q.scale?.max ?? (q.type === 'rating' ? 5 : 10)})
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Stack>

                                        <CardContent sx={{ flexGrow: 1, pt: 1, px: 0, pb: 0 }}>
                                            <Stack spacing={1}>
                                                {(q.options || []).map((opt, optIdx) => (
                                                    <Stack
                                                        key={optIdx}
                                                        direction="row"
                                                        spacing={1}
                                                        sx={{
                                                            alignItems: "center",
                                                            overflow: "hidden",
                                                            gap: dir === "rtl" ? 1 : 0
                                                        }}>
                                                        {opt.imageUrl && (
                                                            <Avatar
                                                                src={opt.imageUrl}
                                                                alt={`Option ${optIdx + 1}`}
                                                                variant="rounded"
                                                                sx={{ width: 40, height: 40 }}
                                                            />
                                                        )}
                                                        {opt.text && (
                                                            <Typography
                                                                variant="body2"
                                                                noWrap
                                                                sx={{
                                                                    color: "text.secondary",
                                                                    flexGrow: 1
                                                                }}>
                                                                {opt.text}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        </CardContent>
                                    </Box>

                                    <RecordMetadata
                                        createdByName={q?.createdBy?.name}
                                        updatedByName={q?.updatedBy?.name}
                                        createdAt={q?.createdAt}
                                        updatedAt={q?.updatedAt}
                                        locale={language === "ar" ? "ar-SA" : "en-GB"}
                                    />

                                    <CardActions
                                        sx={{
                                            justifyContent: "space-around",
                                            borderTop: "1px solid rgba(0,0,0,0.06)",
                                            p: 1, bgcolor: "rgba(0,0,0,0.02)", m: 0,
                                        }}
                                    >
                                        <Tooltip title={t.clone}>
                                            <IconButton
                                                color="warning"
                                                onClick={() => handleClone(q._id)}
                                                sx={{ "&:hover": { transform: "scale(1.1)" }, transition: "0.2s" }}
                                            >
                                                <ICONS.copy />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={t.edit}>
                                            <IconButton
                                                color="warning"
                                                onClick={() => { setEditQuestion(q); setDrawerOpen(true); }}
                                                sx={{ "&:hover": { transform: "scale(1.1)" }, transition: "0.2s" }}
                                            >
                                                <ICONS.edit />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={t.delete}>
                                            <IconButton
                                                color="error"
                                                onClick={() => setConfirmDelete({ open: true, id: q._id })}
                                                sx={{ "&:hover": { transform: "scale(1.1)" }, transition: "0.2s" }}
                                            >
                                                <ICONS.delete />
                                            </IconButton>
                                        </Tooltip>
                                    </CardActions>
                                </AppCard>
                            </Grid>
                        ))}
                    </Grid>
                )}

                <QuestionFormDrawer
                    open={drawerOpen}
                    onClose={() => { setDrawerOpen(false); setEditQuestion(null); }}
                    onSubmit={handleSubmitQuestion}
                    initialValues={editQuestion}
                    businessSlug={selectedBusiness || poll.business}
                    pollId={poll._id}
                />

                <ConfirmationDialog
                    open={confirmDelete.open}
                    onClose={() => setConfirmDelete({ open: false, id: null })}
                    onConfirm={handleDelete}
                    title={t.deleteQuestionTitle}
                    message={t.deleteConfirmation}
                    confirmButtonText={t.deleteButton}
                    confirmButtonIcon={<ICONS.delete fontSize="small" />}
                />
            </Container>
        </Box>
    );
}
