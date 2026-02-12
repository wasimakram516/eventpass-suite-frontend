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
  Tabs,
  Tab,
  Stack,
} from "@mui/material";
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import slugify from "@/utils/slugify";
import { useMessage } from "@/contexts/MessageContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import { uploadMediaFiles, uploadSingleFile } from "@/utils/mediaUpload";
import MediaUploadProgress from "@/components/MediaUploadProgress";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import BadgeCustomizationModal from "@/components/modals/BadgeCustomizationModal";
import DefaultQrWrapperModal from "@/components/modals/DefaultQrWrapperModal";
import { updatePublicEventCustomQrWrapper } from "@/services/eventreg/eventService";
import { updateCheckInEventCustomQrWrapper } from "@/services/checkin/checkinEventService";
import { deleteMedia } from "@/services/deleteMediaService";
import RichTextEditor from "@/components/RichTextEditor";
import CountryCodeSelector from "@/components/CountryCodeSelector";
import { DEFAULT_ISO_CODE, DEFAULT_COUNTRY_CODE, getCountryCodeByIsoCode, COUNTRY_CODES } from "@/utils/countryCodes";
import { validatePhoneNumber } from "@/utils/phoneValidation";
import { convertTimeToLocal, convertTimeFromLocal } from "@/utils/dateUtils";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    createTitle: "Create Event",
    editTitle: "Edit Event",
    name: "Event Name",
    slug: "Slug",
    startDate: "Start Date",
    endDate: "End Date",
    startTime: "Start Time",
    endTime: "End Time",
    venue: "Venue",
    description: "Description",
    capacity: "Capacity",
    logo: "Upload Event Logo",
    brandingMedia: "Upload Branding Media",
    currentImage: "Current Logo:",
    preview: "Preview:",
    uploadBackground: "Upload Background",
    publicPageBackground: "Public Page Background",
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
    noCustomFields: "No custom fields available. Please add custom fields first.",
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
    useCustomEmailTemplate: "Use custom email template",
    emailSubject: "Email Subject",
    emailBody: "Email Body",
    placeholderSubject: "Enter email subject",
    placeholderBody: "Enter email body...",
    emailSubjectRequired: "Email subject is required when using custom email template.",
    emailBodyRequired: "Email body is required when using custom email template.",
    eventDetailsTab: "Event Details",
    organizerDetailsTab: "Organizer Details",
    optionsTab: "Options",
    uploadsTab: "Uploads",
    customFieldsTab: "Custom Fields",
    customizeBadgeTab: "Customize Badge",
    useCustomQrCode: "Use custom QR code for this event",
    customQrCodeTab: "Custom QR Code",
    customQrCodeDescription: "Choose which event details appear on the custom QR wrapper. Then open the editor to design the layout.",
    customQrEventDetails: "Event details",
    customQrEventName: "Event name",
    customQrEventDates: "Event dates (start and end)",
    customQrVenue: "Venue",
    customQrDescription: "Event description",
    customQrOrganizerName: "Organizer name",
    customQrOrganizerEmail: "Organizer email",
    customQrOrganizerPhone: "Organizer phone",
    customQrMediaNote: "Logo, background image, and branding media can be added in the editor.",
    customQrUploadsSection: "Uploads",
    customQrOptionLogo: "Logo",
    customQrOptionBrandingMedia: "Branding Media",
    customQrOptionBackground: "Background",
    openQrCodeEditor: "Open QR Code Editor",
    saveEventFirstToEditQr: "Save the event first to design the custom QR wrapper.",
    qrWrapperBackground: "QR code wrapper background",
    currentQrWrapperBackground: "Current background:",
    customizeBadgeDescription: "Please choose the custom fields which are to be included in the badge.",
    customizeBadgeButton: "Customize Badge",
    next: "Next",
    back: "Back",
    defaultLanguage: "Default Language",
  },
  ar: {
    createTitle: "إنشاء فعالية",
    editTitle: "تعديل الفعالية",
    name: "اسم الفعالية",
    slug: "المعرف",
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    startTime: "وقت البدء",
    endTime: "وقت الانتهاء",
    venue: "المكان",
    description: "الوصف",
    capacity: "السعة",
    logo: "رفع شعار الفعالية",
    brandingMedia: "رفع الوسائط التسويقية",
    currentImage: "الشعار الحالي:",
    preview: "معاينة:",
    uploadBackground: "رفع الخلفية",
    publicPageBackground: "خلفية الصفحة العامة",
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
    noCustomFields: "لا توجد حقول مخصصة متاحة. يرجى إضافة حقول مخصصة أولاً.",
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
    useCustomEmailTemplate: "استخدام قالب بريد إلكتروني مخصص",
    emailSubject: "موضوع البريد الإلكتروني",
    emailBody: "نص البريد الإلكتروني",
    placeholderSubject: "أدخل موضوع البريد الإلكتروني",
    placeholderBody: "أدخل نص البريد الإلكتروني...",
    emailSubjectRequired: "موضوع البريد الإلكتروني مطلوب عند استخدام قالب بريد إلكتروني مخصص.",
    emailBodyRequired: "نص البريد الإلكتروني مطلوب عند استخدام قالب بريد إلكتروني مخصص.",
    eventDetailsTab: "تفاصيل الفعالية",
    organizerDetailsTab: "تفاصيل المنظم",
    optionsTab: "الخيارات",
    uploadsTab: "الرفع",
    customFieldsTab: "الحقول المخصصة",
    customizeBadgeTab: "تخصيص الشارة",
    useCustomQrCode: "استخدام رمز QR مخصص لهذه الفعالية",
    customQrCodeTab: "رمز QR المخصص",
    customQrCodeDescription: "اختر تفاصيل الفعالية التي تظهر على غلاف QR. ثم افتح المحرر لتصميم التخطيط.",
    customQrEventDetails: "تفاصيل الفعالية",
    customQrEventName: "اسم الفعالية",
    customQrEventDates: "تواريخ الفعالية (البداية والنهاية)",
    customQrVenue: "المكان",
    customQrDescription: "وصف الفعالية",
    customQrOrganizerName: "اسم المنظم",
    customQrOrganizerEmail: "بريد المنظم",
    customQrOrganizerPhone: "هاتف المنظم",
    customQrMediaNote: "يمكن إضافة الشعار وصورة الخلفية ووسائط العلامة في المحرر.",
    customQrUploadsSection: "الرفع",
    customQrOptionLogo: "الشعار",
    customQrOptionBrandingMedia: "وسائط العلامة",
    customQrOptionBackground: "الخلفية",
    openQrCodeEditor: "فتح محرر رمز QR",
    saveEventFirstToEditQr: "احفظ الفعالية أولاً لتصميم غلاف رمز QR المخصص.",
    qrWrapperBackground: "خلفية غلاف رمز QR",
    currentQrWrapperBackground: "الخلفية الحالية:",
    customizeBadgeDescription: "يرجى اختيار الحقول المخصصة التي سيتم تضمينها في الشارة.",
    customizeBadgeButton: "تخصيص الشارة",
    next: "التالي",
    back: "رجوع",
    defaultLanguage: "اللغة الافتراضية",
  },
};

