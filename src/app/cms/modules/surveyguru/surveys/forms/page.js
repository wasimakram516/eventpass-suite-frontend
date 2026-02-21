"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Stack,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Tooltip,
  Chip,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import BusinessDrawer from "@/components/drawers/BusinessDrawer";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import useI18nLayout from "@/hooks/useI18nLayout";
import RecordMetadata from "@/components/RecordMetadata";
import AppCard from "@/components/cards/AppCard";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import ICONS from "@/utils/iconUtil";

import { getAllBusinesses } from "@/services/businessService";
import { getEventsByBusinessId } from "@/services/eventreg/eventService";

import {
  listSurveyForms,
  createSurveyForm,
  updateSurveyForm,
  deleteSurveyForm,
} from "@/services/surveyguru/surveyFormService";
import slugify from "@/utils/slugify";
import { uploadMediaFiles } from "@/utils/mediaUpload";
import MediaUploadProgress from "@/components/MediaUploadProgress";
import { deleteMedia } from "@/services/deleteMediaService";

import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import ShareLinkModal from "@/components/modals/ShareLinkModal";

const translations = {
  en: {
    title: "Manage Survey Forms",
    subtitle: "Select a business to create, edit, and share survey forms.",
    selectBusiness: "Select Business",
    selectEventFilter: "Filter by event",
    allEvents: "All events",
    newForm: "Create Form",
    editForm: "Edit Survey Form",
    createForm: "Create Survey Form",
    copyLink: "Share Public Link",
    linkCopied: "Link copied!",
    delete: "Delete",
    confirmDeleteTitle: "Delete Form",
    confirmDeleteMsg:
      "Are you sure you want to move this item to the Recycle Bin?",
    confirmDeleteBtn: "Delete",
    // form fields
    fTitle: "Title",
    fSlug: "Slug",
    fDesc: "Description",
    fActive: "Active",
    fAnonymous: "Anonymous Responses",
    fEvent: "Event",
    fSelectEventPlaceholder: "Select an event",
    questions: "Questions",
    addQuestion: "Add Question",
    duplicateQuestion: "Duplicate question",
    qText: "Question text",
    qType: "Type",
    qHelp: "Help text",
    qRequired: "Required",
    yes: "Yes",
    no: "No",
    options: "Options",
    addOption: "Add Option",
    optLabel: "Label",
    optImage: "Option image",
    upload: "Upload",
    removeImage: "Remove image",
    min: "Min",
    max: "Max",
    step: "Step",
    removeQuestion: "Remove question",
    cancel: "Cancel",
    save: "Save changes",
    saving: "Saving...",
    updating: "Updating...",
    create: "Create form",
    // validations
    vBusiness: "Please select a business.",
    vEvent: "Please select an event.",
    vTitle: "Title is required.",
    vSlug: "Slug is required.",
    vSlugFormat: "Slug must be URL-friendly (letters, numbers, hyphens).",
    vQuestions: "At least one question is required.",
    vQText: "Question text is required.",
    vQOptions: "Multiple choice needs at least 2 options.",
    vScaleMinMax: "Min must be less than Max.",
    vStepPositive: "Step must be a positive number.",
    createdBy: "Created:",
    createdAt: "Created At:",
    updatedBy: "Updated:",
    updatedAt: "Updated At:",
  },
  ar: {
    title: "إدارة نماذج الاستبيان",
    subtitle: "اختر شركة لإنشاء وتحرير ومشاركة نماذج الاستبيان.",
    selectBusiness: "اختر الشركة",
    selectEventFilter: "تصفية حسب الفعالية",
    allEvents: "جميع الفعاليات",
    newForm: "إنشاء نموذج",
    editForm: "تحرير نموذج الاستبيان",
    createForm: "إنشاء نموذج الاستبيان",
    copyLink: "مشاركة الرابط العام",
    linkCopied: "تم نسخ الرابط!",
    delete: "حذف",
    confirmDeleteTitle: "حذف النموذج",
    confirmDeleteMsg: "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    confirmDeleteBtn: "حذف",
    // form fields
    fTitle: "العنوان",
    fSlug: "المُعرف (Slug)",
    fDesc: "الوصف",
    fActive: "نشط",
    fAnonymous: "ردود مجهولة",
    fEvent: "الفعالية",
    fSelectEventPlaceholder: "اختر فعالية",
    questions: "الأسئلة",
    addQuestion: "إضافة سؤال",
    duplicateQuestion: "تكرار السؤال",
    qText: "نص السؤال",
    qType: "النوع",
    qHelp: "نص المساعدة",
    qRequired: "إلزامي",
    yes: "نعم",
    no: "لا",
    options: "الخيارات",
    addOption: "إضافة خيار",
    optLabel: "التسمية",
    optImage: "صورة الخيار",
    upload: "رفع",
    removeImage: "إزالة الصورة",
    min: "الحد الأدنى",
    max: "الحد الأقصى",
    step: "الخطوة",
    removeQuestion: "إزالة السؤال",
    cancel: "إلغاء",
    save: "حفظ التغييرات",
    saving: "جارٍ الحفظ...",
    updating: "جارٍ التحديث...",
    create: "إنشاء النموذج",
    // validations
    vBusiness: "يرجى اختيار شركة.",
    vEvent: "يرجى اختيار فعالية.",
    vTitle: "العنوان مطلوب.",
    vSlug: "المُعرف مطلوب.",
    vSlugFormat: "يجب أن يكون المُعرف مناسبًا للرابط (حروف، أرقام، وشرطات).",
    vQuestions: "مطلوب سؤال واحد على الأقل.",
    vQText: "نص السؤال مطلوب.",
    vQOptions: "المتعدد يحتاج خيارين على الأقل.",
    vScaleMinMax: "يجب أن يكون الحد الأدنى أقل من الحد الأقصى.",
    vStepPositive: "يجب أن تكون الخطوة رقمًا موجبًا.",
    createdBy: "أنشئ:",
    createdAt: "تاريخ الإنشاء:",
    updatedBy: "حدث:",
    updatedAt: "تاريخ التحديث:",
  },
};

