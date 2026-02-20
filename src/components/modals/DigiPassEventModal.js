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
    Chip,
    FormControlLabel,
    Checkbox,
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
        createTitle: "Create DigiPass Event",
        editTitle: "Edit DigiPass Event",
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
        uploadProgressImage: "Dashboard Progress Image",
        uploadProgressImageButton: "Upload Progress Image",
        currentProgressImage: "Current:",
        cancel: "Cancel",
        create: "Create Event",
        update: "Save Changes",
        creating: "Creating...",
        updating: "Saving...",
        required: "Please fill all required fields.",
        switchToClassic: "Switch to Classic Fields",
        switchToCustom: "Switch to Custom Fields",
        fieldLabel: "Field Label",
        inputType: "Input Type",
        options: "Options",
        optionPlaceholder: "Type option and press comma",
        requiredField: "Required",
        visibleField: "Visible",
        identityField: "Identity",
        remove: "Remove",
        addField: "Add Field",
        classicFieldsNote:
            "Classic registration fields (fullName, email, phone) will be used.",
        textType: "Text",
        emailType: "Email",
        numberType: "Number",
        phoneType: "Phone",
        radioType: "Radio",
        listType: "List",
        maxTasksPerUser: "Max Tasks Per User",
        minTasksPerUser: "Min Tasks Per User",
        invalidTasks: "Max tasks must be greater than or equal to min tasks.",
        identityFieldsMustBeRequired: "Identity fields must be required. Please check the 'Required' checkbox for all identity fields.",
        customFieldsRequired: "Please add at least one custom field before creating a DigiPass event.",
        deleteMediaTitle: "Delete Media",
        deleteMediaMessage: "Are you sure you want to delete this media? This action cannot be undone.",
        deleteConfirm: "Delete",
    },
    ar: {
        createTitle: "إنشاء فعالية DigiPass",
        editTitle: "تعديل فعالية DigiPass",
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
        uploadProgressImage: "صورة تقدم لوحة التحكم",
        uploadProgressImageButton: "رفع صورة التقدم",
        currentProgressImage: "الحالي:",
        cancel: "إلغاء",
        create: "إنشاء فعالية",
        update: "حفظ التغييرات",
        creating: "جارٍ الإنشاء...",
        updating: "جارٍ الحفظ...",
        required: "يرجى تعبئة جميع الحقول المطلوبة.",
        switchToClassic: "التحويل إلى الحقول الكلاسيكية",
        switchToCustom: "التحويل إلى الحقول المخصصة",
        fieldLabel: "تسمية الحقل",
        inputType: "نوع الإدخال",
        options: "الخيارات",
        optionPlaceholder: "اكتب الخيار واضغط فاصلة",
        requiredField: "إلزامي",
        visibleField: "مرئي",
        identityField: "هوية",
        remove: "إزالة",
        addField: "إضافة حقل",
        classicFieldsNote:
            "سيتم استخدام الحقول الكلاسيكية (الاسم الكامل، البريد الإلكتروني، الهاتف).",
        textType: "نص",
        emailType: "البريد الإلكتروني",
        numberType: "رقم",
        phoneType: "هاتف",
        radioType: "اختيار",
        listType: "قائمة",
        maxTasksPerUser: "الحد الأقصى للمهام لكل مستخدم",
        minTasksPerUser: "الحد الأدنى للمهام لكل مستخدم",
        invalidTasks: "يجب أن يكون الحد الأقصى للمهام أكبر من أو يساوي الحد الأدنى.",
        identityFieldsMustBeRequired: "يجب أن تكون حقول الهوية إلزامية. يرجى تحديد خانة 'إلزامي' لجميع حقول الهوية.",
        customFieldsRequired: "يرجى إضافة حقل مخصص واحد على الأقل قبل إنشاء فعالية DigiPass.",
        deleteMediaTitle: "حذف الوسائط",
        deleteMediaMessage: "هل أنت متأكد من حذف هذه الوسائط؟ لا يمكن التراجع عن هذا الإجراء.",
        deleteConfirm: "حذف",
    },
};

