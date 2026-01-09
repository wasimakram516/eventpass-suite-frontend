"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Box,
  Typography,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
  Grid,
  Paper,
  Tooltip,
} from "@mui/material";
import { useState, useEffect, useRef } from "react";
import slugify from "@/utils/slugify";
import { useMessage } from "@/contexts/MessageContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import { uploadMediaFiles, uploadSingleFile } from "@/utils/mediaUpload";
import MediaUploadProgress from "@/components/MediaUploadProgress";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { deleteMedia } from "@/services/deleteMediaService";
import RichTextEditor from "@/components/RichTextEditor";
import CountryCodeSelector from "@/components/CountryCodeSelector";
import { DEFAULT_ISO_CODE, DEFAULT_COUNTRY_CODE, getCountryCodeByIsoCode, COUNTRY_CODES } from "@/utils/countryCodes";
import { validatePhoneNumber } from "@/utils/phoneValidation";

const translations = {
  en: {
    createTitle: "Create Event",
    editTitle: "Edit Event",
    name: "Event Name",
    slug: "Slug",
    startDate: "Start Date",
    endDate: "End Date",
    venue: "Venue",
    description: "Description",
    capacity: "Capacity",
    logo: "Upload Event Logo",
    brandingMedia: "Upload Branding Media",
    currentImage: "Current Logo:",
    preview: "Preview:",
    uploadBackground: "Upload Background",
    uploadBackgroundEn: "Upload Background (EN)",
    uploadBackgroundAr: "Upload Background (AR)",
    currentBackground: "Current Background:",
    uploadTables: "Upload Table Images",
    cancel: "Cancel",
    create: "Create Event",
    update: "Save Changes",
    creating: "Creating...",
    updating: "Saving...",
    required: "Please fill all required fields.",
    invalidCapacity: "Capacity must be a positive number.",
    useCustomFields: "Use custom registration fields?",
    switchToClassic: "Switch to Classic Fields",
    switchToCustom: "Switch to Custom Fields",
    fieldLabel: "Field Label",
    inputType: "Input Type",
    options: "Options",
    optionPlaceholder: "Type option and press comma",
    requiredField: "Required",
    visibleField: "Visible",
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
    useInternationalNumbers: "Allow International Numbers",
    showQrToggle: "Show QR code after registration?",
    showQrOnBadgeToggle: "Show QR Code on Printed Badge?",
    requiresApprovalToggle: "Require admin approval for registrations?",
    organizerDetails: "Organizer Details",
    organizerName: "Organizer Name",
    organizerEmail: "Organizer Email",
    organizerPhone: "Organizer Phone",
    deleteMediaTitle: "Delete Media",
    deleteMediaMessage: "Are you sure you want to delete this media? This action cannot be undone.",
    deleteConfirm: "Delete",
  },
  ar: {
    createTitle: "إنشاء فعالية",
    editTitle: "تعديل الفعالية",
    name: "اسم الفعالية",
    slug: "المعرف",
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    venue: "المكان",
    description: "الوصف",
    capacity: "السعة",
    logo: "رفع شعار الفعالية",
    brandingMedia: "رفع الوسائط التسويقية",
    currentImage: "الشعار الحالي:",
    preview: "معاينة:",
    uploadBackground: "رفع الخلفية",
    uploadBackgroundEn: "رفع الخلفية (إنجليزي)",
    uploadBackgroundAr: "رفع الخلفية (عربي)",
    currentBackground: "الخلفية الحالية:",
    uploadTables: "رفع صور الطاولات",
    cancel: "إلغاء",
    create: "إنشاء فعالية",
    update: "حفظ التغييرات",
    creating: "جارٍ الإنشاء...",
    updating: "جارٍ الحفظ...",
    required: "يرجى تعبئة جميع الحقول المطلوبة.",
    invalidCapacity: "يجب أن تكون السعة رقماً موجباً.",
    useCustomFields: "استخدم حقول التسجيل المخصصة؟",
    switchToClassic: "التحويل إلى الحقول الكلاسيكية",
    switchToCustom: "التحويل إلى الحقول المخصصة",
    fieldLabel: "تسمية الحقل",
    inputType: "نوع الإدخال",
    options: "الخيارات",
    optionPlaceholder: "اكتب الخيار واضغط فاصلة",
    requiredField: "إلزامي",
    visibleField: "مرئي",
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
    useInternationalNumbers: "السماح بالأرقام الدولية",
    showQrToggle: "عرض رمز الاستجابة السريعة بعد التسجيل؟",
    showQrOnBadgeToggle: "عرض رمز QR على بطاقة الطباعة؟",
    requiresApprovalToggle: "يتطلب موافقة المسؤول على التسجيلات؟",
    organizerDetails: "تفاصيل المنظم",
    organizerName: "اسم المنظم",
    organizerEmail: "بريد المنظم الإلكتروني",
    organizerPhone: "هاتف المنظم",
    deleteMediaTitle: "حذف الوسائط",
    deleteMediaMessage: "هل أنت متأكد من حذف هذه الوسائط؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteConfirm: "حذف",
  },
};

