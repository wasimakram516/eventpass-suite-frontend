"use client";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    Box,
    Typography,
    IconButton,
} from "@mui/material";
import { useState, useEffect, useRef } from "react";
import slugify from "@/utils/slugify";
import { useMessage } from "@/contexts/MessageContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import { uploadMediaFiles } from "@/utils/mediaUpload";
import MediaUploadProgress from "@/components/MediaUploadProgress";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { deleteMedia } from "@/services/deleteMediaService";
import RichTextEditor from "@/components/RichTextEditor";

const translations = {
    en: {
        createTitle: "Create VoteCast Event",
        editTitle: "Edit VoteCast Event",
        name: "Event Name",
        slug: "Slug",
        description: "Description",
        logo: "Upload Event Logo",
        currentImage: "Current Logo:",
        preview: "Preview:",
        uploadBackground: "Upload Background",
        uploadBackgroundEn: "Upload Background (EN)",
        uploadBackgroundAr: "Upload Background (AR)",
        currentBackground: "Current Background:",
        cancel: "Cancel",
        create: "Create Event",
        update: "Save Changes",
        creating: "Creating...",
        updating: "Saving...",
        required: "Please fill all required fields.",
        deleteMediaTitle: "Delete Media",
        deleteMediaMessage: "Are you sure you want to delete this media? This action cannot be undone.",
        deleteConfirm: "Delete",
    },
    ar: {
        createTitle: "إنشاء فعالية VoteCast",
        editTitle: "تعديل فعالية VoteCast",
        name: "اسم الفعالية",
        slug: "المعرف",
        description: "الوصف",
        logo: "رفع شعار الفعالية",
        currentImage: "الشعار الحالي:",
        preview: "معاينة:",
        uploadBackground: "رفع الخلفية",
        uploadBackgroundEn: "رفع الخلفية (إنجليزي)",
        uploadBackgroundAr: "رفع الخلفية (عربي)",
        currentBackground: "الخلفية الحالية:",
        cancel: "إلغاء",
        create: "إنشاء فعالية",
        update: "حفظ التغييرات",
        creating: "جارٍ الإنشاء...",
        updating: "جارٍ الحفظ...",
        required: "يرجى تعبئة جميع الحقول المطلوبة.",
        deleteMediaTitle: "حذف الوسائط",
        deleteMediaMessage: "هل أنت متأكد من حذف هذه الوسائط؟ لا يمكن التراجع عن هذا الإجراء.",
        deleteConfirm: "حذف",
    },
};