const DigiPassEventModal = ({
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
    const progressImageButtonRef = useRef(null);

    const [buttonWidths, setButtonWidths] = useState({
        logo: null,
        backgroundEn: null,
        backgroundAr: null,
        progressImage: null,
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
        formFields: [],
        defaultLanguage: "en",
        removeLogo: false,
        removeBackgroundEn: false,
        removeBackgroundAr: false,
        progressImage: null,
        progressImagePreview: "",
        removeProgressImage: false,
        maxTasksPerUser: "",
        minTasksPerUser: "",
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
                formFields: (initialValues.formFields || []).map((f) => ({
                    ...f,
                    _temp: "",
                })),
                defaultLanguage: initialValues?.defaultLanguage || "en",
                removeLogo: false,
                removeBackgroundEn: false,
                removeBackgroundAr: false,
                progressImage: null,
                progressImagePreview: initialValues.progressImageUrl || "",
                removeProgressImage: false,
                maxTasksPerUser: initialValues.maxTasksPerUser?.toString() || "",
                minTasksPerUser: initialValues.minTasksPerUser?.toString() || "",
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
                formFields: [],
                defaultLanguage: "en",
                removeLogo: false,
                removeBackgroundEn: false,
                removeBackgroundAr: false,
                progressImage: null,
                progressImagePreview: "",
                removeProgressImage: false,
                maxTasksPerUser: "",
                minTasksPerUser: "",
            }));
        }
    }, [initialValues]);

    useEffect(() => {
        const measureWidths = () => {
            const widths = {
                logo: logoButtonRef.current?.offsetWidth || null,
                backgroundEn: backgroundEnButtonRef.current?.offsetWidth || null,
                backgroundAr: backgroundArButtonRef.current?.offsetWidth || null,
                progressImage: progressImageButtonRef.current?.offsetWidth || null,
            };
            setButtonWidths(widths);
        };

        const timeoutId = setTimeout(measureWidths, 100);

        window.addEventListener("resize", measureWidths);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener("resize", measureWidths);
        };
    }, [formData.logoPreview, formData.backgroundEnPreview, formData.backgroundArPreview, formData.progressImagePreview]);

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
        } else if (name === "progressImage" && files?.[0]) {
            const file = files[0];
            if (file.type.startsWith("image/")) {
                setFormData((prev) => ({
                    ...prev,
                    progressImage: file,
                    progressImagePreview: URL.createObjectURL(file),
                    removeProgressImage: false,
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
            } else if (type === "progressImage") {
                setFormData((prev) => ({
                    ...prev,
                    progressImage: null,
                    progressImagePreview: "",
                    removeProgressImage: false,
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
                deletePayload.eventType = "digipass";
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
            } else if (deleteConfirm.type === "progressImage") {
                setFormData((prev) => ({
                    ...prev,
                    progressImage: null,
                    progressImagePreview: "",
                    removeProgressImage: true,
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

    const handleFormFieldChange = (index, key, value) => {
        const updated = [...formData.formFields];
        updated[index][key] = value;
        setFormData((prev) => ({ ...prev, formFields: updated }));
    };

    const addFormField = () => {
        setFormData((prev) => ({
            ...prev,
            formFields: [
                ...prev.formFields,
                {
                    inputName: "",
                    inputType: "text",
                    values: [],
                    required: false,
                    visible: true,
                    identity: false,
                    _temp: "",
                },
            ],
        }));
    };

    const removeFormField = (index) => {
        const updated = [...formData.formFields];
        updated.splice(index, 1);
        setFormData((prev) => ({ ...prev, formFields: updated }));
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

        if (!initialValues?._id) {
            const hasCustomFields = (formData.formFields || []).some(
                (field) => field.inputName && field.inputName.trim().length > 0
            );
            if (!hasCustomFields) {
                showMessage(t.customFieldsRequired, "error");
                return;
            }
        }

        // Validate tasks
        const maxTasks = formData.maxTasksPerUser ? Number(formData.maxTasksPerUser) : null;
        const minTasks = formData.minTasksPerUser ? Number(formData.minTasksPerUser) : null;

        if (maxTasks !== null && minTasks !== null && maxTasks < minTasks) {
            showMessage(t.invalidTasks, "error");
            return;
        }

        if (maxTasks !== null && maxTasks < 0) {
            showMessage("Max tasks must be a non-negative number", "error");
            return;
        }

        if (minTasks !== null && minTasks < 0) {
            showMessage("Min tasks must be a non-negative number", "error");
            return;
        }

        // Validate that identity fields must be required
        if (formData.formFields && Array.isArray(formData.formFields)) {
            const invalidIdentityFields = formData.formFields.filter(
                (field) => field.identity === true && field.required !== true
            );

            if (invalidIdentityFields.length > 0) {
                showMessage(t.identityFieldsMustBeRequired, "error");
                return;
            }
        }

        setLoading(true);

        try {
            const filesToUpload = [];

            let logoUrl = formData.removeLogo ? null : (formData.logo ? null : (formData.logoPreview || null));
            let backgroundEn = null;
            let backgroundAr = null;
            let progressImageUrl = formData.removeProgressImage ? null : (formData.progressImage ? null : (formData.progressImagePreview || null));

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

            if (formData.progressImage && !formData.removeProgressImage) {
                filesToUpload.push({
                    file: formData.progressImage,
                    type: "progressImage",
                    label: "Dashboard Progress Image",
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
                        moduleName: "DigiPass",
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
                        else if (result.type === "progressImage")
                            progressImageUrl = result.url;
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

            const payload = {
                name: formData.name,
                slug: formData.slug || slugify(formData.name),
                description: formData.description || "",
                defaultLanguage: formData.defaultLanguage,
                logoUrl: formData.removeLogo ? null : logoUrl,
                progressImageUrl: formData.removeProgressImage ? null : progressImageUrl,
                ...(Object.keys(background).length > 0 ? { background } : {}),
                formFields: formData.formFields,
                ...(formData.removeLogo ? { removeLogo: "true" } : {}),
                ...(formData.removeProgressImage ? { removeProgressImage: "true" } : {}),
                ...(formData.removeBackgroundEn ? { removeBackgroundEn: "true" } : {}),
                ...(formData.removeBackgroundAr ? { removeBackgroundAr: "true" } : {}),
                maxTasksPerUser: maxTasks !== null && maxTasks !== "" ? maxTasks : null,
                minTasksPerUser: minTasks !== null && minTasks !== "" ? minTasks : null,
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

                        {/* Tasks Per User */}
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <TextField
                                label={t.minTasksPerUser}
                                name="minTasksPerUser"
                                type="number"
                                value={formData.minTasksPerUser}
                                onChange={handleInputChange}
                                fullWidth
                                inputProps={{ min: 0 }}
                            />
                            <TextField
                                label={t.maxTasksPerUser}
                                name="maxTasksPerUser"
                                type="number"
                                value={formData.maxTasksPerUser}
                                onChange={handleInputChange}
                                fullWidth
                                inputProps={{ min: 0 }}
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

                        {/* Dashboard Progress Image (replaces default brain graphic on participant dashboard) */}
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
                                {t.uploadProgressImage}
                            </Typography>
                            <Button
                                ref={progressImageButtonRef}
                                component="label"
                                variant="outlined"
                                size="small"
                            >
                                {t.uploadProgressImageButton}
                                <input
                                    hidden
                                    name="progressImage"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleInputChange}
                                />
                            </Button>
                            {formData.progressImagePreview && !formData.removeProgressImage && (
                                <Box sx={{ mt: 1.5 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                        {initialValues && !formData.progressImage
                                            ? t.currentProgressImage
                                            : t.preview}
                                    </Typography>
                                    <Box sx={{ position: "relative", display: "inline-block", width: buttonWidths.progressImage || "auto" }}>
                                        <img
                                            src={formData.progressImagePreview}
                                            alt="Progress image preview"
                                            style={{
                                                width: buttonWidths.progressImage ? `${buttonWidths.progressImage}px` : "auto",
                                                maxHeight: 120,
                                                height: "auto",
                                                borderRadius: 6,
                                                objectFit: "cover",
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                const fileUrl = initialValues?.progressImageUrl || formData.progressImagePreview;
                                                handleDeleteMedia("progressImage", fileUrl);
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

                        {/* Custom Form Fields */}
                        {formData.formFields.map((field, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1,
                                    mb: 2,
                                }}
                            >
                                <TextField
                                    label={t.fieldLabel}
                                    value={field.inputName}
                                    onChange={(e) =>
                                        handleFormFieldChange(
                                            index,
                                            "inputName",
                                            e.target.value
                                        )
                                    }
                                    fullWidth
                                />

                                <TextField
                                    label={t.inputType}
                                    select
                                    SelectProps={{ native: true }}
                                    value={field.inputType}
                                    onChange={(e) =>
                                        handleFormFieldChange(
                                            index,
                                            "inputType",
                                            e.target.value
                                        )
                                    }
                                    fullWidth
                                >
                                    {[
                                        { value: "text", label: t.textType },
                                        { value: "email", label: t.emailType },
                                        { value: "number", label: t.numberType },
                                        { value: "phone", label: t.phoneType },
                                        { value: "radio", label: t.radioType },
                                        { value: "list", label: t.listType },
                                    ].map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </TextField>

                                {(field.inputType === "radio" ||
                                    field.inputType === "list") && (
                                        <Box>
                                            <Typography variant="subtitle2">
                                                {t.options}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: 1,
                                                    mb: 1,
                                                }}
                                            >
                                                {field.values.map((option, i) => (
                                                    <Chip
                                                        key={i}
                                                        label={option}
                                                        onDelete={() => {
                                                            const updated = [...field.values];
                                                            updated.splice(i, 1);
                                                            handleFormFieldChange(
                                                                index,
                                                                "values",
                                                                updated
                                                            );
                                                        }}
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                            <TextField
                                                placeholder={t.optionPlaceholder}
                                                value={field._temp || ""}
                                                onChange={(e) => {
                                                    const newValue = e.target.value;
                                                    if (newValue.endsWith(",")) {
                                                        const option = newValue.slice(0, -1).trim();
                                                        if (option && !field.values.includes(option)) {
                                                            const updated = [...field.values, option];
                                                            handleFormFieldChange(
                                                                index,
                                                                "values",
                                                                updated
                                                            );
                                                        }
                                                        handleFormFieldChange(index, "_temp", "");
                                                    } else {
                                                        handleFormFieldChange(index, "_temp", newValue);
                                                    }
                                                }}
                                                fullWidth
                                            />
                                        </Box>
                                    )}

                                <Box
                                    sx={{ display: "flex", alignItems: "center", gap: 2 }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={field.required}
                                                onChange={(e) =>
                                                    handleFormFieldChange(
                                                        index,
                                                        "required",
                                                        e.target.checked
                                                    )
                                                }
                                                color="primary"
                                            />
                                        }
                                        label={t.requiredField}
                                    />

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={field.visible}
                                                onChange={(e) =>
                                                    handleFormFieldChange(
                                                        index,
                                                        "visible",
                                                        e.target.checked
                                                    )
                                                }
                                                color="primary"
                                            />
                                        }
                                        label={t.visibleField}
                                    />

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={field.identity}
                                                onChange={(e) =>
                                                    handleFormFieldChange(
                                                        index,
                                                        "identity",
                                                        e.target.checked
                                                    )
                                                }
                                                color="primary"
                                            />
                                        }
                                        label={t.identityField}
                                    />

                                    <Button
                                        size="small"
                                        variant="text"
                                        color="error"
                                        onClick={() => removeFormField(index)}
                                    >
                                        {t.remove}
                                    </Button>
                                </Box>
                            </Box>
                        ))}
                        <Button onClick={addFormField} variant="outlined" sx={{ mt: 1 }}>
                            {t.addField}
                        </Button>
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
                allowClose={false}
            />

            {/* Confirmation Dialog for Media Deletion */}
            <ConfirmationDialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, type: null, fileUrl: null, index: null })}
                onConfirm={confirmDeleteMedia}
                title={t.deleteMediaTitle}
                message={t.deleteMediaMessage}
                confirmButtonText={t.deleteConfirm}
                confirmButtonIcon={<ICONS.delete />}
                confirmButtonColor="error"
            />
        </>
    );
};

export default DigiPassEventModal;