/** Derive which event/organizer fields are selected from customQrWrapper.customFields (single source of truth after QR save). */
function getSelectedFieldsFromWrapper(wrapper) {
  const list = Array.isArray(wrapper?.customFields) ? wrapper.customFields : [];
  const hasId = (id) => list.some((f) => f.id === id);
  return {
    eventName: hasId("eventName"),
    eventDates: hasId("eventStartDate") || hasId("eventEndDate"),
    venue: hasId("venue"),
    description: hasId("description"),
    organizerName: hasId("organizerName"),
    organizerEmail: hasId("organizerEmail"),
    organizerPhone: hasId("organizerPhone"),
  };
}

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
  const [activeTab, setActiveTab] = useState(0);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [organizerPhoneError, setOrganizerPhoneError] = useState("");
  const [organizerPhoneIsoCode, setOrganizerPhoneIsoCode] = useState(DEFAULT_ISO_CODE);
  const [emailTemplateSubjectError, setEmailTemplateSubjectError] = useState(false);
  const [emailTemplateBodyError, setEmailTemplateBodyError] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    type: null,
    fileUrl: null,
    index: null,
  });
  const [badgeCustomizationModalOpen, setBadgeCustomizationModalOpen] = useState(false);
  const [customQrWrapperModalOpen, setCustomQrWrapperModalOpen] = useState(false);

  const logoButtonRef = useRef(null);
  const backgroundEnButtonRef = useRef(null);
  const backgroundArButtonRef = useRef(null);

  const [buttonWidths, setButtonWidths] = useState({
    logo: null,
    backgroundEn: null,
    backgroundAr: null,
  });

  const getUserTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    timezone: getUserTimezone(),
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
    badgeFields: [],
    badgeCustomizations: {},
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
    useCustomEmailTemplate: false,
    emailTemplateSubject: "",
    emailTemplateBody: "",
    useCustomQrCode: false,
    customQrSelectedFields: {},
    qrWrapperBackground: null,
    qrWrapperBackgroundPreview: "",
    removeQrWrapperBackground: false,
    customQrIncludeLogo: false,
    customQrIncludeBrandingMedia: false,
    customQrIncludeBackground: false,
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
        startTime: initialValues.startTime && initialValues.timezone
          ? convertTimeToLocal(initialValues.startTime, initialValues.startDate, initialValues.timezone)
          : (initialValues.startTime || ""),
        endTime: initialValues.endTime && initialValues.timezone
          ? convertTimeToLocal(initialValues.endTime, initialValues.endDate || initialValues.startDate, initialValues.timezone)
          : (initialValues.endTime || ""),
        timezone: getUserTimezone(),
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
        badgeFields: (() => {
          const hasCustomFields = !!initialValues.formFields?.length;
          if (!hasCustomFields) {
            return ["Full Name", "Company"];
          }
          if (initialValues?.badgeFields && initialValues.badgeFields.length > 0) {
            return initialValues.badgeFields;
          }
          const customizations = initialValues?.badgeCustomizations || initialValues?.customizations || {};
          return Object.keys(customizations).filter(key => key !== "_qrCode");
        })(),
        badgeCustomizations: initialValues?.badgeCustomizations || initialValues?.customizations || {},
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
        useCustomEmailTemplate: initialValues?.useCustomEmailTemplate || false,
        emailTemplateSubject: initialValues?.emailTemplate?.subject || "",
        emailTemplateBody: initialValues?.emailTemplate?.body || "",
        useCustomQrCode: initialValues?.useCustomQrCode || false,
        customQrSelectedFields: (initialValues?.customQrWrapper && Array.isArray(initialValues.customQrWrapper.customFields) && initialValues.customQrWrapper.customFields.length > 0)
          ? getSelectedFieldsFromWrapper(initialValues.customQrWrapper)
          : {},
        qrWrapperBackground: null,
        qrWrapperBackgroundPreview: initialValues?.customQrWrapper?.backgroundImage?.url || "",
        removeQrWrapperBackground: false,
        customQrIncludeLogo: !!(initialValues?.customQrWrapper?.logo?.url),
        customQrIncludeBrandingMedia: !!(Array.isArray(initialValues?.customQrWrapper?.brandingMedia?.items) && initialValues.customQrWrapper.brandingMedia.items.length > 0),
        customQrIncludeBackground: !!(initialValues?.customQrWrapper?.backgroundImage?.url),
      }));

      if (initialValues?.organizerPhone) {
        const phoneValue = initialValues.organizerPhone;
        if (phoneValue.startsWith("+")) {
          const codeMatch = COUNTRY_CODES
            .filter((cc) => phoneValue.startsWith(cc.code))
            .sort((a, b) => b.code.length - a.code.length)[0];
          if (codeMatch) {
            const localPhone = phoneValue.substring(codeMatch.code.length).trim();
            setOrganizerPhoneIsoCode(codeMatch.isoCode);
            setFormData((prev) => ({
              ...prev,
              organizerPhone: localPhone,
            }));
            if (localPhone) {
              const error = validatePhoneNumber(localPhone, codeMatch.isoCode);
              setOrganizerPhoneError(error || "");
            }
          } else {
            setOrganizerPhoneIsoCode(DEFAULT_ISO_CODE);
            setOrganizerPhoneError("");
          }
        } else {
          setOrganizerPhoneIsoCode(DEFAULT_ISO_CODE);
          if (phoneValue.trim()) {
            const error = validatePhoneNumber(phoneValue, DEFAULT_ISO_CODE);
            setOrganizerPhoneError(error || "");
          } else {
            setOrganizerPhoneError("");
          }
        }
      } else {
        setOrganizerPhoneIsoCode(DEFAULT_ISO_CODE);
        setOrganizerPhoneError("");
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        name: "",
        slug: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        timezone: getUserTimezone(),
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
        badgeFields: [],
        badgeCustomizations: {},
        useInternationalNumbers: false,
        showQrAfterRegistration: false,
        showQrOnBadge: true,
        requiresApproval: false,
        defaultLanguage: "en",
        removeLogo: false,
        removeBackgroundEn: false,
        removeBackgroundAr: false,
        useCustomEmailTemplate: false,
        emailTemplateSubject: "",
        emailTemplateBody: "",
        useCustomQrCode: false,
        customQrSelectedFields: {},
        qrWrapperBackground: null,
        qrWrapperBackgroundPreview: "",
        removeQrWrapperBackground: false,
      }));
    }
  }, [initialValues, isClosed]);

  useEffect(() => {
    if (!formData.useCustomEmailTemplate) {
      setEmailTemplateSubjectError(false);
      setEmailTemplateBodyError(false);
    }
  }, [formData.useCustomEmailTemplate]);

  useEffect(() => {
    if (!open) {
      setEmailTemplateSubjectError(false);
      setEmailTemplateBodyError(false);
      setActiveTab(0);
    }
  }, [open]);

  useEffect(() => {
    if (!formData.useCustomFields) {
      const classicFields = ["Full Name", "Company"];
      const hasAllClassicFields = classicFields.every(field => formData.badgeFields.includes(field));

      if (!hasAllClassicFields) {
        setFormData((prev) => ({
          ...prev,
          badgeFields: classicFields,
        }));
      }
    }
  }, [formData.useCustomFields, formData.badgeFields]);

  const measureWidths = useCallback(() => {
    setButtonWidths((prev) => {
      const widths = { ...prev };
      if (logoButtonRef.current) {
        widths.logo = logoButtonRef.current.offsetWidth || null;
      }
      if (backgroundEnButtonRef.current) {
        widths.backgroundEn = backgroundEnButtonRef.current.offsetWidth || null;
      }
      if (backgroundArButtonRef.current) {
        widths.backgroundAr = backgroundArButtonRef.current.offsetWidth || null;
      }
      return widths;
    });
  }, []);

  const logoButtonRefCallback = useCallback((node) => {
    logoButtonRef.current = node;
    if (node && activeTab === 3) {
      // Measure immediately when button mounts
      setButtonWidths((prev) => ({
        ...prev,
        logo: node.offsetWidth || null,
      }));
    }
  }, [activeTab]);

  const backgroundEnButtonRefCallback = useCallback((node) => {
    backgroundEnButtonRef.current = node;
    if (node && activeTab === 3) {
      setButtonWidths((prev) => ({
        ...prev,
        backgroundEn: node.offsetWidth || null,
      }));
    }
  }, [activeTab]);

  const backgroundArButtonRefCallback = useCallback((node) => {
    backgroundArButtonRef.current = node;
    if (node && activeTab === 3) {
      setButtonWidths((prev) => ({
        ...prev,
        backgroundAr: node.offsetWidth || null,
      }));
    }
  }, [activeTab]);

  useEffect(() => {
    if (!open) {
      return;
    }

    window.addEventListener("resize", measureWidths);

    return () => {
      window.removeEventListener("resize", measureWidths);
    };
  }, [open, measureWidths]);

  useLayoutEffect(() => {
    if (open && activeTab === 3) {
      measureWidths();
    }
  }, [activeTab, open, measureWidths]);

  useEffect(() => {
    if (open && activeTab === 3 && (formData.logoPreview || formData.backgroundEnPreview || formData.backgroundArPreview)) {
      measureWidths();
    }
  }, [formData.logoPreview, formData.backgroundEnPreview, formData.backgroundArPreview, open, activeTab, measureWidths]);

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
    } else if (name === "qrWrapperBackground" && files?.[0]) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        setFormData((prev) => ({
          ...prev,
          qrWrapperBackground: file,
          qrWrapperBackgroundPreview: URL.createObjectURL(file),
          removeQrWrapperBackground: false,
        }));
      }
    } else {
      let processedValue = value;

      if (name === "organizerPhone") {
        const digitsOnly = value.replace(/\D/g, "");
        processedValue = digitsOnly;
        if (digitsOnly) {
          const error = validatePhoneNumber(digitsOnly, organizerPhoneIsoCode);
          setOrganizerPhoneError(error || "");
        } else {
          setOrganizerPhoneError("");
        }
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
      } else if (type === "qrWrapperBackground") {
        setFormData((prev) => ({
          ...prev,
          qrWrapperBackground: null,
          qrWrapperBackgroundPreview: "",
          removeQrWrapperBackground: false,
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
        deletePayload.mediaType =
          deleteConfirm.type === "qrWrapperBackground" ? "eventQrWrapperBackground" : deleteConfirm.type;

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
      } else if (deleteConfirm.type === "qrWrapperBackground") {
        setFormData((prev) => ({
          ...prev,
          qrWrapperBackground: null,
          qrWrapperBackgroundPreview: "",
          removeQrWrapperBackground: true,
        }));
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

  const validateCurrentTab = () => {
    if (activeTab === 0) {
      if (!formData.name || !formData.startDate || !formData.endDate || !formData.venue) {
        showMessage(t.required, "error");
        return false;
      }
    }
    return true;
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

    if (formData.useCustomEmailTemplate) {
      if (!formData.emailTemplateSubject || !formData.emailTemplateSubject.trim()) {
        setEmailTemplateSubjectError(true);
        showMessage(t.emailSubjectRequired, "error");
        return;
      }
      if (!formData.emailTemplateBody || !formData.emailTemplateBody.trim() || formData.emailTemplateBody === "<p><br></p>" || formData.emailTemplateBody === "<p></p>") {
        setEmailTemplateBodyError(true);
        showMessage(t.emailBodyRequired, "error");
        return;
      }
    }

    setLoading(true);

    try {
      const filesToUpload = [];

      let logoUrl = formData.removeLogo ? null : (formData.logo ? null : (formData.logoPreview || null));
      let backgroundEn = null;
      let backgroundAr = null;
      let qrWrapperBackgroundUrl = null;
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

      if (formData.qrWrapperBackground && !formData.removeQrWrapperBackground) {
        filesToUpload.push({
          file: formData.qrWrapperBackground,
          type: "eventQrWrapperBackground",
          label: "QR wrapper background",
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
            else if (result.type === "eventQrWrapperBackground") qrWrapperBackgroundUrl = result.url;
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
        ...(isClosed && formData.startTime
          ? { startTime: convertTimeFromLocal(formData.startTime, formData.startDate, formData.timezone) }
          : {}),
        ...(isClosed && formData.endTime
          ? { endTime: convertTimeFromLocal(formData.endTime, formData.endDate || formData.startDate, formData.timezone) }
          : {}),
        ...(isClosed ? { timezone: formData.timezone } : {}),
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
        useCustomEmailTemplate: formData.useCustomEmailTemplate,
        ...(formData.useCustomEmailTemplate
          ? {
            emailTemplate: {
              subject: formData.emailTemplateSubject,
              body: formData.emailTemplateBody,
            },
          }
          : {}),
        ...(formData.useCustomFields
          ? {
            formFields: formData.formFields,
            badgeFields: formData.badgeFields || [],
            badgeCustomizations: formData.badgeCustomizations || {}
          }
          : {}),
        badgeCustomizations: formData.badgeCustomizations || {},
        customizations: formData.badgeCustomizations || {},
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
        useCustomQrCode: formData.useCustomQrCode || false,
        ...(qrWrapperBackgroundUrl ? { customQrWrapperBackgroundUrl: qrWrapperBackgroundUrl } : {}),
        ...(formData.removeQrWrapperBackground ? { removeQrWrapperBackground: "true" } : {}),
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
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2, mx: -3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => {
                const uploadsTabIndex = 3;
                const customFieldsTabIndex = 4;
                const customizeBadgeTabIndex = formData.useCustomFields ? 5 : 4;
                const customQrCodeTabIndex = formData.useCustomFields ? 6 : 5;

                if (formData.useCustomQrCode && newValue === customQrCodeTabIndex) {
                  setActiveTab(newValue);
                  return;
                }

                if (newValue === customizeBadgeTabIndex) {
                  setActiveTab(newValue);
                  return;
                }

                if (newValue === customFieldsTabIndex && formData.useCustomFields) {
                  setActiveTab(newValue);
                  return;
                }

                if (newValue === uploadsTabIndex) {
                  setActiveTab(newValue);
                  return;
                }

                if (newValue > activeTab) {
                  if (activeTab === 0) {
                    if (!formData.name || !formData.startDate || !formData.endDate || !formData.venue) {
                      showMessage(t.required, "error");
                      return;
                    }
                  }
                }

                setActiveTab(newValue);
              }}
              aria-label="event tabs"
              sx={{ px: 3 }}
            >
              <Tab label={t.eventDetailsTab} />
              <Tab label={t.organizerDetailsTab} />
              <Tab label={t.optionsTab} />
              <Tab label={t.uploadsTab} />
              {formData.useCustomFields && <Tab label={t.customFieldsTab} />}
              <Tab label={t.customizeBadgeTab} />
              {formData.useCustomQrCode && <Tab label={t.customQrCodeTab} />}
            </Tabs>
          </Box>

          {/* Tab 1: Event Details */}
          {activeTab === 0 && (
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
              {isClosed && (
                <>
                  <TextField
                    label={t.startTime}
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    label={t.endTime}
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </>
              )}
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
            </Box>
          )}

          {/* Tab 2: Organizer Details */}
          {activeTab === 1 && (
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
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
                        if (formData.organizerPhone && formData.organizerPhone.trim()) {
                          const error = validatePhoneNumber(formData.organizerPhone, iso);
                          setOrganizerPhoneError(error || "");
                        } else {
                          setOrganizerPhoneError("");
                        }
                      }}
                      disabled={false}
                      dir={dir}
                    />
                  ),
                }}
              />
            </Box>
          )}

          {/* Tab 3: Options */}
          {activeTab === 2 && (
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Default Language Selector */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                  {t.defaultLanguage}
                </Typography>
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

              {/* Custom Email Template */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.useCustomEmailTemplate}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          useCustomEmailTemplate: e.target.checked,
                        }));
                        if (!e.target.checked) {
                          setEmailTemplateSubjectError(false);
                          setEmailTemplateBodyError(false);
                        }
                      }}
                      color="primary"
                    />
                  }
                  label={t.useCustomEmailTemplate}
                  sx={{ alignSelf: "start" }}
                />
              </Box>

              {formData.useCustomEmailTemplate && (
                <>
                  <TextField
                    fullWidth
                    label={t.emailSubject}
                    value={formData.emailTemplateSubject}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        emailTemplateSubject: e.target.value,
                      }));
                      if (emailTemplateSubjectError) {
                        setEmailTemplateSubjectError(false);
                      }
                    }}
                    placeholder={t.placeholderSubject}
                    required
                    error={emailTemplateSubjectError}
                    helperText={emailTemplateSubjectError ? t.emailSubjectRequired : ""}
                  />

                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      {t.emailBody} {emailTemplateBodyError && <span style={{ color: "#d32f2f" }}>*</span>}
                    </Typography>
                    <Box
                      sx={{
                        border: emailTemplateBodyError ? "1px solid #d32f2f" : "1px solid transparent",
                        borderRadius: 1,
                      }}
                    >
                      <RichTextEditor
                        value={formData.emailTemplateBody}
                        onChange={(html) => {
                          setFormData((prev) => ({
                            ...prev,
                            emailTemplateBody: html,
                          }));
                          if (emailTemplateBodyError) {
                            setEmailTemplateBodyError(false);
                          }
                        }}
                        placeholder={t.placeholderBody}
                        dir={dir}
                      />
                    </Box>
                    {emailTemplateBodyError && (
                      <Typography variant="caption" sx={{ color: "#d32f2f", mt: 0.5, display: "block" }}>
                        {t.emailBodyRequired}
                      </Typography>
                    )}
                  </Box>
                </>
              )}

              {/* Use Custom Fields Checkbox */}
              {(isClosed || formData.eventType === "public") && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.useCustomFields}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            useCustomFields: e.target.checked,
                          }))
                        }
                        color="primary"
                      />
                    }
                    label={t.useCustomFields}
                    sx={{ alignSelf: "start" }}
                  />
                </Box>
              )}

              {initialValues && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.useCustomQrCode}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            useCustomQrCode: e.target.checked,
                            customQrSelectedFields: prev.customQrSelectedFields && typeof prev.customQrSelectedFields === "object"
                              ? prev.customQrSelectedFields
                              : {},
                          }))
                        }
                        color="primary"
                      />
                    }
                    label={t.useCustomQrCode}
                    sx={{ alignSelf: "start" }}
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Tab: Custom QR Code (visible when useCustomQrCode, last tab) */}
          {formData.useCustomQrCode && activeTab === (formData.useCustomFields ? 6 : 5) && (
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t.customQrCodeDescription}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                {t.customQrEventDetails}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {[
                  { key: "eventName", label: t.customQrEventName },
                  { key: "eventDates", label: t.customQrEventDates },
                  { key: "venue", label: t.customQrVenue },
                  ...((initialValues?.description ?? formData.description) ? [{ key: "description", label: t.customQrDescription }] : []),
                ].map(({ key, label }) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        checked={!!formData.customQrSelectedFields?.[key]}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customQrSelectedFields: {
                              ...(prev.customQrSelectedFields || {}),
                              [key]: e.target.checked,
                            },
                          }))
                        }
                        color="primary"
                      />
                    }
                    label={label}
                  />
                ))}
              </Box>
              {((initialValues?.organizerName ?? formData.organizerName) || (initialValues?.organizerEmail ?? formData.organizerEmail) || (initialValues?.organizerPhone ?? formData.organizerPhone)) && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                    {t.organizerDetails}
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {[
                      ...((initialValues?.organizerName ?? formData.organizerName) ? [{ key: "organizerName", label: t.customQrOrganizerName }] : []),
                      ...((initialValues?.organizerEmail ?? formData.organizerEmail) ? [{ key: "organizerEmail", label: t.customQrOrganizerEmail }] : []),
                      ...((initialValues?.organizerPhone ?? formData.organizerPhone) ? [{ key: "organizerPhone", label: t.customQrOrganizerPhone }] : []),
                    ].map(({ key, label }) => (
                      <FormControlLabel
                        key={key}
                        control={
                          <Checkbox
                            checked={!!formData.customQrSelectedFields?.[key]}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                customQrSelectedFields: {
                                  ...(prev.customQrSelectedFields || {}),
                                  [key]: e.target.checked,
                                },
                              }))
                            }
                            color="primary"
                          />
                        }
                        label={label}
                      />
                    ))}
                  </Box>
                </>
              )}
              {(initialValues?.logoUrl ||
                (Array.isArray(initialValues?.brandingMedia) && initialValues.brandingMedia.length > 0) ||
                initialValues?.customQrWrapper?.backgroundImage?.url) && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
                    {t.customQrUploadsSection}
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {initialValues?.logoUrl && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!formData.customQrIncludeLogo}
                            onChange={(e) => setFormData((prev) => ({ ...prev, customQrIncludeLogo: e.target.checked }))}
                            size="small"
                            color="primary"
                          />
                        }
                        label={t.customQrOptionLogo}
                      />
                    )}
                    {Array.isArray(initialValues?.brandingMedia) && initialValues.brandingMedia.length > 0 && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!formData.customQrIncludeBrandingMedia}
                            onChange={(e) => setFormData((prev) => ({ ...prev, customQrIncludeBrandingMedia: e.target.checked }))}
                            size="small"
                            color="primary"
                          />
                        }
                        label={t.customQrOptionBrandingMedia}
                      />
                    )}
                    {initialValues?.customQrWrapper?.backgroundImage?.url && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!formData.customQrIncludeBackground}
                            onChange={(e) => setFormData((prev) => ({ ...prev, customQrIncludeBackground: e.target.checked }))}
                            size="small"
                            color="primary"
                          />
                        }
                        label={t.customQrOptionBackground}
                      />
                    )}
                  </Box>
                </>
              )}
              <Tooltip title={!initialValues?._id ? t.saveEventFirstToEditQr : ""}>
                <span style={{ display: "inline-block" }}>
                  <Button
                    variant="outlined"
                    onClick={() => setCustomQrWrapperModalOpen(true)}
                    disabled={!initialValues?._id}
                    startIcon={<ICONS.edit />}
                    sx={{ alignSelf: "flex-start", mt: 1 }}
                  >
                    {t.openQrCodeEditor}
                  </Button>
                </span>
              </Tooltip>
            </Box>
          )}

          {/* Tab: Uploads */}
          {activeTab === 3 && (
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Logo Upload */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <Button
                  ref={logoButtonRefCallback}
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
                        onLoad={measureWidths}
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

              {/* QR code wrapper background */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {t.qrWrapperBackground}
                </Typography>
                <Button component="label" variant="outlined" size="small">
                  {t.uploadBackground}
                  <input
                    hidden
                    name="qrWrapperBackground"
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                  />
                </Button>
                {formData.qrWrapperBackgroundPreview && !formData.removeQrWrapperBackground && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      {initialValues && !formData.qrWrapperBackground ? t.currentQrWrapperBackground : t.preview}
                    </Typography>
                    <Box sx={{ position: "relative", display: "inline-block" }}>
                      <img
                        src={formData.qrWrapperBackgroundPreview}
                        alt="QR wrapper background"
                        style={{
                          maxWidth: 280,
                          maxHeight: 120,
                          height: "auto",
                          borderRadius: 6,
                          objectFit: "cover",
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => {
                          const fileUrl = initialValues?.customQrWrapper?.backgroundImage?.url || formData.qrWrapperBackgroundPreview;
                          handleDeleteMedia("qrWrapperBackground", fileUrl);
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
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {t.publicPageBackground}
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
                    ref={backgroundEnButtonRefCallback}
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
                            onLoadedMetadata={measureWidths}
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
                            onLoad={measureWidths}
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
                    ref={backgroundArButtonRefCallback}
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
                            onLoadedMetadata={measureWidths}
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
                            onLoad={measureWidths}
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
            </Box>
          )}

          {/* Tab: Custom Fields (conditional) */}
          {activeTab === 4 && formData.useCustomFields && (
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              {(isClosed || formData.eventType === "public") && (
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
              )}
            </Box>
          )}

          {/* Tab: Customize Badge (always visible) */}
          {activeTab === (formData.useCustomFields ? 5 : 4) && (
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              {formData.useCustomFields && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {t.customizeBadgeDescription}
                </Typography>
              )}
              {formData.useCustomFields && formData.formFields.length > 0 ? (
                <>
                  {formData.formFields.map((field, index) => (
                    <FormControlLabel
                      key={index}
                      control={
                        <Checkbox
                          checked={formData.badgeFields.includes(field.inputName)}
                          onChange={(e) => {
                            const updatedBadgeFields = e.target.checked
                              ? [...formData.badgeFields, field.inputName]
                              : formData.badgeFields.filter(
                                (name) => name !== field.inputName
                              );

                            const updatedCustomizations = e.target.checked
                              ? formData.badgeCustomizations
                              : Object.keys(formData.badgeCustomizations).reduce((acc, key) => {
                                if (key !== field.inputName) {
                                  acc[key] = formData.badgeCustomizations[key];
                                }
                                return acc;
                              }, {});

                            setFormData((prev) => ({
                              ...prev,
                              badgeFields: updatedBadgeFields,
                              badgeCustomizations: updatedCustomizations,
                            }));
                          }}
                          color="primary"
                        />
                      }
                      label={field.inputName}
                    />
                  ))}
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (formData.badgeFields.length === 0) {
                        showMessage("Please select at least one field to customize.", "warning");
                        return;
                      }
                      setBadgeCustomizationModalOpen(true);
                    }}
                    sx={{ mt: 2, alignSelf: "flex-start" }}
                  >
                    {t.customizeBadgeButton}
                  </Button>
                </>
              ) : !formData.useCustomFields ? (
                <>
                  {["Full Name", "Company"].map((fieldName) => (
                    <FormControlLabel
                      key={fieldName}
                      control={
                        <Checkbox
                          checked={true}
                          disabled={true}
                          color="primary"
                        />
                      }
                      label={fieldName}
                    />
                  ))}
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (formData.badgeFields.length === 0) {
                        showMessage("Please select at least one field to customize.", "warning");
                        return;
                      }
                      setBadgeCustomizationModalOpen(true);
                    }}
                    sx={{ mt: 2, alignSelf: "flex-start" }}
                  >
                    {t.customizeBadgeButton}
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t.noCustomFields || "No custom fields available. Please add custom fields first."}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setBadgeCustomizationModalOpen(true);
                    }}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    {t.customizeBadgeButton}
                  </Button>
                </>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Stack
            direction="row"
            spacing={2}
            sx={{ width: '100%', justifyContent: 'flex-end' }}
          >
            <Stack
              direction="row"
              spacing={2}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                gap: dir === 'rtl' ? '16px' : ''
              }}
            >
              {activeTab > 0 && (
                <Button
                  variant="outlined"
                  onClick={() => setActiveTab((prev) => prev - 1)}
                  disabled={loading}
                  startIcon={dir === 'rtl' ? <ICONS.next /> : <ICONS.back />}
                  sx={{
                    ...getStartIconSpacing(dir),
                    flex: { xs: 1, sm: 'initial' }
                  }}
                >
                  {t.back}
                </Button>
              )}

              {(() => {
                const maxTab = formData.useCustomFields
                  ? (formData.useCustomQrCode ? 6 : 5)
                  : (formData.useCustomQrCode ? 5 : 4);
                return activeTab < maxTab;
              })() ? (
                <Button
                  variant="contained"
                  onClick={() => {
                    if (validateCurrentTab()) {
                      setActiveTab((prev) => prev + 1);
                    }
                  }}
                  disabled={loading}
                  startIcon={dir === 'rtl' ? <ICONS.back /> : <ICONS.next />}
                  sx={{
                    ...getStartIconSpacing(dir),
                    flex: { xs: 1, sm: 'initial' }
                  }}
                >
                  {t.next}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <ICONS.save />
                    )
                  }
                  sx={{
                    ...getStartIconSpacing(dir),
                    flex: { xs: 1, sm: 'initial' }
                  }}
                >
                  {loading
                    ? initialValues
                      ? t.updating
                      : t.creating
                    : initialValues
                      ? t.update
                      : t.create}
                </Button>
              )}
            </Stack>
          </Stack>
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
      <BadgeCustomizationModal
        open={badgeCustomizationModalOpen}
        onClose={() => setBadgeCustomizationModalOpen(false)}
        onSave={(customizations) => {
          if (formData.useCustomFields) {
            const fieldsFromCustomizations = Object.keys(customizations).filter(key => key !== "_qrCode");
            setFormData((prev) => ({
              ...prev,
              badgeCustomizations: customizations,
              badgeFields: fieldsFromCustomizations,
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              badgeCustomizations: customizations,
              badgeFields: ["Full Name", "Company"],
            }));
          }
        }}
        selectedFields={formData.badgeFields}
        allFields={formData.useCustomFields ? formData.formFields : [
          { inputName: "Full Name" },
          { inputName: "Company" }
        ]}
        showQrOnBadge={formData.showQrOnBadge}
        badgeCustomizations={formData.badgeCustomizations}
      />

      <DefaultQrWrapperModal
        open={customQrWrapperModalOpen}
        onClose={() => setCustomQrWrapperModalOpen(false)}
        config={{ defaultQrWrapper: initialValues?.customQrWrapper || {} }}
        mode="event"
        eventId={initialValues?._id}
        eventData={{
          name: initialValues?.name ?? formData.name,
          startDate: initialValues?.startDate ?? formData.startDate,
          endDate: initialValues?.endDate ?? formData.endDate,
          venue: initialValues?.venue ?? formData.venue,
          description: initialValues?.description ?? formData.description,
          organizerName: initialValues?.organizerName ?? formData.organizerName,
          organizerEmail: initialValues?.organizerEmail ?? formData.organizerEmail,
          organizerPhone: initialValues?.organizerPhone ?? (formData.organizerPhone ? `${getCountryCodeByIsoCode(organizerPhoneIsoCode)?.code || ""}${formData.organizerPhone}`.trim() : ""),
          logoUrl: initialValues?.logoUrl,
          brandingMedia: initialValues?.brandingMedia,
        }}
        selectedFields={formData.customQrSelectedFields || {}}
        includeLogo={!!formData.customQrIncludeLogo}
        includeBrandingMedia={!!formData.customQrIncludeBrandingMedia}
        includeBackground={!!formData.customQrIncludeBackground}
        onSaveEventQrWrapper={async (eventId, payload) => {
          const updateFn = isClosed ? updateCheckInEventCustomQrWrapper : updatePublicEventCustomQrWrapper;
          const updatedEvent = await updateFn(eventId, payload);
          if (initialValues?._id && updatedEvent && !updatedEvent.error && updatedEvent._id) {
            Object.assign(initialValues, updatedEvent);
            setFormData((prev) => ({
              ...prev,
              customQrIncludeLogo: !!(updatedEvent?.customQrWrapper?.logo?.url),
              customQrIncludeBrandingMedia: !!(Array.isArray(updatedEvent?.customQrWrapper?.brandingMedia?.items) && updatedEvent.customQrWrapper.brandingMedia.items.length > 0),
              customQrIncludeBackground: !!(updatedEvent?.customQrWrapper?.backgroundImage?.url),
              customQrSelectedFields: getSelectedFieldsFromWrapper(updatedEvent?.customQrWrapper),
            }));
          }
          setCustomQrWrapperModalOpen(false);
        }}
      />
    </>
  );
};

export default EventModal;