const VoteCastEventModal = ({
    open,
    onClose,
    onSubmit,
    initialValues,
    selectedBusiness,
}) => {
    const { t, dir } = useI18nLayout(translations);
    const { showMessage } = useMessage();

    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState([]);
    const [showUploadProgress, setShowUploadProgress] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({
        open: false,
        type: null,
        fileUrl: null,
        index: null,
    });

    const logoButtonRef = useRef(null);
    const backgroundEnButtonRef = useRef(null);
    const backgroundArButtonRef = useRef(null);

    const [buttonWidths, setButtonWidths] = useState({
        logo: null,
        backgroundEn: null,
        backgroundAr: null,
    });

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        logo: null,
        logoPreview: "",
        backgroundEn: null,
        backgroundEnPreview: "",
        backgroundEnFileType: null,
        backgroundAr: null,
        backgroundArPreview: "",
        backgroundArFileType: null,
        defaultLanguage: "en",
        removeLogo: false,
        removeBackgroundEn: false,
        removeBackgroundAr: false,
    });

    useEffect(() => {
        if (initialValues && Object.keys(initialValues).length > 0) {
            setFormData((prev) => ({
                ...prev,
                name: initialValues.name || "",
                slug: initialValues.slug || "",
                description: initialValues.description || "",
                logo: null,
                logoPreview: initialValues.logoUrl || "",
                backgroundEn: null,
                backgroundEnPreview: initialValues.background?.en?.url || "",
                backgroundEnFileType: initialValues.background?.en?.fileType || null,
                backgroundAr: null,
                backgroundArPreview: initialValues.background?.ar?.url || "",
                backgroundArFileType: initialValues.background?.ar?.fileType || null,
                defaultLanguage: initialValues?.defaultLanguage || "en",
                removeLogo: false,
                removeBackgroundEn: false,
                removeBackgroundAr: false,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                name: "",
                slug: "",
                description: "",
                logo: null,
                logoPreview: "",
                backgroundEn: null,
                backgroundEnPreview: "",
                backgroundEnFileType: null,
                backgroundAr: null,
                backgroundArPreview: "",
                backgroundArFileType: null,
                defaultLanguage: "en",
                removeLogo: false,
                removeBackgroundEn: false,
                removeBackgroundAr: false,
            }));
        }
    }, [initialValues]);

    useEffect(() => {
        const measureWidths = () => {
            const widths = {
                logo: logoButtonRef.current?.offsetWidth || null,
                backgroundEn: backgroundEnButtonRef.current?.offsetWidth || null,
                backgroundAr: backgroundArButtonRef.current?.offsetWidth || null,
            };
            setButtonWidths(widths);
        };

        const timeoutId = setTimeout(measureWidths, 100);

        window.addEventListener("resize", measureWidths);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener("resize", measureWidths);
        };
    }, [formData.logoPreview, formData.backgroundEnPreview, formData.backgroundArPreview]);

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "logo" && files?.[0]) {
            const file = files[0];
            if (file.type.startsWith("image/")) {
                setFormData((prev) => ({
                    ...prev,
                    logo: file,
                    logoPreview: URL.createObjectURL(file),
                    removeLogo: false,
                }));
            }
        } else if (name === "backgroundEn" && files?.[0]) {
            const file = files[0];
            if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
                setFormData((prev) => ({
                    ...prev,
                    backgroundEn: file,
                    backgroundEnPreview: URL.createObjectURL(file),
                    backgroundEnFileType: file.type.startsWith("video/") ? "video" : "image",
                    removeBackgroundEn: false,
                }));
            }
        } else if (name === "backgroundAr" && files?.[0]) {
            const file = files[0];
            if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
                setFormData((prev) => ({
                    ...prev,
                    backgroundAr: file,
                    backgroundArPreview: URL.createObjectURL(file),
                    backgroundArFileType: file.type.startsWith("video/") ? "video" : "image",
                    removeBackgroundAr: false,
                }));
            }
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleDeleteMedia = (type, fileUrl, index = null) => {
        if (fileUrl && fileUrl.startsWith("blob:")) {
            if (type === "logo") {
                setFormData((prev) => ({
                    ...prev,
                    logo: null,
                    logoPreview: "",
                    removeLogo: false,
                }));
            } else if (type === "backgroundEn") {
                setFormData((prev) => ({
                    ...prev,
                    backgroundEn: null,
                    backgroundEnPreview: "",
                    backgroundEnFileType: null,
                    removeBackgroundEn: false,
                }));
            } else if (type === "backgroundAr") {
                setFormData((prev) => ({
                    ...prev,
                    backgroundAr: null,
                    backgroundArPreview: "",
                    backgroundArFileType: null,
                    removeBackgroundAr: false,
                }));
            }
            return;
        }

        setDeleteConfirm({
            open: true,
            type,
            fileUrl,
            index,
        });
    };

    const confirmDeleteMedia = async () => {
        try {
            const deletePayload = {
                fileUrl: deleteConfirm.fileUrl,
                storageType: "s3",
            };

            if (initialValues?._id) {
                deletePayload.eventId = initialValues._id;
                deletePayload.eventType = "votecast";
                deletePayload.mediaType = deleteConfirm.type;
            }

            const updatedEvent = await deleteMedia(deletePayload);

            if (deleteConfirm.type === "logo") {
                setFormData((prev) => ({
                    ...prev,
                    logo: null,
                    logoPreview: "",
                    removeLogo: true,
                }));
            } else if (deleteConfirm.type === "backgroundEn") {
                setFormData((prev) => ({
                    ...prev,
                    backgroundEn: null,
                    backgroundEnPreview: "",
                    backgroundEnFileType: null,
                    removeBackgroundEn: true,
                }));
            } else if (deleteConfirm.type === "backgroundAr") {
                setFormData((prev) => ({
                    ...prev,
                    backgroundAr: null,
                    backgroundArPreview: "",
                    backgroundArFileType: null,
                    removeBackgroundAr: true,
                }));
            }

            if (initialValues?._id && updatedEvent && !updatedEvent.error) {
                if (updatedEvent._id) {
                    Object.assign(initialValues, updatedEvent);
                }
            }

            setDeleteConfirm({ open: false, type: null, fileUrl: null, index: null });
            showMessage("Media deleted successfully", "success");
        } catch (err) {
            showMessage(err.message || "Failed to delete media", "error");
        }
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData((prev) => ({ ...prev, name, slug: slugify(name) }));
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            showMessage(t.required, "error");
            return;
        }

        if (!selectedBusiness) {
            showMessage("Business is required", "error");
            return;
        }

        setLoading(true);

        try {
            const filesToUpload = [];

            let logoUrl = formData.removeLogo ? null : (formData.logo ? null : (formData.logoPreview || null));
            let backgroundEn = null;
            let backgroundAr = null;

            if (formData.logo && !formData.removeLogo) {
                filesToUpload.push({
                    file: formData.logo,
                    type: "logo",
                    label: "Logo",
                });
            }

            if (formData.backgroundEn && !formData.removeBackgroundEn) {
                filesToUpload.push({
                    file: formData.backgroundEn,
                    type: "backgroundEn",
                    label: "Background (EN)",
                    fileType: formData.backgroundEnFileType || "image",
                });
            }

            if (formData.backgroundAr && !formData.removeBackgroundAr) {
                filesToUpload.push({
                    file: formData.backgroundAr,
                    type: "backgroundAr",
                    label: "Background (AR)",
                    fileType: formData.backgroundArFileType || "image",
                });
            }

            if (filesToUpload.length > 0) {
                setShowUploadProgress(true);
                const uploads = filesToUpload.map((item) => ({
                    file: item.file,
                    label: item.label,
                    percent: 0,
                    loaded: 0,
                    total: item.file.size,
                    error: null,
                    url: null,
                    type: item.type,
                    fileType: item.fileType,
                }));

                setUploadProgress(uploads);

                try {
                    const urls = await uploadMediaFiles({
                        files: filesToUpload.map((item) => item.file),
                        businessSlug: selectedBusiness,
                        moduleName: "VoteCast",
                        onProgress: (progressUploads) => {
                            progressUploads.forEach((progressUpload, index) => {
                                if (uploads[index]) {
                                    uploads[index].percent = progressUpload.percent;
                                    uploads[index].loaded = progressUpload.loaded;
                                    uploads[index].total = progressUpload.total;
                                    uploads[index].error = progressUpload.error;
                                    uploads[index].url = progressUpload.url;
                                }
                            });
                            setUploadProgress([...uploads]);
                        },
                    });

                    const uploadResults = urls.map((url, index) => ({
                        type: uploads[index].type,
                        url,
                        fileType: uploads[index].fileType,
                    }));

                    uploadResults.forEach((result) => {
                        if (result.type === "logo") logoUrl = result.url;
                        else if (result.type === "backgroundEn")
                            backgroundEn = {
                                url: result.url,
                                fileType: result.fileType || "image",
                            };
                        else if (result.type === "backgroundAr")
                            backgroundAr = {
                                url: result.url,
                                fileType: result.fileType || "image",
                            };
                    });
                } catch (uploadError) {
                    setShowUploadProgress(false);
                    throw uploadError;
                }
            }

            setShowUploadProgress(false);

            const background = {};
            if (formData.removeBackgroundEn) {
                background.en = null;
            } else if (backgroundEn) {
                background.en = backgroundEn;
            } else if (formData.backgroundEnPreview && initialValues?.background?.en) {
                background.en = initialValues.background.en;
            }

            if (formData.removeBackgroundAr) {
                background.ar = null;
            } else if (backgroundAr) {
                background.ar = backgroundAr;
            } else if (formData.backgroundArPreview && initialValues?.background?.ar) {
                background.ar = initialValues.background.ar;
            }

            // Only include background in payload if it has at least one property
            // and ensure we don't send undefined values
            const cleanBackground = {};
            if (background.en !== undefined) {
                cleanBackground.en = background.en;
            }
            if (background.ar !== undefined) {
                cleanBackground.ar = background.ar;
            }

            const payload = {
                name: formData.name,
                slug: formData.slug || slugify(formData.name),
                description: formData.description || "",
                defaultLanguage: formData.defaultLanguage,
                logoUrl: formData.removeLogo ? null : logoUrl,
                ...(Object.keys(cleanBackground).length > 0 ? { background: cleanBackground } : {}),
                ...(formData.removeLogo ? { removeLogo: "true" } : {}),
                ...(formData.removeBackgroundEn ? { removeBackgroundEn: "true" } : {}),
                ...(formData.removeBackgroundAr ? { removeBackgroundAr: "true" } : {}),
            };

            if (!initialValues) {
                payload.businessSlug = selectedBusiness;
            }

            await onSubmit(payload, !!initialValues);
            setLoading(false);
        } catch (error) {
            console.error("Upload or save failed:", error);
            showMessage(error.message || "Failed to upload media", "error");
            setLoading(false);
            setShowUploadProgress(false);
        }
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth dir={dir}>
                <DialogTitle
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontWeight: "bold",
                        px: 3,
                        pt: 3,
                    }}
                >
                    <Typography fontWeight="bold" fontSize="1.25rem">
                        {initialValues ? t.editTitle : t.createTitle}
                    </Typography>

                    <IconButton
                        onClick={onClose}
                        sx={{
                            ml: 2,
                            alignSelf: "flex-start",
                        }}
                    >
                        <ICONS.close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                        <TextField
                            label={`${t.name} *`}
                            name="name"
                            value={formData.name}
                            onChange={handleNameChange}
                            fullWidth
                        />
                        <TextField
                            label={t.slug}
                            name="slug"
                            value={formData.slug}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                {t.description}
                            </Typography>
                            <RichTextEditor
                                value={formData.description}
                                onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                                placeholder={t.description}
                                dir={dir}
                            />
                        </Box>

                        {/* Default Language Selector */}
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            <Box
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        defaultLanguage: prev.defaultLanguage === "en" ? "ar" : "en",
                                    }))
                                }
                                sx={{
                                    width: 64,
                                    height: 32,
                                    borderRadius: 32,
                                    backgroundColor: "background.paper",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    px: 1,
                                    cursor: "pointer",
                                    overflow: "hidden",
                                    boxShadow: `
        2px 2px 6px rgba(0, 0, 0, 0.15),
        -2px -2px 6px rgba(255, 255, 255, 0.5),
        inset 2px 2px 5px rgba(0, 0, 0, 0.2),
        inset -2px -2px 5px rgba(255, 255, 255, 0.7)
      `,
                                    position: "relative",
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 600,
                                        color:
                                            formData.defaultLanguage === "en"
                                                ? "#fff"
                                                : "text.secondary",
                                        zIndex: 2,
                                        transition: "color 0.3s",
                                    }}
                                >
                                    EN
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 600,
                                        color:
                                            formData.defaultLanguage === "ar"
                                                ? "#fff"
                                                : "text.secondary",
                                        zIndex: 2,
                                        transition: "color 0.3s",
                                    }}
                                >
                                    AR
                                </Typography>
                                <Box
                                    sx={{
                                        position: "absolute",
                                        width: 28,
                                        height: 28,
                                        borderRadius: 999,
                                        top: 2,
                                        left: formData.defaultLanguage === "ar" ? 34 : 2,
                                        backgroundColor: "#1976d2",
                                        zIndex: 1,
                                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                                        transition:
                                            "left 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Logo Upload */}
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                            }}
                        >
                            <Button
                                ref={logoButtonRef}
                                component="label"
                                variant="outlined"
                            >
                                {t.logo}
                                <input
                                    hidden
                                    name="logo"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleInputChange}
                                />
                            </Button>

                            {formData.logoPreview && !formData.removeLogo && (
                                <Box sx={{ mt: 1.5 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                        {initialValues && !formData.logo ? t.currentImage : t.preview}
                                    </Typography>

                                    <Box sx={{ position: "relative", display: "inline-block", width: buttonWidths.logo || "auto" }}>
                                        <img
                                            src={formData.logoPreview}
                                            alt="Logo preview"
                                            style={{
                                                width: buttonWidths.logo ? `${buttonWidths.logo}px` : "auto",
                                                maxHeight: 100,
                                                height: "auto",
                                                borderRadius: 6,
                                                objectFit: "cover",
                                            }}
                                        />

                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                const fileUrl = initialValues?.logoUrl || formData.logoPreview;
                                                handleDeleteMedia("logo", fileUrl);
                                            }}
                                            sx={{
                                                position: "absolute",
                                                top: -18,
                                                right: 6,
                                                bgcolor: "error.main",
                                                color: "#fff",
                                                "&:hover": { bgcolor: "error.dark" },
                                            }}
                                        >
                                            <ICONS.delete sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {/* Background Upload */}
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: 2,
                                width: "100%",
                            }}
                        >
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {t.uploadBackground}
                            </Typography>

                            {/* English Background Upload */}
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    width: "100%",
                                }}
                            >
                                <Button
                                    ref={backgroundEnButtonRef}
                                    component="label"
                                    variant="outlined"
                                    size="small"
                                >
                                    {t.uploadBackgroundEn}
                                    <input
                                        hidden
                                        name="backgroundEn"
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={handleInputChange}
                                    />
                                </Button>

                                {formData.backgroundEnPreview && !formData.removeBackgroundEn && (
                                    <Box sx={{ mt: 1.5 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                            {initialValues && !formData.backgroundEn
                                                ? t.currentBackground + " (EN)"
                                                : t.preview + " (EN)"}
                                        </Typography>

                                        <Box sx={{ position: "relative", display: "inline-block", width: buttonWidths.backgroundEn || "auto" }}>
                                            {formData.backgroundEn?.type?.startsWith("video/") ||
                                                formData.backgroundEnFileType === "video" ||
                                                (formData.backgroundEnPreview &&
                                                    !formData.backgroundEnPreview.startsWith("blob:") &&
                                                    (formData.backgroundEnPreview.includes("video") ||
                                                        formData.backgroundEnPreview.match(/\.(mp4|webm|ogg)$/i))) ? (
                                                <video
                                                    src={formData.backgroundEnPreview}
                                                    controls
                                                    style={{
                                                        width: buttonWidths.backgroundEn ? `${buttonWidths.backgroundEn}px` : "auto",
                                                        maxHeight: 200,
                                                        height: "auto",
                                                        borderRadius: 6,
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            ) : (
                                                <img
                                                    src={formData.backgroundEnPreview}
                                                    alt="Background EN preview"
                                                    style={{
                                                        width: buttonWidths.backgroundEn ? `${buttonWidths.backgroundEn}px` : "auto",
                                                        maxHeight: 120,
                                                        height: "auto",
                                                        borderRadius: 6,
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            )}

                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const fileUrl = initialValues?.background?.en?.url || formData.backgroundEnPreview;
                                                    handleDeleteMedia("backgroundEn", fileUrl);
                                                }}
                                                sx={{
                                                    position: "absolute",
                                                    top: -18,
                                                    right: 6,
                                                    bgcolor: "error.main",
                                                    color: "#fff",
                                                    "&:hover": { bgcolor: "error.dark" },
                                                }}
                                            >
                                                <ICONS.delete sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                )}
                            </Box>

                            {/* Arabic Background Upload */}
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    width: "100%",
                                }}
                            >
                                <Button
                                    ref={backgroundArButtonRef}
                                    component="label"
                                    variant="outlined"
                                    size="small"
                                >
                                    {t.uploadBackgroundAr}
                                    <input
                                        hidden
                                        name="backgroundAr"
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={handleInputChange}
                                    />
                                </Button>

                                {formData.backgroundArPreview && !formData.removeBackgroundAr && (
                                    <Box sx={{ mt: 1.5 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                            {initialValues && !formData.backgroundAr
                                                ? t.currentBackground + " (AR)"
                                                : t.preview + " (AR)"}
                                        </Typography>

                                        <Box sx={{ position: "relative", display: "inline-block", width: buttonWidths.backgroundAr || "auto" }}>
                                            {formData.backgroundAr?.type?.startsWith("video/") ||
                                                formData.backgroundArFileType === "video" ||
                                                (formData.backgroundArPreview &&
                                                    !formData.backgroundArPreview.startsWith("blob:") &&
                                                    (formData.backgroundArPreview.includes("video") ||
                                                        formData.backgroundArPreview.match(/\.(mp4|webm|ogg)$/i))) ? (
                                                <video
                                                    src={formData.backgroundArPreview}
                                                    controls
                                                    style={{
                                                        width: buttonWidths.backgroundAr ? `${buttonWidths.backgroundAr}px` : "auto",
                                                        maxHeight: 200,
                                                        height: "auto",
                                                        borderRadius: 6,
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            ) : (
                                                <img
                                                    src={formData.backgroundArPreview}
                                                    alt="Background AR preview"
                                                    style={{
                                                        width: buttonWidths.backgroundAr ? `${buttonWidths.backgroundAr}px` : "auto",
                                                        maxHeight: 120,
                                                        height: "auto",
                                                        borderRadius: 6,
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            )}

                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const fileUrl = initialValues?.background?.ar?.url || formData.backgroundArPreview;
                                                    handleDeleteMedia("backgroundAr", fileUrl);
                                                }}
                                                sx={{
                                                    position: "absolute",
                                                    top: -18,
                                                    right: 6,
                                                    bgcolor: "error.main",
                                                    color: "#fff",
                                                    "&:hover": { bgcolor: "error.dark" },
                                                }}
                                            >
                                                <ICONS.delete sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions
                    sx={{ p: 3, flexDirection: { xs: "column", sm: "row" }, gap: 1 }}
                >
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        color="inherit"
                        disabled={loading}
                        fullWidth
                        startIcon={<ICONS.cancel />}
                    >
                        {t.cancel}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading}
                        startIcon={
                            loading ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                <ICONS.save />
                            )
                        }
                        fullWidth
                    >
                        {loading
                            ? initialValues
                                ? t.updating
                                : t.creating
                            : initialValues
                                ? t.update
                                : t.create}
                    </Button>
                </DialogActions>
            </Dialog>

            <MediaUploadProgress
                open={showUploadProgress}
                uploads={uploadProgress}
                onClose={() => setShowUploadProgress(false)}
            />

            <ConfirmationDialog
                open={deleteConfirm.open}
                title={t.deleteMediaTitle}
                message={t.deleteMediaMessage}
                onClose={() => setDeleteConfirm({ open: false, type: null, fileUrl: null, index: null })}
                onConfirm={confirmDeleteMedia}
                confirmButtonText={t.deleteConfirm}
                confirmButtonIcon={<ICONS.delete />}
            />
        </>
    );
};

export default VoteCastEventModal;