const emptyQuestion = () => ({
  label: "",
  helpText: "",
  type: "multi", // multi | text | rating | nps
  required: true,
  order: 0,
  options: [], // [{label, imageUrl?, imageRemove?}]
  scale: { min: 1, max: 5, step: 1 },
});

export default function SurveyFormsManagePage() {
  const router = useRouter();
  const {
    user,
    selectedBusiness: contextBusinessSlug,
    setSelectedBusiness,
  } = useAuth();
  const { showMessage } = useMessage();
  const { t, dir, language } = useI18nLayout(translations);

  const [bizDrawerOpen, setBizDrawerOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBizSlug, setSelectedBizSlug] = useState(null);

  const [events, setEvents] = useState([]);
  const [eventFilterId, setEventFilterId] = useState("");

  const [forms, setForms] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [questions, setQuestions] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  const [optionFiles, setOptionFiles] = useState({});
  const [optionPreviews, setOptionPreviews] = useState({});
  const previewUrlsRef = useRef({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [formToShare, setFormToShare] = useState(null);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    qi: null,
    oi: null,
    fileUrl: null,
  });

  const [errors, setErrors] = useState({});

  const selectedBusiness = useMemo(
    () => businesses.find((b) => b.slug === selectedBizSlug),
    [businesses, selectedBizSlug]
  );

  // Helpers for previews cleanup
  const setPreviewUrl = (key, url) => {
    // revoke old url (if object URL)
    const prev = previewUrlsRef.current[key];
    if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
    previewUrlsRef.current[key] = url;
    setOptionPreviews((p) => ({ ...p, [key]: url }));
  };

  useEffect(() => {
    return () => {
      // cleanup object urls on unmount
      Object.values(previewUrlsRef.current || {}).forEach((url) => {
        if (typeof url === "string" && url.startsWith("blob:"))
          URL.revokeObjectURL(url);
      });
      previewUrlsRef.current = {};
    };
  }, []);

  const resetBuilder = () => {
    setEditing(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setIsActive(true);
    setIsAnonymous(false);
    setDefaultLanguage("en");
    setQuestions([]);
    setSelectedEventId("");
    setErrors({});
    setOptionFiles({});
    setOptionPreviews({});
    previewUrlsRef.current = {};
  };

  const validate = () => {
    const e = {};
    if (!selectedBusiness?._id) e.business = t.vBusiness;
    if (!selectedEventId) e.event = t.vEvent;

    if (!title?.trim()) e.title = t.vTitle;

    if (!slug?.trim()) e.slug = t.vSlug;
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) e.slug = t.vSlugFormat;

    if (!questions?.length) e.questions = t.vQuestions;

    (questions || []).forEach((q, i) => {
      if (!q.label?.trim()) e[`q_${i}_label`] = t.vQText;

      if (q.type === "multi") {
        const opts = q.options || [];
        if (opts.length < 2 || opts.some((o) => !o.label?.trim())) {
          e[`q_${i}_options`] = t.vQOptions;
        }
      }

      if (q.type === "rating" || q.type === "nps") {
        const { min, max, step } = q.scale || {};
        if (!(min < max)) e[`q_${i}_scale_mm`] = t.vScaleMinMax;
        if (!(Number(step) > 0)) e[`q_${i}_scale_step`] = t.vStepPositive;
      }
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const fetchBusinesses = async () => {
    const list = await getAllBusinesses();
    setBusinesses(list || []);
    if (contextBusinessSlug) {
      setSelectedBizSlug(contextBusinessSlug);
    } else if (user?.role === "business" && user.business?.slug) {
      const slug = user.business.slug;
      setSelectedBizSlug(slug);
      setSelectedBusiness(slug);
    }
  };

  const fetchEvents = async (bizId) => {
    if (!bizId) return setEvents([]);
    const ev = await getEventsByBusinessId(bizId);

    setEvents(ev.events || []);
  };

  const fetchForms = async () => {
    if (!selectedBusiness?._id) return setForms([]);
    setLoading(true);
    const res = await listSurveyForms({
      businessId: selectedBusiness._id,
      withCounts: 1,
      ...(eventFilterId ? { eventId: eventFilterId } : {}),
    });
    const all = res?.data || res || [];
    setForms(all);
    setLoading(false);
  };

  useEffect(() => {
    fetchBusinesses();
  }, [user, contextBusinessSlug, setSelectedBusiness]);

  useEffect(() => {
    if (selectedBusiness?._id) {
      fetchEvents(selectedBusiness._id);
      fetchForms();
    } else {
      setEvents([]);
      setForms([]);
    }
    setEventFilterId("");
  }, [selectedBizSlug]);

  useEffect(() => {
    if (selectedBusiness?._id) fetchForms();
  }, [eventFilterId]);

  const openCreate = () => {
    resetBuilder();
    setOpen(true);
  };

  const openEdit = (form) => {
    const latestForm = forms.find((f) => f._id === form._id) || form;
    resetBuilder();
    setEditing(latestForm);
    setTitle(latestForm.title || "");
    setSlug(latestForm.slug || "");
    setDescription(latestForm.description || "");
    setIsActive(!!latestForm.isActive);
    setIsAnonymous(!!latestForm.isAnonymous);
    setDefaultLanguage(latestForm.defaultLanguage || "en");

    const evId = latestForm.eventId?._id || latestForm.eventId || "";
    setSelectedEventId(evId);

    const qs = (latestForm.questions || []).map((q, idx) => ({
      label: q.label || "",
      helpText: q.helpText || "",
      type: q.type || "milti",
      required: !!q.required,
      order: idx,
      options: (q.options || []).map((o) => ({
        label: o.label || "",
        imageUrl: o.imageUrl || null,
      })),
      scale:
        q.type === "rating"
          ? q.scale || { min: 1, max: 5, step: 1 }
          : q.type === "nps"
            ? q.scale || { min: 0, max: 10, step: 1 }
            : { min: 1, max: 5, step: 1 },
    }));
    setQuestions(qs);

    // create preview map from existing imageUrl
    const previews = {};
    qs.forEach((q, qi) => {
      (q.options || []).forEach((o, oi) => {
        if (o.imageUrl) previews[`${qi}:${oi}`] = o.imageUrl;
      });
    });
    setOptionPreviews(previews);

    setOpen(true);
  };

  const duplicateQuestion = (idx) =>
    setQuestions((prev) => {
      const dupe = JSON.parse(JSON.stringify(prev[idx])); // deep clone
      return [...prev.slice(0, idx + 1), dupe, ...prev.slice(idx + 1)];
    });

  const addQuestion = () => setQuestions((p) => [...p, emptyQuestion()]);
  const updateQuestion = (idx, patch) =>
    setQuestions((p) => p.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  const removeQuestion = (idx) => {
    // clean related previews/files
    const q = questions[idx];
    (q.options || []).forEach((_, oi) => {
      const key = `${idx}:${oi}`;
      if (optionFiles[key]) {
        const of = optionFiles[key];
        delete optionFiles[key];
        URL.revokeObjectURL(optionPreviews[key]);
      }
      delete optionPreviews[key];
    });
    setQuestions((p) => p.filter((_, i) => i !== idx));
    setOptionFiles({ ...optionFiles });
    setOptionPreviews({ ...optionPreviews });
  };

  const addOption = (qi) =>
    setQuestions((p) =>
      p.map((q, i) =>
        i === qi
          ? {
            ...q,
            options: [...(q.options || []), { label: "", imageUrl: null }],
          }
          : q
      )
    );

  const updateOption = (qi, oi, patch) =>
    setQuestions((p) =>
      p.map((q, i) => {
        if (i !== qi) return q;
        const opts = [...(q.options || [])];
        opts[oi] = { ...opts[oi], ...patch };
        return { ...q, options: opts };
      })
    );

  const removeOption = (qi, oi) => {
    const key = `${qi}:${oi}`;
    if (optionFiles[key]) {
      delete optionFiles[key];
    }
    if (optionPreviews[key]) {
      const prev = optionPreviews[key];
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      delete optionPreviews[key];
    }
    setOptionFiles({ ...optionFiles });
    setOptionPreviews({ ...optionPreviews });

    setQuestions((p) =>
      p.map((q, i) => {
        if (i !== qi) return q;
        const newOpts = (q.options || []).filter((_, j) => j !== oi);
        return { ...q, options: newOpts };
      })
    );
  };

  const onPickOptionFile = (qi, oi, file) => {
    const key = `${qi}:${oi}`;
    setOptionFiles((p) => ({ ...p, [key]: file }));
    const url = URL.createObjectURL(file);
    setPreviewUrl(key, url);

    // clear any removal flag
    updateOption(qi, oi, { imageRemove: false });
  };

  const handleDeleteOptionImage = (qi, oi, fileUrl) => {
    if (fileUrl && fileUrl.startsWith("blob:")) {
      const key = `${qi}:${oi}`;
      // remove local file & preview
      if (optionFiles[key]) {
        delete optionFiles[key];
        setOptionFiles({ ...optionFiles });
      }
      if (optionPreviews[key]) {
        const prev = optionPreviews[key];
        if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        delete optionPreviews[key];
        setOptionPreviews({ ...optionPreviews });
      }
      updateOption(qi, oi, { imageUrl: null, imageRemove: false });
      return;
    }

    setDeleteConfirm({
      open: true,
      qi,
      oi,
      fileUrl,
    });
  };

  const confirmDeleteOptionImage = async () => {
    try {
      const { qi, oi, fileUrl } = deleteConfirm;
      const formId = editing?._id;

      if (formId && fileUrl) {
        const updatedForm = await deleteMedia({
          fileUrl,
          storageType: "s3",
          formId,
          mediaType: "optionImage",
          questionIndex: qi,
          optionIndex: oi,
        });

        if (updatedForm && !updatedForm.error) {
          setEditing(updatedForm);
          setForms((prev) =>
            prev.map((f) => (f._id === formId ? updatedForm : f))
          );
        }
      }

      const key = `${qi}:${oi}`;
      if (optionPreviews[key]) {
        const prev = optionPreviews[key];
        if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        delete optionPreviews[key];
        setOptionPreviews({ ...optionPreviews });
      }
      updateOption(qi, oi, { imageUrl: null, imageRemove: true });

      setDeleteConfirm({ open: false, qi: null, oi: null, fileUrl: null });
      showMessage("Image deleted successfully", "success");
    } catch (err) {
      showMessage(err.message || "Failed to delete image", "error");
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!selectedBusiness?.slug) {
      showMessage("Business information is missing. Please refresh the page and try again.", "error");
      return;
    }

    setSaving(true);

    try {
      const filesToUpload = [];
      const fileKeyMap = {};

      Object.entries(optionFiles).forEach(([key, file]) => {
        const [qi, oi] = key.split(":");
        filesToUpload.push({
          file,
          type: "optionImage",
          label: `Q${qi} Option ${oi}`,
        });
        fileKeyMap[filesToUpload.length - 1] = { qi: parseInt(qi), oi: parseInt(oi) };
      });

      let uploadedUrls = {};

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
        }));

        setUploadProgress(uploads);

        try {
          const urls = await uploadMediaFiles({
            files: filesToUpload.map((item) => item.file),
            businessSlug: selectedBusiness.slug,
            moduleName: "SurveyGuru",
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

          urls.forEach((url, index) => {
            const { qi, oi } = fileKeyMap[index];
            if (qi !== undefined && oi !== undefined) {
              uploadedUrls[`${qi}:${oi}`] = url;
            }
          });
        } catch (uploadError) {
          setShowUploadProgress(false);
          throw uploadError;
        }
      }

      setShowUploadProgress(false);

      const qs = (questions || []).map((q, qi) => ({
        label: q.label.trim(),
        helpText: q.helpText?.trim() || "",
        type: q.type,
        required: !!q.required,
        order: qi,
        options: (q.options || []).map((o, oi) => {
          const key = `${qi}:${oi}`;
          let imageUrl = o.imageUrl || null;

          if (uploadedUrls[key]) {
            imageUrl = uploadedUrls[key];
          } else if (o.imageRemove) {
            imageUrl = null;
          } else if (!imageUrl && optionPreviews[key] && !optionPreviews[key].startsWith("blob:")) {
            imageUrl = optionPreviews[key];
          }

          return {
            label: o.label?.trim() || "",
            imageUrl,
            imageRemove: !!o.imageRemove,
          };
        }),
        scale:
          q.type === "rating"
            ? {
              min: Number(q.scale?.min ?? 1),
              max: Number(q.scale?.max ?? 5),
              step: Number(q.scale?.step ?? 1),
            }
            : q.type === "nps"
              ? {
                min: Number(q.scale?.min ?? 0),
                max: Number(q.scale?.max ?? 10),
                step: Number(q.scale?.step ?? 1),
              }
              : { min: 1, max: 5, step: 1 },
      }));

      const payload = {
        businessId: selectedBusiness._id,
        eventId: selectedEventId || "",
        title: title.trim(),
        slug: slug.trim(),
        description: description || "",
        isActive: !!isActive,
        isAnonymous: !!isAnonymous,
        defaultLanguage,
        questions: qs,
      };

      let result;
      if (editing?._id) {
        result = await updateSurveyForm(editing._id, payload);
      } else {
        result = await createSurveyForm(payload);
      }

      if (!result?.error) {
        setOpen(false);
        resetBuilder();
        fetchForms();
      }
    } catch (error) {
      console.error("Save failed:", error);
      showMessage(error.message || "Failed to save form", "error");
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    const id = confirmDelete.id;
    if (!id) return setConfirmDelete({ open: false, id: null });
    const res = await deleteSurveyForm(id);
    if (!res?.error) {
      setForms((prev) => prev.filter((f) => f._id !== id));
    }
    setConfirmDelete({ open: false, id: null });
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.only("xs"));

  return (
    <Box dir={dir} sx={{ minHeight: "100vh" }}>
      <BusinessDrawer
        open={bizDrawerOpen}
        onClose={() => setBizDrawerOpen(false)}
        businesses={businesses}
        selectedBusinessSlug={selectedBizSlug}
        onSelect={(slug) => {
          setSelectedBizSlug(slug);
          setSelectedBusiness(slug);
          setBizDrawerOpen(false);
        }}
      />

      <Container maxWidth="lg">
        <BreadcrumbsNav />

        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            rowGap: 2,
            mt: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {t.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {t.subtitle}
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={dir === "rtl" ? 1 : 1}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <Button
              fullWidth={isMobile}
              sx={
                isMobile
                  ? { width: "100%", ...getStartIconSpacing(dir) }
                  : { ...getStartIconSpacing(dir) }
              }
              variant="outlined"
              startIcon={<ICONS.business fontSize="small" />}
              onClick={() => setBizDrawerOpen(true)}
            >
              {t.selectBusiness}
            </Button>

            {selectedBusiness?._id && (
              <FormControl
                fullWidth={isMobile}
                size="large"
                sx={{
                  minWidth: 220,
                  maxWidth: { xs: "100%", sm: 300 },
                  ...(isMobile && { width: "100%" }),
                  "& .MuiInputBase-root": {
                    ...(dir === "rtl" && { mr: 1 }),
                  },
                }}
              >
                <InputLabel>{t.selectEventFilter}</InputLabel>
                <Select
                  label={t.selectEventFilter}
                  value={eventFilterId}
                  onChange={(e) => setEventFilterId(e.target.value)}
                >
                  <MenuItem value="">{t.allEvents}</MenuItem>
                  {events.map((ev) => (
                    <MenuItem key={ev._id} value={ev._id}>
                      {ev.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {selectedBusiness && (
              <Button
                fullWidth={isMobile}
                sx={
                  isMobile
                    ? { width: "100%", ...getStartIconSpacing(dir) }
                    : { ...getStartIconSpacing(dir) }
                }
                variant="contained"
                startIcon={<ICONS.add fontSize="small" />}
                onClick={openCreate}
                disabled={!selectedBusiness?._id}
              >
                {t.newForm}
              </Button>
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Content states */}
        {!selectedBusiness?._id ? (
          <EmptyBusinessState />
        ) : loading ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : !forms.length ? (
          <NoDataAvailable />
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {forms.map((f) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={f._id}>
                <AppCard
                  sx={{
                    width: "100%",
                    maxWidth: 420,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    p: 1,
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack
                      direction="row"
                      spacing={dir === "rtl" ? 1.5 : 1}
                      alignItems="center"
                      mb={1}
                    >
                      <Avatar
                        sx={{
                          bgcolor: f.isActive ? "success.main" : "grey.500",
                        }}
                      >
                        <ICONS.form fontSize="small" />
                      </Avatar>
                      <Box sx={dir === "rtl" ? { mr: 1.5 } : { ml: 1 }} />
                      <Stack flex={1} overflow="hidden">
                        <Typography variant="subtitle1" fontWeight={600} noWrap>
                          {f.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {f.slug}
                        </Typography>
                      </Stack>
                      <Chip
                        label={f.isActive ? "Active" : "Inactive"}
                        size="small"
                        color={f.isActive ? "success" : "default"}
                      />
                      {f.isAnonymous && (
                        <Chip
                          label="Anonymous"
                          size="small"
                          color="warning"
                          sx={{
                            ml: dir === "rtl" ? 0 : 1,
                            mr: dir === "rtl" ? 1 : 0,
                          }}
                        />
                      )}
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {f.description || "—"}
                    </Typography>
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      <Stack direction="row" alignItems="center">
                        <ICONS.help fontSize="inherit" />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={dir === "rtl" ? { mr: 1 } : { ml: 1 }}
                        >
                          {f.questions?.length || 0} question(s)
                        </Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center">
                        <ICONS.people fontSize="inherit" />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={dir === "rtl" ? { mr: 1 } : { ml: 1 }}
                        >
                          {f.recipientCount ?? 0} recipient(s)
                        </Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center">
                        <ICONS.results fontSize="inherit" />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={dir === "rtl" ? { mr: 1 } : { ml: 1 }}
                        >
                          {f.responseCount ?? 0} response(s)
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>

                  <RecordMetadata
                    createdByName={f.createdBy}
                    updatedByName={f.updatedBy}
                    createdAt={f.createdAt}
                    updatedAt={f.updatedAt}
                    locale={language === "ar" ? "ar-SA" : "en-GB"}
                  />

                  <CardActions sx={{ justifyContent: "center" }}>
                    <Tooltip title={t.copyLink}>
                      <IconButton
                        onClick={() => {
                          setFormToShare(f);
                          setShareModalOpen(true);
                        }}
                      >
                        <ICONS.share />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={t.editForm}>
                      <IconButton color="primary" onClick={() => openEdit(f)}>
                        <ICONS.edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t.delete}>
                      <IconButton
                        color="error"
                        onClick={() =>
                          setConfirmDelete({ open: true, id: f._id })
                        }
                      >
                        <ICONS.delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View responses">
                      <IconButton
                        onClick={() =>
                          router.push(
                            `/cms/modules/surveyguru/surveys/forms/${f.slug}/responses`
                          )
                        }
                      >
                        <ICONS.results fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t.insights || "Insights"}>
                      <IconButton
                        color="info"
                        onClick={() =>
                          router.push(
                            `/cms/modules/surveyguru/surveys/forms/${f.slug}/insights`
                          )
                        }
                      >
                        <ICONS.insights fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </AppCard>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Delete dialog */}
        <ConfirmationDialog
          open={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false, id: null })}
          onConfirm={handleDelete}
          title={t.confirmDeleteTitle}
          message={t.confirmDeleteMsg}
          confirmButtonText={t.confirmDeleteBtn}
          confirmButtonIcon={<ICONS.delete fontSize="small" />}
        />
      </Container>

      {/* Create/Edit Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editing ? t.editForm : t.createForm}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="large">
              <Select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">{t.fSelectEventPlaceholder}</MenuItem>
                {events.map((ev) => (
                  <MenuItem key={ev._id} value={ev._id}>
                    {ev.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.event && (
                <Typography variant="caption" color="error">
                  {errors.event}
                </Typography>
              )}
            </FormControl>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t.fTitle}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editing) setSlug(slugify(e.target.value));
                }}
                fullWidth
                error={!!errors.title}
                helperText={errors.title}
              />
              <TextField
                label={t.fSlug}
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                fullWidth
                error={!!errors.slug}
                helperText={errors.slug}
              />
            </Stack>

            <TextField
              label={t.fDesc}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />

            {/* Default Language Selector */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box
                onClick={() =>
                  setDefaultLanguage((prev) => (prev === "en" ? "ar" : "en"))
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
                    color: defaultLanguage === "en" ? "#fff" : "text.secondary",
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
                    color: defaultLanguage === "ar" ? "#fff" : "text.secondary",
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
                    borderRadius: "50%",
                    top: 2,
                    left: defaultLanguage === "ar" ? 34 : 2,
                    backgroundColor: "#1976d2",
                    zIndex: 1,
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                    transition:
                      "left 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                  }}
                />
              </Box>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
              }
              label={t.fActive}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
              }
              label={t.fAnonymous}
            />
            <Divider sx={{ my: 1 }} />

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {t.questions}
              </Typography>
            </Stack>
            {errors.questions && (
              <Typography variant="caption" color="error">
                {errors.questions}
              </Typography>
            )}

            <Stack spacing={2}>
              {questions.map((q, qi) => (
                <Card key={qi} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={{ xs: 0, sm: 2 }}
                    >
                      <TextField
                        label={t.qText}
                        value={q.label}
                        onChange={(e) =>
                          updateQuestion(qi, { label: e.target.value })
                        }
                        fullWidth
                        error={!!errors[`q_${qi}_label`]}
                        helperText={errors[`q_${qi}_label`] || " "}
                      />
                      <TextField
                        label={t.qType}
                        value={q.type}
                        onChange={(e) => {
                          const type = e.target.value;
                          const scale =
                            type === "rating"
                              ? { min: 1, max: 5, step: 1 }
                              : type === "nps"
                                ? { min: 0, max: 10, step: 1 }
                                : { min: 1, max: 5, step: 1 };
                          const resetOptions =
                            type === "multi" ? q.options : [];
                          updateQuestion(qi, {
                            type,
                            scale,
                            options: resetOptions,
                          });
                        }}
                        select
                        fullWidth
                      >
                        <MenuItem value="multi">Multiple choice</MenuItem>
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="rating">Rating (1-5)</MenuItem>
                        <MenuItem value="nps">NPS (0-10)</MenuItem>
                      </TextField>
                    </Stack>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={{ xs: 0, sm: 2 }}
                      alignItems={{ sm: "center" }}
                      sx={{ mt: { xs: 4, sm: 0 } }}
                    >
                      <TextField
                        label={t.qHelp}
                        value={q.helpText}
                        onChange={(e) =>
                          updateQuestion(qi, { helpText: e.target.value })
                        }
                        fullWidth
                      />
                      <FormControlLabel
                        sx={{ ml: { sm: 1 } }}
                        control={
                          <Switch
                            checked={!!q.required}
                            onChange={(e) =>
                              updateQuestion(qi, { required: e.target.checked })
                            }
                          />
                        }
                        label={t.qRequired}
                      />
                    </Stack>

                    {q.type === "multi" && (
                      <>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Typography variant="subtitle2">
                            {t.options}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<ICONS.add fontSize="small" />}
                            onClick={() => addOption(qi)}
                          >
                            {t.addOption}
                          </Button>
                        </Stack>
                        {errors[`q_${qi}_options`] && (
                          <Typography variant="caption" color="error">
                            {errors[`q_${qi}_options`]}
                          </Typography>
                        )}

                        <Stack spacing={1} sx={{ mb: 5 }}>
                          {(q.options || []).map((opt, oi) => {
                            const key = `${qi}:${oi}`;
                            const preview = optionPreviews[key] || null;
                            return (
                              <Stack
                                key={oi}
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                alignItems="center"
                              >
                                <Box sx={{ position: "relative", display: "inline-block" }}>
                                  <Avatar
                                    variant="rounded"
                                    sx={{ width: 48, height: 48 }}
                                  >
                                    {preview ? (
                                      <img
                                        alt="opt"
                                        src={preview}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                      />
                                    ) : (
                                      <ICONS.image fontSize="small" />
                                    )}
                                  </Avatar>
                                  {preview && (
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        const fileUrl = opt.imageUrl || preview;
                                        handleDeleteOptionImage(qi, oi, fileUrl);
                                      }}
                                      sx={{
                                        position: "absolute",
                                        top: -8,
                                        right: -8,
                                        bgcolor: "error.main",
                                        color: "#fff",
                                        width: 20,
                                        height: 20,
                                        "&:hover": { bgcolor: "error.dark" },
                                      }}
                                    >
                                      <ICONS.delete sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  )}
                                </Box>

                                <TextField
                                  label={t.optLabel}
                                  value={opt.label}
                                  onChange={(e) =>
                                    updateOption(qi, oi, {
                                      label: e.target.value,
                                    })
                                  }
                                  fullWidth
                                />

                                <input
                                  id={`file-${key}`}
                                  type="file"
                                  accept="image/*"
                                  style={{ display: "none" }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) onPickOptionFile(qi, oi, file);
                                    e.target.value = "";
                                  }}
                                />
                                <label htmlFor={`file-${key}`}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    component="span"
                                    startIcon={
                                      <ICONS.upload fontSize="small" />
                                    }
                                    sx={{ mt: 1.5 }}
                                  >
                                    {t.upload}
                                  </Button>
                                </label>

                                <IconButton
                                  color="error"
                                  onClick={() => removeOption(qi, oi)}
                                >
                                  <ICONS.delete fontSize="small" />
                                </IconButton>
                              </Stack>
                            );
                          })}
                        </Stack>
                      </>
                    )}

                    {/* Add extra spacing for rating/NPS questions */}
                    {(q.type === "rating" || q.type === "nps") && (
                      <Box sx={{ height: 10 }} />
                    )}

                    {(q.type === "rating" || q.type === "nps") && (
                      <>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={{ xs: 1, sm: 2 }}
                          sx={{ mt: 3, mb: 2 }}
                        >
                          <TextField
                            label={t.min}
                            type="number"
                            value={
                              q.scale?.min ?? (q.type === "rating" ? 1 : 0)
                            }
                            onChange={(e) =>
                              updateQuestion(qi, {
                                scale: {
                                  ...q.scale,
                                  min: Number(e.target.value),
                                },
                              })
                            }
                            fullWidth
                            error={!!errors[`q_${qi}_scale_mm`]}
                          />
                          <TextField
                            label={t.max}
                            type="number"
                            value={
                              q.scale?.max ?? (q.type === "rating" ? 5 : 10)
                            }
                            onChange={(e) =>
                              updateQuestion(qi, {
                                scale: {
                                  ...q.scale,
                                  max: Number(e.target.value),
                                },
                              })
                            }
                            fullWidth
                            error={!!errors[`q_${qi}_scale_mm`]}
                            helperText={errors[`q_${qi}_scale_mm`] || " "}
                          />
                          <TextField
                            label={t.step}
                            type="number"
                            value={q.scale?.step ?? 1}
                            onChange={(e) =>
                              updateQuestion(qi, {
                                scale: {
                                  ...q.scale,
                                  step: Number(e.target.value),
                                },
                              })
                            }
                            fullWidth
                            error={!!errors[`q_${qi}_scale_step`]}
                            helperText={errors[`q_${qi}_scale_step`] || " "}
                          />
                        </Stack>
                      </>
                    )}

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="flex-end"
                      alignItems={{ xs: "stretch", sm: "center" }}
                      sx={{ mt: 1 }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <Tooltip title={t.duplicateQuestion}>
                          <IconButton onClick={() => duplicateQuestion(qi)}>
                            <ICONS.copy fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={t.removeQuestion}>
                          <IconButton
                            color="error"
                            onClick={() => removeQuestion(qi)}
                          >
                            <ICONS.delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
              <Button
                variant="outlined"
                startIcon={<ICONS.add fontSize="small" />}
                onClick={addQuestion}
              >
                {t.addQuestion}
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpen(false)}
            variant="outlined"
            startIcon={<ICONS.cancel fontSize="small" />}
            sx={getStartIconSpacing(dir)}
            disabled={saving}
          >
            {t.cancel}
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={
              saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <ICONS.save fontSize="small" />
              )
            }
            sx={getStartIconSpacing(dir)}
            disabled={saving}
          >
            {saving
              ? editing
                ? t.updating
                : t.saving
              : editing
                ? t.save
                : t.create}
          </Button>
        </DialogActions>
      </Dialog>

      <ShareLinkModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        url={
          typeof window !== "undefined" && formToShare?.slug
            ? `${window.location.origin}/surveyguru/${formToShare.defaultLanguage}/${formToShare.slug}`
            : ""
        }
        name={formToShare?.title || "survey-form"}
        title={t.copyLink}
      />

      <MediaUploadProgress
        open={showUploadProgress}
        uploads={uploadProgress}
        onClose={() => {
          if (uploadProgress.every((u) => u.percent === 100 || u.error)) {
            setShowUploadProgress(false);
          }
        }}
        allowClose={uploadProgress.every((u) => u.percent === 100 || u.error)}
      />

      <ConfirmationDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, qi: null, oi: null, fileUrl: null })}
        onConfirm={confirmDeleteOptionImage}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
      />
    </Box>
  );
}