const EventModal = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  selectedBusiness,
  isClosed = false,
}) => {
  const { t, dir } = useI18nLayout(translations);
  const { showMessage } = useMessage();

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [organizerPhoneError, setOrganizerPhoneError] = useState("");
  const [organizerPhoneIsoCode, setOrganizerPhoneIsoCode] = useState(DEFAULT_ISO_CODE);
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
    startDate: "",
    endDate: "",
    venue: "",
    description: "",
    logo: null,
    logoPreview: "",
    backgroundEn: null,
    backgroundEnPreview: "",
    backgroundEnFileType: null,
    backgroundAr: null,
    backgroundArPreview: "",
    backgroundArFileType: null,
    brandingLogos: [], // array of { _id?, name, website, logoUrl, file? }
    removeBrandingLogoIds: [],
    clearAllBrandingLogos: false,
    agenda: null,
    agendaPreview: "",
    capacity: "",
    eventType: isClosed ? "closed" : "public",
    formFields: [],
    useCustomFields: false,
    useInternationalNumbers: false,
    showQrAfterRegistration: false,
    showQrOnBadge: true,
    requiresApproval: false,
    defaultLanguage: "en",
    removeLogo: false,
    removeBackgroundEn: false,
    removeBackgroundAr: false,
    organizerName: "",
    organizerEmail: "",
    organizerPhone: "",
  });

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData((prev) => ({
        ...prev,
        name: initialValues.name || "",
        slug: initialValues.slug || "",
        startDate: initialValues.startDate
          ? new Date(initialValues.startDate).toISOString().split("T")[0]
          : "",
        endDate: initialValues.endDate
          ? new Date(initialValues.endDate).toISOString().split("T")[0]
          : "",
        venue: initialValues.venue || "",
        description: initialValues.description || "",
        capacity: initialValues.capacity?.toString() || "",
        eventType:
          initialValues.eventType || (isClosed ? "closed" : "public"),
        logo: null,
        logoPreview: initialValues.logoUrl || "",
        backgroundEn: null,
        backgroundEnPreview: initialValues.background?.en?.url || initialValues.backgroundUrl || "",
        backgroundEnFileType: initialValues.background?.en?.fileType || (initialValues.backgroundUrl ? "image" : null),
        backgroundAr: null,
        backgroundArPreview: initialValues.background?.ar?.url || "",
        backgroundArFileType: initialValues.background?.ar?.fileType || null,
        brandingLogos: Array.isArray(initialValues.brandingMedia)
          ? initialValues.brandingMedia.map((l) => ({
            _id: l._id,
            name: l.name || "",
            website: l.website || "",
            logoUrl: l.logoUrl || "",
          }))
          : [],
        removeBrandingLogoIds: [],
        clearAllBrandingLogos: false,
        agenda: null,
        agendaPreview: initialValues.agendaUrl || "",
        formFields: (initialValues.formFields || []).map((f) => ({
          ...f,
          _temp: "",
        })),

        useCustomFields: !!initialValues.formFields?.length,
        useInternationalNumbers: initialValues?.useInternationalNumbers || false,
        showQrAfterRegistration:
          initialValues?.showQrAfterRegistration || false,
        showQrOnBadge: initialValues?.showQrOnBadge ?? true,
        requiresApproval: initialValues?.requiresApproval || false,
        defaultLanguage: initialValues?.defaultLanguage || "en",
        removeLogo: false,
        removeBackgroundEn: false,
        removeBackgroundAr: false,
        organizerName: initialValues?.organizerName || "",
        organizerEmail: initialValues?.organizerEmail || "",
        organizerPhone: initialValues?.organizerPhone || "",
      }));

      if (initialValues?.organizerPhone) {
        const phoneValue = initialValues.organizerPhone;
        if (phoneValue.startsWith("+")) {
          const codeMatch = COUNTRY_CODES
            .filter((cc) => phoneValue.startsWith(cc.code))
            .sort((a, b) => b.code.length - a.code.length)[0];
          if (codeMatch) {
            setOrganizerPhoneIsoCode(codeMatch.isoCode);
            setFormData((prev) => ({
              ...prev,
              organizerPhone: phoneValue.substring(codeMatch.code.length).trim(),
            }));
          } else {
            setOrganizerPhoneIsoCode(DEFAULT_ISO_CODE);
          }
        } else {
          setOrganizerPhoneIsoCode(DEFAULT_ISO_CODE);
        }
      } else {
        setOrganizerPhoneIsoCode(DEFAULT_ISO_CODE);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        name: "",
        slug: "",
        startDate: "",
        endDate: "",
        venue: "",
        description: "",
        logo: null,
        logoPreview: "",
        backgroundEn: null,
        backgroundEnPreview: "",
        backgroundEnFileType: null,
        backgroundAr: null,
        backgroundArPreview: "",
        backgroundArFileType: null,
        brandingLogos: [],
        removeBrandingLogoIds: [],
        clearAllBrandingLogos: false,
        agenda: null,
        agendaPreview: "",
        capacity: "",
        eventType: isClosed ? "closed" : "public",
        formFields: [],
        useCustomFields: false,
        useInternationalNumbers: false,
        showQrAfterRegistration: false,
        showQrOnBadge: true,
        requiresApproval: false,
        defaultLanguage: "en",
        removeLogo: false,
        removeBackgroundEn: false,
        removeBackgroundAr: false,
      }));
    }
  }, [initialValues, isClosed]);

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

  const validatePhoneNumber = (phone) => {
    if (!phone) return null;
    const phoneStr = phone.toString().trim();

    if (!phoneStr.startsWith("+")) {
      return "Phone number must start with country code (e.g., +92, +968, +1)";
    }

    const result = validatePhoneNumberByCountry(phoneStr);
    if (!result.valid) {
      return result.error;
    }

    return null;
  };

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
    } else if (name === "agenda" && files?.[0]) {
      const file = files[0];
      if (file.type === "application/pdf") {
        setFormData((prev) => ({
          ...prev,
          agenda: file,
          agendaPreview: file.name,
        }));
      }
    } else {
      let processedValue = value;

      if (name === "organizerPhone") {
        const digitsOnly = value.replace(/\D/g, "");
        processedValue = digitsOnly;
        const error = validatePhoneNumber(digitsOnly, organizerPhoneIsoCode);
        setOrganizerPhoneError(error || "");
      }

      setFormData((prev) => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleAddBrandingLogos = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newItems = files.map((file, index) => ({
      name: "",
      website: "",
      logoUrl: URL.createObjectURL(file),
      file,
      uniqueKey: `${Date.now()}-${index}-${Math.random()}`,
    }));

    setFormData((prev) => ({
      ...prev,
      brandingLogos: [...prev.brandingLogos, ...newItems],
    }));
    e.target.value = "";
  };

  const handleBrandingLogoFieldChange = (index, key, value) => {
    setFormData((prev) => {
      const arr = [...prev.brandingLogos];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, brandingLogos: arr };
    });
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
      } else if (type === "agenda") {
        setFormData((prev) => ({
          ...prev,
          agenda: null,
          agendaPreview: "",
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
        deletePayload.eventType = isClosed ? "closed" : "public";
        deletePayload.mediaType = deleteConfirm.type;

        if (deleteConfirm.type === "brandingLogo") {
          const item = formData.brandingLogos[deleteConfirm.index];
          if (item?._id) {
            deletePayload.removeBrandingLogoIds = [item._id];
          }
        }
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
      } else if (deleteConfirm.type === "agenda") {
        setFormData((prev) => ({
          ...prev,
          agenda: null,
          agendaPreview: "",
        }));
      } else if (deleteConfirm.type === "brandingLogo") {
        setFormData((prev) => {
          const arr = [...prev.brandingLogos];
          const removed = arr.splice(deleteConfirm.index, 1)[0];
          const removeIds = [...prev.removeBrandingLogoIds];

          if (removed && removed._id) {
            removeIds.push(removed._id);
          }

          return {
            ...prev,
            brandingLogos: arr,
            removeBrandingLogoIds: removeIds,
          };
        });
      }

      // Update initialValues if event was updated
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

  const handleRemoveBrandingLogo = (index) => {
    const item = formData.brandingLogos[index];
    if (!item) return;

    if (item.logoUrl && item.logoUrl.startsWith("blob:")) {
      setFormData((prev) => {
        const arr = [...prev.brandingLogos];
        arr.splice(index, 1);
        return {
          ...prev,
          brandingLogos: arr,
        };
      });
      return;
    }

    // For existing branding logos, use handleDeleteMedia
    if (item.logoUrl && !item.logoUrl.startsWith("blob:")) {
      handleDeleteMedia("brandingLogo", item.logoUrl, index);
    }
  };

  const handleClearAllBrandingLogos = () => {
    setFormData((prev) => ({
      ...prev,
      clearAllBrandingLogos: !prev.clearAllBrandingLogos,
    }));
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
    if (
      !formData.name ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.venue
    ) {
      showMessage(t.required, "error");
      return;
    }
    if (
      formData.capacity &&
      (isNaN(formData.capacity) || formData.capacity <= 0)
    ) {
      showMessage(t.invalidCapacity, "error");
      return;
    }

    if (!selectedBusiness) {
      showMessage("Business is required", "error");
      return;
    }

    if (formData.organizerPhone) {
      const phoneError = validatePhoneNumber(formData.organizerPhone, organizerPhoneIsoCode);
      if (phoneError) {
        setOrganizerPhoneError(phoneError);
        showMessage(phoneError, "error");
        return;
      }
    }

    setLoading(true);

    try {
      const filesToUpload = [];

      let logoUrl = formData.removeLogo ? null : (formData.logo ? null : (formData.logoPreview || null));
      let backgroundEn = null;
      let backgroundAr = null;
      let agendaUrl = formData.agenda
        ? null
        : (formData.agendaPreview && formData.agendaPreview.startsWith('http')
          ? formData.agendaPreview
          : (initialValues?.agendaUrl || null));
      const brandingMediaFiles = [];

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

      formData.brandingLogos.forEach((item) => {
        if (item.file) {
          brandingMediaFiles.push({
            file: item.file,
            meta: { name: item.name || "", website: item.website || "" },
          });
          filesToUpload.push({
            file: item.file,
            type: "branding",
            label: item.name || "Branding Logo",
          });
        }
      });

      if (formData.agenda) {
        filesToUpload.push({
          file: formData.agenda,
          type: "agenda",
          label: "Agenda",
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
            moduleName: isClosed ? "CheckIn" : "EventReg",
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
            else if (result.type === "agenda") agendaUrl = result.url;
          });

          let brandingIndex = 0;
          uploadResults.forEach((result) => {
            if (result.type === "branding") {
              brandingMediaFiles[brandingIndex].url = result.url;
              brandingIndex++;
            }
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

      const brandingMedia = [];
      if (!formData.clearAllBrandingLogos) {
        brandingMediaFiles.forEach((item) => {
          if (item.url) {
            brandingMedia.push({
              name: item.meta.name,
              website: item.meta.website,
              logoUrl: item.url,
            });
          }
        });

        if (initialValues) {
          formData.brandingLogos
            .filter(
              (item) =>
                !item.file &&
                item.logoUrl &&
                !formData.removeBrandingLogoIds.includes(item._id?.toString())
            )
            .forEach((item) => {
              brandingMedia.push({
                name: item.name || "",
                website: item.website || "",
                logoUrl: item.logoUrl,
              });
            });
        }
      }

      const payload = {
        name: formData.name,
        slug: formData.slug || slugify(formData.name),
        startDate: formData.startDate,
        endDate: formData.endDate,
        venue: formData.venue,
        description: formData.description || "",
        capacity: formData.capacity || 999,
        logoUrl: formData.removeLogo ? null : logoUrl,
        ...(Object.keys(background).length > 0 ? { background } : {}),
        ...(brandingMedia.length > 0 ? { brandingMedia } : {}),
        agendaUrl: agendaUrl || null,
        showQrAfterRegistration: formData.showQrAfterRegistration,
        showQrOnBadge: formData.showQrOnBadge,
        requiresApproval: formData.requiresApproval,
        defaultLanguage: formData.defaultLanguage,
        useInternationalNumbers: formData.useInternationalNumbers,
        ...(formData.useCustomFields
          ? { formFields: formData.formFields }
          : {}),
        ...(formData.removeLogo ? { removeLogo: "true" } : {}),
        ...(formData.removeBackgroundEn ? { removeBackgroundEn: "true" } : {}),
        ...(formData.removeBackgroundAr ? { removeBackgroundAr: "true" } : {}),
        ...(formData.removeBrandingLogoIds.length > 0
          ? { removeBrandingLogoIds: formData.removeBrandingLogoIds }
          : {}),
        ...(formData.clearAllBrandingLogos
          ? { clearAllBrandingLogos: "true" }
          : {}),
        organizerName: formData.organizerName || "",
        organizerEmail: formData.organizerEmail || "",
        organizerPhone: formData.organizerPhone
          ? `${getCountryCodeByIsoCode(organizerPhoneIsoCode)?.code || DEFAULT_COUNTRY_CODE}${formData.organizerPhone}`
          : "",
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
            <TextField
              label={`${t.startDate} *`}
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label={`${t.endDate} *`}
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label={`${t.venue} *`}
              name="venue"
              value={formData.venue}
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
            <TextField
              label={t.capacity}
              name="capacity"
              type="number"
              value={formData.capacity}
              onChange={handleInputChange}
              fullWidth
            />

            {/* Organizer Details */}
            <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
              {t.organizerDetails}
            </Typography>
            <TextField
              label={t.organizerName}
              name="organizerName"
              value={formData.organizerName}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label={t.organizerEmail}
              name="organizerEmail"
              type="email"
              value={formData.organizerEmail}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label={t.organizerPhone}
              name="organizerPhone"
              value={formData.organizerPhone}
              onChange={handleInputChange}
              error={!!organizerPhoneError}
              helperText={organizerPhoneError || "Enter your phone number"}
              fullWidth
              type="tel"
              InputProps={{
                startAdornment: (
                  <CountryCodeSelector
                    value={organizerPhoneIsoCode}
                    onChange={(iso) => {
                      setOrganizerPhoneIsoCode(iso);
                      if (formData.organizerPhone) {
                        const error = validatePhoneNumber(formData.organizerPhone, iso);
                        setOrganizerPhoneError(error || "");
                      }
                    }}
                    disabled={false}
                    dir={dir}
                  />
                ),
              }}
            />

            {!isClosed && (
              <>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.showQrAfterRegistration}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            showQrAfterRegistration: e.target.checked,
                          }))
                        }
                        color="primary"
                      />
                    }
                    label={t.showQrToggle}
                    sx={{ alignSelf: "start" }}
                  />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.showQrOnBadge}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            showQrOnBadge: e.target.checked,
                          }))
                        }
                        color="primary"
                      />
                    }
                    label={t.showQrOnBadgeToggle}
                    sx={{ alignSelf: "start" }}
                  />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.requiresApproval}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            requiresApproval: e.target.checked,
                          }))
                        }
                        color="primary"
                      />
                    }
                    label={t.requiresApprovalToggle}
                    sx={{ alignSelf: "start" }}
                  />
                </Box>
              </>
            )}

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.useInternationalNumbers}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        useInternationalNumbers: e.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label={t.useInternationalNumbers}
                sx={{ alignSelf: "start" }}
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

            {/* Branding Logos Upload and List */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 1,
                  width: { xs: "100%", sm: "auto" },
                  mb: 1,
                }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                  disabled={formData.clearAllBrandingLogos}
                >
                  {t.brandingMedia}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleAddBrandingLogos}
                  />
                </Button>
                <Button
                  variant={
                    formData.clearAllBrandingLogos ? "contained" : "outlined"
                  }
                  color="error"
                  onClick={handleClearAllBrandingLogos}
                >
                  {formData.clearAllBrandingLogos
                    ? t.willClearAll || "Will Clear All (toggle off?)"
                    : t.clearAllLogos || "Clear All Logos"}
                </Button>
              </Box>

              <Box
                sx={{ maxHeight: { xs: 420, md: 360 }, overflow: "auto", pr: 1 }}
              >
                <List disablePadding>
                  {formData.brandingLogos.map((item, idx) => (
                    <ListItem
                      key={item.uniqueKey || item._id || `b-${idx}`}
                      disableGutters
                      sx={{ px: 0, mb: 1 }}
                    >
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 1.5, width: "100%" }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            alignItems: { xs: "stretch", sm: "center" },
                            gap: 1.5,
                            minWidth: 0,
                          }}
                        >
                          <Box
                            sx={{
                              flexShrink: 0,
                              alignSelf: { xs: "center", sm: "flex-start" },
                            }}
                          >
                            <img
                              src={item.logoUrl}
                              alt="branding"
                              style={{
                                width: 72,
                                height: 72,
                                objectFit: "cover",
                                borderRadius: 4,
                              }}
                            />
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              gap: 1.5,
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <Box
                              sx={{
                                flex: 1,
                                minWidth: { xs: "100%", sm: 120 },
                              }}
                            >
                              <TextField
                                size="small"
                                fullWidth
                                label={t.nameOptional || "Client Name (optional)"}
                                value={item.name}
                                onChange={(e) =>
                                  handleBrandingLogoFieldChange(
                                    idx,
                                    "name",
                                    e.target.value
                                  )
                                }
                              />
                            </Box>
                            <Box
                              sx={{
                                flex: 1.2,
                                minWidth: { xs: "100%", sm: 140 },
                              }}
                            >
                              <TextField
                                size="small"
                                fullWidth
                                label={t.websiteOptional || "Website (optional)"}
                                value={item.website}
                                onChange={(e) =>
                                  handleBrandingLogoFieldChange(
                                    idx,
                                    "website",
                                    e.target.value
                                  )
                                }
                              />
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              flexShrink: 0,
                              alignSelf: { xs: "stretch", sm: "flex-start" },
                            }}
                          >
                            <Tooltip title={t.remove || "Remove"}>
                              <IconButton
                                color="error"
                                onClick={() => handleRemoveBrandingLogo(idx)}
                                size="small"
                                sx={{ width: { xs: "100%", sm: "auto" } }}
                              >
                                <ICONS.delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Paper>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
            {!isClosed && (
              <Box>
                <Button component="label" variant="outlined">
                  Upload Agenda (PDF)
                  <input
                    hidden
                    name="agenda"
                    type="file"
                    accept="application/pdf"
                    onChange={handleInputChange}
                  />
                </Button>
                {formData.agendaPreview && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      {initialValues && !formData.agenda
                        ? "Current Agenda:"
                        : "Selected Agenda:"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.agendaPreview}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {(isClosed || formData.eventType === "public") && (
              <>
                <Typography variant="subtitle2" color="primary">
                  {t.useCustomFields}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      useCustomFields: !prev.useCustomFields,
                    }))
                  }
                >
                  {formData.useCustomFields
                    ? t.switchToClassic
                    : t.switchToCustom}
                </Button>

                {formData.useCustomFields ? (
                  <>
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
                    <Button onClick={addFormField} variant="outlined">
                      {t.addField}
                    </Button>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                    {t.classicFieldsNote}
                  </Typography>
                )}
              </>
            )}
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

export default EventModal;
