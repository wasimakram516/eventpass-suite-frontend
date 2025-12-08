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
import { downloadEmployeeTemplate } from "@/services/checkin/checkinEventService";
import { deleteMedia } from "@/services/mediaService";
import { getPublicEventById, updatePublicEvent, updatePublicEventWithProgress } from "@/services/eventreg/eventService";
import { updateCheckInEvent } from "@/services/checkin/checkinEventService";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import MediaUploadProgress from "@/components/common/MediaUploadProgress";
import { batchUploadMediaWithProgress } from "@/services/uploadService";
import ICONS from "@/utils/iconUtil";

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
    downloadTemplate: "Download Employee Template",
    uploadEmployee: "Upload Employee Data",
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
    radioType: "Radio",
    listType: "List",
    downloadTemplateError: "Failed to download template.",
    showQrToggle: "Show QR code after registration?",
    showQrOnBadgeToggle: "Show QR Code on Printed Badge?",
    requiresApprovalToggle: "Require admin approval for registrations?",
    downloadTemplateSuccess: "Template downloaded successfully",
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
    downloadTemplate: "تحميل قالب الموظفين",
    uploadEmployee: "رفع بيانات الموظفين",
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
    radioType: "اختيار",
    listType: "قائمة",
    downloadTemplateError: "فشل في تحميل القالب.",
    showQrToggle: "عرض رمز الاستجابة السريعة بعد التسجيل؟",
    showQrOnBadgeToggle: "عرض رمز QR على بطاقة الطباعة؟",
    requiresApprovalToggle: "يتطلب موافقة المسؤول على التسجيلات؟",
    downloadTemplateSuccess: "تم تحميل القالب بنجاح",
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
  isEmployee = false,
  onEventUpdated,
}) => {
  const { t, dir } = useI18nLayout(translations);
  const { showMessage } = useMessage();

  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState({
    agenda: false,
    employeeData: false,
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
    eventType: isEmployee ? "employee" : "public",
    employeeData: null,
    tableImages: [],
    formFields: [],
    useCustomFields: false,
    showQrAfterRegistration: false,
    showQrOnBadge: true,
    requiresApproval: false,
    defaultLanguage: "en",
  });

  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    type: null,
    fileUrl: null,
    index: null,
  });

  const [uploadProgress, setUploadProgress] = useState({
    open: false,
    uploads: [],
  });

  const [deletedMedia, setDeletedMedia] = useState({
    logo: false,
    backgroundEn: false,
    backgroundAr: false,
  });

  const logoButtonRef = useRef(null);
  const backgroundEnButtonRef = useRef(null);
  const backgroundArButtonRef = useRef(null);

  const [buttonWidths, setButtonWidths] = useState({
    logo: null,
    backgroundEn: null,
    backgroundAr: null,
  });

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

  const prevInitialValuesIdRef = useRef(null);

  useEffect(() => {
    const isSameEvent = prevInitialValuesIdRef.current === initialValues?._id;
    const isModalOpen = open;

    if (initialValues && Object.keys(initialValues).length > 0) {
      if (isSameEvent && isModalOpen) {
        setFormData((prev) => ({
          ...prev,
          logo: prev.logo,
          logoPreview: initialValues.logoUrl || prev.logoPreview || "",
          backgroundEn: prev.backgroundEn,
          backgroundEnPreview: initialValues.background?.en?.url || initialValues.backgroundUrl || prev.backgroundEnPreview || "",
          backgroundEnFileType: initialValues.background?.en?.fileType || (initialValues.backgroundUrl ? "image" : null) || prev.backgroundEnFileType,
          backgroundAr: prev.backgroundAr,
          backgroundArPreview: initialValues.background?.ar?.url || prev.backgroundArPreview || "",
          backgroundArFileType: initialValues.background?.ar?.fileType || prev.backgroundArFileType,
          brandingLogos: Array.isArray(initialValues.brandingMedia)
            ? initialValues.brandingMedia.map((l) => ({
              _id: l._id,
              name: l.name || "",
              website: l.website || "",
              logoUrl: l.logoUrl || "",
            }))
            : prev.brandingLogos,
          agenda: prev.agenda,
          agendaPreview: initialValues.agendaUrl || prev.agendaPreview || "",
        }));
      } else {

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
            initialValues.eventType || (isEmployee ? "employee" : "public"),
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
          employeeData: null,
          tableImages: [],
          formFields: (initialValues.formFields || []).map((f) => ({
            ...f,
            _temp: "",
          })),

          useCustomFields: !!initialValues.formFields?.length,
          showQrAfterRegistration:
            initialValues?.showQrAfterRegistration || false,
          showQrOnBadge: initialValues?.showQrOnBadge ?? true,
          requiresApproval: initialValues?.requiresApproval || false,
          defaultLanguage: initialValues?.defaultLanguage || "en",
        }));
        setDeletedMedia({ logo: false, backgroundEn: false, backgroundAr: false });
      }

      prevInitialValuesIdRef.current = initialValues._id;
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
        eventType: isEmployee ? "employee" : "public",
        employeeData: null,
        tableImages: [],
        formFields: [],
        useCustomFields: false,
        showQrAfterRegistration: false,
        showQrOnBadge: true,
        requiresApproval: false,
        defaultLanguage: "en",
      }));
      setDeletedMedia({ logo: false, backgroundEn: false, backgroundAr: false });
      prevInitialValuesIdRef.current = null;
    }
  }, [initialValues, isEmployee, open]);

  // Reset the ref when modal closes to ensure proper behavior on reopen
  useEffect(() => {
    if (!open) {
      prevInitialValuesIdRef.current = null;
    }
  }, [open]);

  const handleInputChange = async (e) => {
    const { name, value, files } = e.target;
    if (name === "logo" && files?.[0]) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        setDeletedMedia((prev) => ({ ...prev, logo: false }));

        const previewUrl = URL.createObjectURL(file);
        setFormData((prev) => ({
          ...prev,
          logo: file,
          logoPreview: previewUrl,
        }));
      }
    } else if (name === "backgroundEn" && files?.[0]) {
      const file = files[0];
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        const fileType = file.type.startsWith("video/") ? "video" : "image";
        setDeletedMedia((prev) => ({ ...prev, backgroundEn: false }));

        const previewUrl = URL.createObjectURL(file);
        setFormData((prev) => ({
          ...prev,
          backgroundEn: file,
          backgroundEnPreview: previewUrl,
          backgroundEnFileType: fileType,
        }));
      }
    } else if (name === "backgroundAr" && files?.[0]) {
      const file = files[0];
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        const fileType = file.type.startsWith("video/") ? "video" : "image";
        setDeletedMedia((prev) => ({ ...prev, backgroundAr: false }));

        const previewUrl = URL.createObjectURL(file);
        setFormData((prev) => ({
          ...prev,
          backgroundAr: file,
          backgroundArPreview: previewUrl,
          backgroundArFileType: fileType,
        }));
      }
    } else if (name === "agenda" && files?.[0]) {
      const file = files[0];
      if (file.type === "application/pdf") {

        if (initialValues?._id) {
          setUploadingMedia((prev) => ({ ...prev, agenda: true }));
          try {
            const uploadPayload = new FormData();
            uploadPayload.append("agenda", file);

            const updatedEvent = isEmployee
              ? await updateCheckInEvent(initialValues._id, uploadPayload)
              : await updatePublicEvent(initialValues._id, uploadPayload);

            if (updatedEvent && !updatedEvent.error) {
              setFormData((prev) => ({
                ...prev,
                agenda: null,
                agendaPreview: updatedEvent.agendaUrl || file.name,
              }));

              if (initialValues) {
                initialValues.agendaUrl = updatedEvent.agendaUrl;
              }

              if (onEventUpdated) {
                onEventUpdated(updatedEvent);
              }

              showMessage("Agenda uploaded successfully", "success");
            }
          } catch (err) {
            console.error("Failed to upload agenda:", err);
            showMessage("Failed to upload agenda. Please try again.", "error");
          } finally {
            setUploadingMedia((prev) => ({ ...prev, agenda: false }));
          }
        } else {
          setFormData((prev) => ({
            ...prev,
            agenda: file,
            agendaPreview: file.name,
          }));
        }
      }
    } else if (name === "employeeData" && files?.[0]) {
      const file = files[0];

      if (initialValues?._id && isEmployee) {
        setUploadingMedia((prev) => ({ ...prev, employeeData: true }));
        try {
          const uploadPayload = new FormData();
          uploadPayload.append("employeeData", file);

          formData.tableImages.forEach((imgFile) => {
            uploadPayload.append("tableImages", imgFile);
          });

          const updatedEvent = await updateCheckInEvent(initialValues._id, uploadPayload);

          if (updatedEvent && !updatedEvent.error) {

            setFormData((prev) => ({
              ...prev,
              employeeData: null,
              tableImages: [],
            }));


            if (initialValues) {
              initialValues.employeeData = updatedEvent.employeeData;
            }


            if (onEventUpdated) {
              onEventUpdated(updatedEvent);
            }

            showMessage("Employee data uploaded successfully", "success");
          }
        } catch (err) {
          console.error("Failed to upload employee data:", err);
          showMessage("Failed to upload employee data. Please try again.", "error");
        } finally {
          setUploadingMedia((prev) => ({ ...prev, employeeData: false }));
        }
      } else {

        setFormData((prev) => ({ ...prev, employeeData: file }));
      }
    } else if (name === "tableImages" && files?.length > 0) {
      const fileArray = Array.from(files);

      setFormData((prev) => ({ ...prev, tableImages: [...prev.tableImages, ...fileArray] }));

    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddBrandingLogos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    e.target.value = "";

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
  };

  const handleBrandingLogoFieldChange = (index, key, value) => {
    setFormData((prev) => {
      const arr = [...prev.brandingLogos];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, brandingLogos: arr };
    });
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

    if (item.logoUrl && !item.logoUrl.startsWith("blob:")) {
      setDeleteConfirm({
        open: true,
        type: "brandingLogo",
        fileUrl: item.logoUrl,
        index: index,
      });
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

  const handleDownloadTemplate = async () => {
    try {
      await downloadEmployeeTemplate();
      showMessage(
        t.downloadTemplateSuccess || "Template downloaded successfully",
        "success"
      );
    } catch (err) {
      showMessage(err.message, "error");
    }
  };


  const handleDeleteMedia = (type, fileUrl) => {

    if (fileUrl && fileUrl.startsWith("blob:")) {
      if (type === "logo") {
        setFormData((prev) => ({
          ...prev,
          logo: null,
          logoPreview: "",
        }));
      } else if (type === "backgroundEn") {
        setFormData((prev) => ({
          ...prev,
          backgroundEn: null,
          backgroundEnPreview: "",
          backgroundEnFileType: null,
        }));
      } else if (type === "backgroundAr") {
        setFormData((prev) => ({
          ...prev,
          backgroundAr: null,
          backgroundArPreview: "",
          backgroundArFileType: null,
        }));
      }
      return;
    }


    setDeleteConfirm({
      open: true,
      type,
      fileUrl,
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
        deletePayload.eventType = isEmployee ? "employee" : "public";
        deletePayload.mediaType = deleteConfirm.type;


        if (deleteConfirm.type === "brandingLogo") {
          const item = formData.brandingLogos[deleteConfirm.index];
          if (item?._id) {
            deletePayload.removeBrandingLogoIds = [item._id];
          }
        }
      }


      const updatedEvent = await deleteMedia(deletePayload);


      if (initialValues?._id && onEventUpdated && updatedEvent && !updatedEvent.error) {
        onEventUpdated(updatedEvent);
      }


      if (deleteConfirm.type === "logo") {
        setFormData((prev) => ({
          ...prev,
          logo: null,
          logoPreview: "",
        }));
        setDeletedMedia((prev) => ({ ...prev, logo: true }));
      } else if (deleteConfirm.type === "backgroundEn") {
        setFormData((prev) => ({
          ...prev,
          backgroundEn: null,
          backgroundEnPreview: "",
          backgroundEnFileType: null,
        }));
        setDeletedMedia((prev) => ({ ...prev, backgroundEn: true }));
      } else if (deleteConfirm.type === "backgroundAr") {
        setFormData((prev) => ({
          ...prev,
          backgroundAr: null,
          backgroundArPreview: "",
          backgroundArFileType: null,
        }));
        setDeletedMedia((prev) => ({ ...prev, backgroundAr: true }));
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

      setDeleteConfirm({ open: false, type: null, fileUrl: null, index: null });
      showMessage("Media deleted successfully", "success");
    } catch (err) {
      showMessage(err.message || "Failed to delete media", "error");
    }
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
    setLoading(true);

    try {
      const mediaFiles = [];
      const uploadLabels = {};

      if (formData.logo) {
        mediaFiles.push({ type: 'logo', file: formData.logo });
        uploadLabels['logo'] = t.logo || "Event Logo";
      }

      if (formData.backgroundEn) {
        mediaFiles.push({ type: 'backgroundEn', file: formData.backgroundEn });
        uploadLabels['backgroundEn'] = t.uploadBackgroundEn || "Background (EN)";
      }

      if (formData.backgroundAr) {
        mediaFiles.push({ type: 'backgroundAr', file: formData.backgroundAr });
        uploadLabels['backgroundAr'] = t.uploadBackgroundAr || "Background (AR)";
      }

      if (formData.brandingLogos) {
        formData.brandingLogos.forEach((item, idx) => {
          if (item.file) {
            mediaFiles.push({
              type: 'brandingMedia',
              file: item.file,
              name: item.name || "",
              website: item.website || ""
            });
            uploadLabels[`brandingMedia-${idx}`] = `Branding Logo ${idx + 1}`;
          }
        });
      }

      if (formData.agenda) {
        mediaFiles.push({ type: 'agenda', file: formData.agenda });
        uploadLabels['agenda'] = "Agenda PDF";
      }

      const payload = new FormData();

      if (!initialValues && selectedBusiness) {

        payload.append("businessSlug", selectedBusiness);
        payload.append("name", formData.name);
        payload.append("slug", formData.slug || slugify(formData.name));
        payload.append("startDate", formData.startDate);
        payload.append("endDate", formData.endDate);
        payload.append("venue", formData.venue);
        payload.append("description", formData.description);
        payload.append("capacity", formData.capacity || "999");
        payload.append("eventType", formData.eventType);

        if (formData.eventType === "employee") {
          if (formData.employeeData)
            payload.append("employeeData", formData.employeeData);
          formData.tableImages.forEach((file) =>
            payload.append("tableImages", file)
          );
        }

        payload.append("showQrAfterRegistration", formData.showQrAfterRegistration.toString());
        payload.append("showQrOnBadge", formData.showQrOnBadge.toString());
        payload.append("requiresApproval", formData.requiresApproval.toString());
        payload.append("defaultLanguage", formData.defaultLanguage);

        if (formData.eventType === "public" && formData.useCustomFields) {
          payload.append("formFields", JSON.stringify(formData.formFields));
        }


        let savedEvent;
        try {
          savedEvent = await onSubmit(payload, false, mediaFiles.length > 0);

          if (savedEvent?.error) {
            const errorMsg = savedEvent?.message || "Failed to create event";
            showMessage(errorMsg, "error");
            setLoading(false);
            return;
          }
        } catch (error) {
          const errorMsg = error?.message || error?.response?.data?.message || "Failed to create event";
          showMessage(errorMsg, "error");
          setLoading(false);
          return;
        }


        let eventId = savedEvent?._id || savedEvent?.id || savedEvent?.data?._id || savedEvent?.data?.id;

        if (!eventId && savedEvent) {
          console.log("Event creation response:", savedEvent);

          if (savedEvent.name && savedEvent.slug) {
            eventId = savedEvent._id || savedEvent.id;
          }
        }

        if (!eventId) {
          const errorMsg = savedEvent?.message || savedEvent?.error || "Failed to save event: Event ID not returned";
          console.error("Event creation failed - no ID found:", savedEvent);
          showMessage(errorMsg, "error");
          setLoading(false);
          return;
        }

        if (mediaFiles.length > 0) {
          const initialUploads = mediaFiles.map((item, idx) => ({
            label: uploadLabels[item.type === 'brandingMedia' ? `brandingMedia-${idx}` : item.type] || item.type,
            type: item.type,
            percent: 0,
            loaded: 0,
            total: 0,
          }));

          setUploadProgress({
            open: true,
            uploads: initialUploads,
          });

          try {
            await batchUploadMediaWithProgress(
              eventId,
              { mediaFiles },
              (progressData) => {
                setUploadProgress((prev) => {
                  const updatedUploads = prev.uploads.map((u, idx) => {
                    if (idx === progressData.taskIndex) {

                      if (u.percent === 100) {
                        return u;
                      }

                      if (progressData.percent !== undefined && progressData.percent !== null) {
                        return {
                          ...u,
                          percent: progressData.percent,
                          loaded: progressData.loaded || u.loaded,
                          total: progressData.total || u.total
                        };
                      }
                      return u;
                    }
                    return u;
                  });

                  return {
                    ...prev,
                    uploads: updatedUploads,
                  };
                });
              }
            );

            setUploadProgress((prev) => ({
              ...prev,
              uploads: prev.uploads.map((u) => ({
                ...u,
                percent: 100,
              })),
            }));
          } catch (error) {
            const errorMsg = error?.message || error?.error || "Failed to upload media";
            console.error("Media upload error:", error);
            showMessage(errorMsg, "error");
            setUploadProgress({ open: false, uploads: [] });
            setLoading(false);
            return;
          }
        }


        if (onEventUpdated) {
          try {
            const refreshedEvent = await getPublicEventById(eventId);
            onEventUpdated(refreshedEvent);
          } catch (error) {
            console.error("Failed to refresh event:", error);
          }
        }

        setLoading(false);
        if (mediaFiles.length > 0) {
          setUploadProgress({ open: false, uploads: [] });
          setTimeout(() => {
            onClose();
          }, 500);
        } else {

          onClose();
        }
      } else {

        payload.append("name", formData.name);
        payload.append("slug", formData.slug || slugify(formData.name));
        payload.append("startDate", formData.startDate);
        payload.append("endDate", formData.endDate);
        payload.append("venue", formData.venue);
        payload.append("description", formData.description);
        payload.append("capacity", formData.capacity || "999");
        payload.append("eventType", formData.eventType);

        if (formData.logo) payload.append("logo", formData.logo);
        if (formData.backgroundEn) payload.append("backgroundEn", formData.backgroundEn);
        if (formData.backgroundAr) payload.append("backgroundAr", formData.backgroundAr);
        if (formData.agenda) payload.append("agenda", formData.agenda);

        const brandingMeta = [];
        formData.brandingLogos.forEach((item) => {
          if (item.file) {
            payload.append("brandingMedia", item.file);
            brandingMeta.push({ name: item.name || "", website: item.website || "" });
          }
        });
        if (brandingMeta.length > 0) {
          payload.append("brandingMediaMeta", JSON.stringify(brandingMeta));
        }

        if (deletedMedia.logo) payload.append("removeLogo", "true");
        if (deletedMedia.backgroundEn) payload.append("removeBackgroundEn", "true");
        if (deletedMedia.backgroundAr) payload.append("removeBackgroundAr", "true");

        if (formData.clearAllBrandingLogos) {
          payload.append("clearAllBrandingLogos", "true");
        } else {

          const existingBrandingUrls = formData.brandingLogos
            .filter((item) => !item.file && item.logoUrl)
            .map((item) => ({
              name: item.name || "",
              website: item.website || "",
              logoUrl: item.logoUrl,
            }));
          if (existingBrandingUrls.length > 0) {
            payload.append("brandingMediaUrls", JSON.stringify(existingBrandingUrls));
          }

          if (formData.removeBrandingLogoIds.length > 0) {
            payload.append("removeBrandingLogoIds", JSON.stringify(formData.removeBrandingLogoIds));
          }
        }

        if (formData.eventType === "employee") {
          if (formData.employeeData)
            payload.append("employeeData", formData.employeeData);
          formData.tableImages.forEach((file) =>
            payload.append("tableImages", file)
          );
        }

        payload.append("showQrAfterRegistration", formData.showQrAfterRegistration.toString());
        payload.append("showQrOnBadge", formData.showQrOnBadge.toString());
        payload.append("requiresApproval", formData.requiresApproval.toString());
        payload.append("defaultLanguage", formData.defaultLanguage);

        if (formData.eventType === "public" && formData.useCustomFields) {
          payload.append("formFields", JSON.stringify(formData.formFields));
        }


        const hasMediaOperations = mediaFiles.length > 0 || deletedMedia.logo || deletedMedia.backgroundEn || deletedMedia.backgroundAr || formData.clearAllBrandingLogos || formData.removeBrandingLogoIds.length > 0;

        if (hasMediaOperations) {

          const initialUploads = mediaFiles.length > 0
            ? mediaFiles.map((item, idx) => ({
              label: uploadLabels[item.type === 'brandingMedia' ? `brandingMedia-${idx}` : item.type] || item.type,
              type: item.type,
              percent: 0,
              loaded: 0,
              total: 0,
            }))
            : [];
          if (mediaFiles.length > 0) {
            setUploadProgress({
              open: true,
              uploads: initialUploads,
            });
          }

          try {

            const updatedEvent = await updatePublicEventWithProgress(
              initialValues._id,
              payload,
              (progressData) => {

                setUploadProgress((prev) => {
                  const updatedUploads = prev.uploads.map((u, idx) => {
                    if (idx === progressData.taskIndex) {

                      if (u.percent === 100) {
                        return u;
                      }
                      return {
                        ...u,
                        percent: progressData.percent || 0,
                        loaded: progressData.loaded || 0,
                        total: progressData.total || 0
                      };
                    }
                    return u;
                  });

                  const allComplete = updatedUploads.every((u) => u.percent === 100 || u.error);

                  return {
                    ...prev,
                    uploads: updatedUploads,

                    allComplete
                  };
                });
              }
            );


            if (mediaFiles.length > 0) {
              setUploadProgress((prev) => ({
                ...prev,
                uploads: prev.uploads.map((u) => ({
                  ...u,
                  percent: 100,
                })),
                allComplete: true,
              }));

              setUploadProgress({ open: false, uploads: [] });
            }


            if (onEventUpdated && updatedEvent) {
              const eventToUpdate = updatedEvent.event || updatedEvent.record || updatedEvent;
              if (eventToUpdate && eventToUpdate._id) {
                onEventUpdated(eventToUpdate);
              }
            }

            setLoading(false);

            onClose();
          } catch (error) {
            showMessage(error.message || "Failed to update event", "error");
            setUploadProgress({ open: false, uploads: [] });
            setLoading(false);
          }
        } else {

          try {
            const updatedEvent = await onSubmit(payload, true);


            if (onEventUpdated && updatedEvent) {
              const eventToUpdate = updatedEvent.event || updatedEvent.record || updatedEvent;
              if (eventToUpdate && eventToUpdate._id) {
                onEventUpdated(eventToUpdate);
              }
            }

            setLoading(false);
            onClose();
          } catch (error) {
            showMessage(error.message || "Failed to update event", "error");
            setLoading(false);
          }
        }
      }
    } catch (err) {
      showMessage(err.message || "Failed to save event", "error");
      setUploadProgress({ open: false, uploads: [] });
      setLoading(false);
    }
  };

  return (
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
          <TextField
            label={t.description}
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={3}
            fullWidth
          />
          <TextField
            label={t.capacity}
            name="capacity"
            type="number"
            value={formData.capacity}
            onChange={handleInputChange}
            fullWidth
          />

          {/* Show QR After Registration Toggle */}
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

          {/* Show QR on Badge Toggle */}

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

          {/* Requires Approval Toggle */}
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
              disabled={uploadingMedia.logo}
              startIcon={uploadingMedia.logo ? <CircularProgress size={16} /> : null}
            >
              {uploadingMedia.logo ? "Uploading..." : t.logo}
              <input
                hidden
                name="logo"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                disabled={uploadingMedia.logo}
              />
            </Button>

            {formData.logoPreview && !uploadingMedia.logo && (
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
                    disabled={uploadingMedia.logo}
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
                      "&:disabled": { opacity: 0.5 },
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

              {formData.backgroundEnPreview && (
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

              {formData.backgroundArPreview && (
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
          <Box>
            <Button
              component="label"
              variant="outlined"
              disabled={uploadingMedia.agenda}
              startIcon={uploadingMedia.agenda ? <CircularProgress size={16} /> : null}
            >
              {uploadingMedia.agenda ? "Uploading..." : "Upload Agenda (PDF)"}
              <input
                hidden
                name="agenda"
                type="file"
                accept="application/pdf"
                onChange={handleInputChange}
                disabled={uploadingMedia.agenda}
              />
            </Button>
            {formData.agendaPreview && !uploadingMedia.agenda && (
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

          {formData.eventType === "employee" && (
            <>
              <Button variant="outlined" onClick={handleDownloadTemplate}>
                {t.downloadTemplate}
              </Button>
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {t.uploadEmployee}
                  {uploadingMedia.employeeData && <CircularProgress size={16} />}
                </Typography>
                <TextField
                  name="employeeData"
                  type="file"
                  inputProps={{ accept: ".csv,.xlsx,.xls" }}
                  onChange={handleInputChange}
                  fullWidth
                  disabled={uploadingMedia.employeeData}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="primary">
                  {t.uploadTables}
                </Typography>
                <TextField
                  name="tableImages"
                  type="file"
                  inputProps={{ accept: "image/*", multiple: true }}
                  onChange={handleInputChange}
                  fullWidth
                  disabled={uploadingMedia.employeeData}
                />
              </Box>
              {formData.tableImages.length > 0 && (
                <List>
                  {Array.from(formData.tableImages).map((file, i) => (
                    <ListItem key={i}>
                      <ListItemText primary={file.name} />
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}

          {/* Public Custom Field Toggle */}
          {formData.eventType === "public" && (
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

      {/* Media Upload Progress Dialog */}
      <MediaUploadProgress
        open={uploadProgress.open}
        uploads={uploadProgress.uploads}
        onClose={() => setUploadProgress({ open: false, uploads: [] })}
        allowClose={false}
      />
    </Dialog>
  );
};

export default EventModal;
