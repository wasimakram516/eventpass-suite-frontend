"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  InputLabel,
  FormControl,
  IconButton,
  ListSubheader,
  alpha,
  InputAdornment,
  useTheme,
} from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import { useParams, useRouter } from "next/navigation";
import LanguageSelector from "@/components/LanguageSelector";
import { createRegistration } from "@/services/eventreg/registrationService";
import { initiatePayment } from "@/services/eventreg/paymentService";
import { getPublicEventBySlug } from "@/services/eventreg/eventService";
import ICONS from "@/utils/iconUtil";
import resolveTicketDependentFields from "@/utils/resolveTicketDependentFields";
import { translateTexts } from "@/services/translationService";
import { applyTranslationOverridesToArray } from "@/utils/translationOverrides";
import Background from "@/components/Background";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { computePaymentBreakdown, formatOmr } from "@/utils/paymentBreakdown";
import CountryCodeSelector from "@/components/CountryCodeSelector";
import CountryPicker from "@/components/CountryPicker";
import SearchableSelect from "@/components/SearchableSelect";
import { normalizePhone } from "@/utils/phoneUtils";
import { DEFAULT_COUNTRY_CODE, DEFAULT_ISO_CODE, COUNTRY_CODES, getCountryCodeByIsoCode } from "@/utils/countryCodes";
import { validatePhoneNumber } from "@/utils/phoneValidation";
import { uploadSingleFile } from "@/utils/mediaUpload";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
import { RESERVED_CUSTOMIZATION_KEYS } from "@/utils/badgeSize";
import { useMessage } from "@/contexts/MessageContext";
import { downloadDefaultQrWrapperAsImage, hasDefaultQrWrapperDesign, hasWrapperDesign } from "@/utils/defaultQrWrapperDownload";
import BadgePreview from "@/components/badges/BadgePreview";
import BadgeCard from "@/components/badges/BadgeCard";
import html2canvas from "html2canvas";
export default function Registration() {
  const { eventSlug, lang } = useParams();
  const isArabic = lang === "ar";
  const router = useRouter();
  const dir = isArabic ? "rtl" : "ltr";
  const theme = useTheme();

  const t = {
    registerForEvent: isArabic
      ? "التسجيل في الفعالية"
      : "Register for the Event",
    fullName: isArabic ? "الاسم الكامل" : "Full Name",
    phone: isArabic ? "رقم الهاتف" : "Phone Number",
    email: isArabic ? "البريد الإلكتروني" : "Email",
    company: isArabic ? "الشركة (اختياري)" : "Company (optional)",
    submit: isArabic ? "إرسال" : "Submit",
    registrationSuccess: isArabic
      ? "تم التسجيل بنجاح!"
      : "Registration Successful!",
    thankYou: isArabic
      ? "شكراً لتسجيلك. نتطلع لرؤيتك!"
      : "Thank you for registering. We look forward to seeing you!",
    viewEvent: isArabic ? "عرض الفعالية" : "View Event",
    required: isArabic ? "مطلوب" : "is required",
    invalidEmail: isArabic
      ? "عنوان البريد الإلكتروني غير صالح"
      : "Invalid email address",
    registrationFailed: isArabic ? "فشل التسجيل." : "Failed to register.",
    yourToken: isArabic ? "رمزك" : "Your Token",
    saveQr: isArabic ? "حفظ رمز QR" : "Save QR Code",
    registerAnother: isArabic
      ? "إغلاق وإجراء تسجيل آخر"
      : "Close and Make Another Registration",
    thankYouForRegistering: isArabic
      ? "شكرًا لتسجيلك."
      : "Thank you for registering.",
    downloadQr: isArabic ? "تحميل رمز الاستجابة السريعة" : "Download QR Code",
    qrError: isArabic ? "فشل في إنشاء رمز الاستجابة السريعة." : "QR Code generation failed.",
    approvalPendingMessage: isArabic
      ? "يرجى الانتظار حتى يوافق المسؤول على تسجيلك."
      : "Please wait for the admin to approve your registration.",
    duplicatePaidTitle: isArabic ? "أنت مسجَّل بالفعل" : "You're already registered",
    duplicatePaidMessage: isArabic
      ? "يوجد بالفعل تسجيل مؤكد لهذه الفعالية بهذا البريد الإلكتروني أو رقم الهاتف. لقد أعدنا إرسال تذكرتك وتأكيد التسجيل إلى بريدك الإلكتروني، يرجى التحقق من صندوق الوارد (ومجلد الرسائل غير المرغوب فيها)."
      : "This email or phone number already has a confirmed registration for this event. We've re-sent your ticket and confirmation to your email — please check your inbox (and spam folder).",
    duplicatePendingTitle: isArabic ? "الدفع لم يكتمل بعد" : "Payment outstanding",
    duplicatePendingMessage: isArabic
      ? "يوجد بالفعل تسجيل قيد الإجراء لهذه الفعالية بهذا البريد الإلكتروني أو رقم الهاتف، ولم تكتمل عملية الدفع بعد. لقد أعدنا إرسال رابط الدفع الآمن إلى بريدك الإلكتروني."
      : "This email or phone number already has a registration in progress for this event, and payment hasn't been completed yet. We've re-sent the secure payment link to your email.",
    duplicatePendingExpiry: isArabic ? "ستنتهي صلاحية الرابط في:" : "This link will expire on:",
    duplicatePendingAutoDelete: isArabic
      ? "إذا تعذر عليك إتمام الدفع قبل ذلك، ستتم إزالة هذا التسجيل تلقائيًا، ويمكنك حينها التسجيل مرة أخرى."
      : "If you're unable to complete payment before then, this registration will be automatically removed and you can register again.",
    resumePaymentNow: isArabic ? "استئناف الدفع الآن" : "Resume Payment Now",
    duplicateSupportLine: isArabic
      ? "إذا واجهت أي إزعاج أو اعتقدت أن هذا خطأ، يرجى التواصل مع فريق الدعم لدينا على"
      : "If you're experiencing any inconvenience, or think this is a mistake, please contact our support team at",
    conflictGenericTitle: isArabic ? "التسجيل موجود بالفعل" : "Registration already exists",
    conflictGenericMessage: isArabic
      ? "يوجد بالفعل تسجيل لهذه الفعالية. يرجى التواصل مع فريق الدعم للمساعدة."
      : "A registration already exists for this event. Please contact our support team for help.",
    conflictEmailOnlyTitle: isArabic ? "البريد الإلكتروني مسجل بالفعل" : "Email already registered",
    conflictEmailOnlyMessage: isArabic
      ? "يوجد تسجيل بهذا البريد الإلكتروني ولكن برقم هاتف مختلف. إذا لم يكن هذا أنت، يرجى التواصل مع الدعم، أو يمكنك استخدام عنوان بريد إلكتروني آخر (تأكد من أنه نشط، حيث سيُرسل تسجيلك إليه)."
      : "A registration with this email already exists, but with a different phone number. If this isn't you, please contact support, or you can use a different email address (make sure it's active, since your registration will be sent there).",
    conflictPhoneOnlyTitle: isArabic ? "رقم الهاتف مسجل بالفعل" : "Phone number already registered",
    conflictPhoneOnlyMessage: isArabic
      ? "يوجد تسجيل بهذا الرقم ولكن ببريد إلكتروني مختلف. إذا لم يكن هذا أنت، يرجى التواصل مع الدعم، أو يمكنك استخدام رقم هاتف آخر (تأكد من أنه نشط، حيث قد يتم التواصل معك بخصوص تسجيلك)."
      : "A registration with this phone number already exists, but with a different email address. If this isn't you, please contact support, or you can use a different phone number (make sure it's active, since you may be contacted about your registration).",
    selectTicket: isArabic ? "اختر نوع التذكرة" : "Select a Ticket",
    ticketSoldOut: isArabic ? "نفدت التذاكر" : "Sold Out",
    ticketRequired: isArabic ? "يرجى اختيار نوع التذكرة." : "Please select a ticket type.",
    proceedToPayment: isArabic ? "المتابعة للدفع" : "Proceed to Payment",
    unlimitedCapacity: isArabic ? "غير محدود" : "Unlimited",
    available: isArabic ? "متاح" : "available",
    omr: isArabic ? "ر.ع." : "OMR",
    paymentSummary: isArabic ? "ملخص الدفع" : "Payment Summary",
    paymentSummaryNote: isArabic
      ? "يرجى مراجعة التفاصيل أدناه قبل المتابعة إلى بوابة الدفع."
      : "Please review the details below before proceeding to the payment gateway.",
    ticketLabel: isArabic ? "التذكرة" : "Ticket",
    subtotal: isArabic ? "المجموع الفرعي" : "Subtotal",
    vatLabel: isArabic ? "ضريبة القيمة المضافة" : "VAT",
    totalLabel: isArabic ? "الإجمالي" : "Total",
    confirmAndPay: isArabic ? "تأكيد والدفع" : "Confirm & Pay",
    cancel: isArabic ? "إلغاء" : "Cancel",
    securePayment: isArabic ? "دفع آمن عبر ثواني" : "Secure payment via Thawani",
    ticketCaption: isArabic ? "تذكرة" : "Ticket",
    amountDue: isArabic ? "المبلغ المستحق" : "Amount due",
    downloadBadge: isArabic ? "تحميل الشارة" : "Download Badge",
    fileUploadFailed: isArabic ? "فشل رفع الملف. يرجى المحاولة مرة أخرى." : "File upload failed. Please try again.",
    businessSlugError: isArabic ? "معرف النشاط التجاري غير متاح لرفع الملفات." : "Business slug not available for file upload.",
    chooseFileOrDrop: isArabic ? "اختر ملفًا أو اسحب وأفلت" : "Choose File or Drag & Drop",
  };

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [translations, setTranslations] = useState({});
  const [translationsReady, setTranslationsReady] = useState(false);
  const [translatedEvent, setTranslatedEvent] = useState(null);
  const [qrToken, setQrToken] = useState(null);
  const [registrationData, setRegistrationData] = useState(null);
  const [countryIsoCodes, setCountryIsoCodes] = useState({});
  const [fileData, setFileData] = useState({});
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState(null);
  const [ticketTypeError, setTicketTypeError] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");
  // Paid-event payment summary dialog
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [paymentPayload, setPaymentPayload] = useState(null);
  const [payProcessing, setPayProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  // Set when initiatePayment reports an existing registration (paid or still-
  // pending) for the same email/phone, instead of creating a new checkout.
  const [duplicateNotice, setDuplicateNotice] = useState(null);
  // Set when initiatePayment blocks the attempt because only one identity
  // field (email XOR phone) matched a different registration — a likely
  // different person, not the same registrant retrying, so no checkout is
  // created/resumed and nothing is resent.
  const [conflictReason, setConflictReason] = useState(null);
  const qrCodeRef = useRef(null);
  const badgePreviewRef = useRef(null);
  const { globalConfig } = useGlobalConfig();
  const { showMessage } = useMessage();
  const ticketDependentFields = useMemo(() => {
    if (!selectedTicketTypeId || !event?.globalDependentFields?.length || !event?.globalDependentFieldMappings) {
      return [];
    }
    const selectedTt = event.ticketTypes?.find(tt => tt._id === selectedTicketTypeId);
    if (!selectedTt) return [];
    return resolveTicketDependentFields(event, selectedTt)
      .filter(f => f.inputName?.trim() && f.visible !== false)
      .map(f => ({
        name: f.inputName,
        label: f.inputName,
        type: f.inputType || "text",
        required: f.required || false,
        visible: true,
        options: f.values || [],
      }));
  }, [selectedTicketTypeId, event]);
  useEffect(() => {
    if (!ticketDependentFields.length) return;
    setFormData(prev => {
      const newVals = {};
      ticketDependentFields.forEach(f => {
        if (!(f.name in prev)) newVals[f.name] = "";
      });
      return { ...prev, ...newVals };
    });
  }, [ticketDependentFields]);
  const hasCustomDesign =
    event?.useCustomQrCode && event?.customQrWrapper && hasWrapperDesign(event.customQrWrapper);
  const hasDefaultDesign = hasDefaultQrWrapperDesign(globalConfig);

  // Compute which fields are visible based on parent-dependent relationships
  const getVisibleFields = useCallback((fields, data) => {
    const dependentsOf = {};
    fields.forEach((f) => {
      if (f.dependents) {
        try {
          const depMap = JSON.parse(f.dependents);
          Object.entries(depMap).forEach(([option, config]) => {
            (config.fieldIds || []).forEach((childName) => {
              if (!dependentsOf[childName]) dependentsOf[childName] = [];
              dependentsOf[childName].push({ parentName: f.name, option });
            });
          });
        } catch { }
      }
    });

    return fields.filter((f) => {
      const deps = dependentsOf[f.name];
      if (!deps || deps.length === 0) return true;
      return deps.some((d) => data[d.parentName] === d.option);
    });
  }, []);

  const visibleFields = useMemo(() => getVisibleFields(dynamicFields, formData), [dynamicFields, formData]);

  // Fetch event + translate event metadata
  useEffect(() => {
    const fetchEvent = async () => {
      const result = await getPublicEventBySlug(eventSlug);
      if (!result?.error) {
        setEvent(result);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [eventSlug, lang]);

  // Prepare dynamic fields + batch translation for event & form fields
  useEffect(() => {
    if (!event) return;

    const defaultFields = [
      { name: "fullName", label: "Full Name", type: "text", required: true },
      { name: "phone", label: "Phone Number", type: "text", required: false },
      { name: "email", label: "Email", type: "text", required: true },
      { name: "company", label: "Company", type: "text", required: false },
    ];

    const fields = event.useCustomFields && event.formFields?.length
      ? event.formFields
        .filter((f) => f.visible !== false)
        .map((f) => ({
          name: f.inputName,
          label: f.inputName,
          type: f.inputType,
          options: f.values || [],
          required: f.required,
          placeholder: f.placeholder || "",
          dependents: f.dependents,
        }))
      : defaultFields;

    // initialize form
    const initial = {};
    const initialCountryIsoCodes = {};
    fields.forEach((f) => {
      if (f.name) {
        initial[f.name] = "";
      }
      if (f.type === "phone" || ((!event.useCustomFields || !event.formFields?.length) && f.name === "phone")) {
        initialCountryIsoCodes[f.name] = DEFAULT_ISO_CODE;
      }
    });
    setDynamicFields(fields);
    setFormData(initial);
    setCountryIsoCodes(initialCountryIsoCodes);

    const translateAll = async () => {
      const textsToTranslate = new Set();

      // Event-level fields
      if (event.name) textsToTranslate.add(event.name);
      if (event.venue) textsToTranslate.add(event.venue);
      if (event.description) textsToTranslate.add(event.description);
      if (event.footnote) textsToTranslate.add(event.footnote);

      // Form fields: labels, options, placeholders
      fields.forEach((f) => {
        if (f.label) textsToTranslate.add(f.label);
        if (f.placeholder) textsToTranslate.add(f.placeholder);
      });

      const textArray = Array.from(textsToTranslate).filter(
        (t) => typeof t === "string" && t.trim() !== ""
      );

      if (!textArray.length) {
        setTranslatedEvent(event);
        setTranslationsReady(true);
        return;
      }

      try {
        const rawResults = await translateTexts(textArray, lang);
        const results = applyTranslationOverridesToArray(rawResults, lang);
        const map = {};
        textArray.forEach((txt, i) => (map[txt] = results[i] || txt));

        const translatedEvent = {
          ...event,
          name: map[event.name] || event.name,
          venue: map[event.venue] || event.venue,
          description: map[event.description] || event.description,
          footnote: map[event.footnote] || event.footnote,
          formFields:
            event.formFields?.map((f) => ({
              ...f,
              inputName: map[f.inputName] || f.inputName,
              values: f.values,
              placeholder: map[f.placeholder] || f.placeholder,
            })) || event.formFields,
        };

        const translationMap = {};
        fields.forEach((f) => {
          translationMap[f.label] = map[f.label] || f.label;
          (f.options || []).forEach((o) => {
            translationMap[o] = map[o] || o;
          });
        });

        setTranslations(translationMap);
        setTranslatedEvent(translatedEvent);
      } catch (err) {
        console.error("⚠️ Translation error:", err);
        setTranslatedEvent(event);
      } finally {
        setTranslationsReady(true);
      }
    };

    setTranslationsReady(false);
    translateAll();
  }, [event, lang]);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      // Find if this field has dependents and clear their values when option changes
      const parentField = dynamicFields.find((f) => f.name === name);
      if (parentField?.dependents) {
        try {
          const depMap = JSON.parse(parentField.dependents);
          const allChildIds = new Set();
          Object.values(depMap).forEach((config) => {
            (config.fieldIds || []).forEach((id) => allChildIds.add(id));
          });
          if (allChildIds.size > 0) {
            const cleared = {};
            allChildIds.forEach((childName) => {
              if (prev[childName] !== undefined) {
                cleared[childName] = "";
              }
            });
            return { ...prev, [name]: value, ...cleared };
          }
        } catch { }
      }
      return { ...prev, [name]: value };
    });
    setFieldErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleCountryCodeChange = (fieldName, isoCode) => {
    setCountryIsoCodes((p) => ({ ...p, [fieldName]: isoCode }));
  };

  const handlePhoneChange = (fieldName, value) => {
    const digitsOnly = value.replace(/\D/g, "");
    setFormData((p) => ({ ...p, [fieldName]: digitsOnly }));
    setFieldErrors((p) => ({ ...p, [fieldName]: "" }));
  };

  const handleFileSelect = (fieldName, file) => {
    // Revoke previous preview URL if exists
    if (fileData[fieldName]?.preview) {
      URL.revokeObjectURL(fileData[fieldName].preview);
    }
    const preview = URL.createObjectURL(file);
    setFileData((p) => ({ ...p, [fieldName]: { file, preview } }));
    setFormData((p) => ({ ...p, [fieldName]: file.name }));
    setFieldErrors((p) => ({ ...p, [fieldName]: "" }));
  };

  const handleFileRemove = (fieldName) => {
    if (fileData[fieldName]?.preview) {
      URL.revokeObjectURL(fileData[fieldName].preview);
    }
    setFileData((p) => {
      const next = { ...p };
      delete next[fieldName];
      return next;
    });
    setFormData((p) => ({ ...p, [fieldName]: "" }));
  };

  // Track fileData via ref for cleanup on unmount
  const fileDataRef = useRef(fileData);
  fileDataRef.current = fileData;
  useEffect(() => {
    return () => {
      Object.values(fileDataRef.current).forEach((fd) => {
        if (fd?.preview) URL.revokeObjectURL(fd.preview);
      });
    };
  }, []);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);


  const handleSubmit = async () => {
    // const errors = {};
    // visibleFields.forEach((f) => {
    const errors = {};
    const currentVisible = getVisibleFields(dynamicFields, formData);
    const allValidationFields = [
      ...currentVisible,
      ...ticketDependentFields.filter(f => f.visible !== false),
    ];
    allValidationFields.forEach((f) => {
      if (!f || !f.name) return;
      const val = formData[f.name]?.trim();
      if (f.required && !val) errors[f.name] = `${f.label} ${t.required}`;
      if (
        (f.type === "email" || f.name.toLowerCase() === "email") &&
        val &&
        !isValidEmail(val)
      )
        errors[f.name] = t.invalidEmail;

      if ((f.type === "phone" || ((!event.useCustomFields || !event.formFields?.length) && f.name.toLowerCase() === "phone")) && val) {
        const isoCode = countryIsoCodes[f.name] || DEFAULT_ISO_CODE;
        const phoneError = validatePhoneNumber(val, isoCode);
        if (phoneError) {
          errors[f.name] = phoneError;
        }
      }
    });

    let hasTicketError = false;
    if (event?.isPaid && !selectedTicketTypeId) {
      setTicketTypeError(t.ticketRequired);
      hasTicketError = true;
    } else {
      setTicketTypeError("");
    }

    if (Object.keys(errors).length || hasTicketError) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    const normalizedFormData = { ...formData };
    let phoneIsoCode = null;

    // Upload file-type fields to S3
    const fileUploadFields = allValidationFields.filter(f => f.type === "file" && fileData[f.name]?.file);
    if (fileUploadFields.length > 0 && !event?.businessSlug) {
      setFieldErrors({ _global: t.businessSlugError }); setSubmitting(false);
      return;
    }
    for (const f of fileUploadFields) {
      try {
        const url = await uploadSingleFile({
          file: fileData[f.name].file,
          businessSlug: event.businessSlug,
          moduleName: "eventreg",
        });
        normalizedFormData[f.name] = url;
      } catch (err) {
        console.error("File upload failed:", err);
        setFieldErrors({ [f.name]: t.fileUploadFailed }); setSubmitting(false);
        return;
      }
    }

    allValidationFields.forEach((f) => {
      if (f.type === "phone" || ((!event.useCustomFields || !event.formFields?.length) && f.name.toLowerCase() === "phone")) {
        const phoneValue = normalizedFormData[f.name];
        if (phoneValue) {
          const isoCode = countryIsoCodes[f.name] || DEFAULT_ISO_CODE;
          const country = getCountryCodeByIsoCode(isoCode);
          const countryCode = country?.code || DEFAULT_COUNTRY_CODE;
          const fullPhone = phoneValue.startsWith("+")
            ? phoneValue
            : `${countryCode}${phoneValue}`;
          const normalized = normalizePhone(fullPhone);

          phoneIsoCode = isoCode;

          // Store phone without country code
          if (normalized && normalized.startsWith("+")) {
            const extracted = normalized.substring(countryCode.length).trim();
            normalizedFormData[f.name] = extracted;
          } else {
            normalizedFormData[f.name] = normalized;
          }
        }
      }
    });

    // Paid event — stash the prepared payload and show the price-breakdown
    // dialog. The actual gateway call happens from the dialog's "Confirm & Pay".
    if (event?.isPaid) {
      const currentDepFieldNames = new Set(ticketDependentFields.map(f => f.name));
      const allGlobalDepNames = new Set((event?.globalDependentFields || []).map(f => f.inputName));

      const prunedFormData = Object.fromEntries(
        Object.entries(normalizedFormData).filter(([key]) => {
          if (!allGlobalDepNames.has(key)) return true;
          return currentDepFieldNames.has(key);
        })
      );

      let timezone = null;
      try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
      } catch {
        timezone = null;
      }

      setPaymentPayload({
        eventSlug,
        ticketTypeId: selectedTicketTypeId,
        lang,
        ...prunedFormData,
        isoCode: phoneIsoCode,
        timezone,
      });
      setPaymentError("");
      setSubmitting(false);
      setShowPaymentSummary(true);
      return;
    }
    // Free event — normal registration flow
    const result = await createRegistration({
      ...normalizedFormData,
      slug: eventSlug,
      isoCode: phoneIsoCode,
    });
    setSubmitting(false);

    if (!result?.error) {
      setShowDialog(true);
      if (event?.showQrAfterRegistration) setQrToken(result.token);
      setRegistrationData(result.registration || { ...normalizedFormData, token: result.token });

      const resetData = {};
      const resetIsoCodes = {};
      currentVisible.forEach(f => {
        if (f.name) resetData[f.name] = "";
        if (f.type === "phone" || ((!event.useCustomFields || !event.formFields?.length) && f.name.toLowerCase() === "phone")) {
          resetIsoCodes[f.name] = DEFAULT_ISO_CODE;
        }
      });
      setFormData(resetData);
      setCountryIsoCodes(resetIsoCodes);
      // Clean up file data
      Object.values(fileData).forEach(fd => { if (fd?.preview) URL.revokeObjectURL(fd.preview); });
      setFileData({});
    } else {
      setFieldErrors({ _global: result.message || t.registrationFailed });
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    router.replace(`/eventreg/${lang}/event/${eventSlug}`);
  };

  // Fires from the payment-summary dialog — creates the Thawani session and
  const handleConfirmPayment = async () => {
    if (!paymentPayload) return;
    setPayProcessing(true);
    setPaymentError("");
    setDuplicateNotice(null);
    setConflictReason(null);
    const result = await initiatePayment(paymentPayload);
    const duplicateStatus = result?.duplicateStatus || result?.data?.duplicateStatus;

    if (!result?.error && duplicateStatus) {
      // An existing registration already covers this email/phone — show a
      // clear info message (the backend already re-sent the relevant email)
      // instead of silently redirecting to a fresh/resumed checkout.
      setPayProcessing(false);
      setDuplicateNotice({
        status: duplicateStatus,
        expiresAt: result?.expiresAt || result?.data?.expiresAt || null,
        sessionUrl: result?.sessionUrl || result?.data?.sessionUrl || null,
      });
      return;
    }

    const sessionUrl = result?.sessionUrl || result?.data?.sessionUrl;
    if (!result?.error && sessionUrl) {
      window.location.href = sessionUrl;
    } else {
      setPayProcessing(false);
      const conflict = result?.conflictReason || result?.data?.conflictReason;
      if (conflict) {
        setConflictReason(conflict);
      } else {
        setPaymentError(result?.message || t.registrationFailed);
      }
    }
  };

  const conflictCopy = (reason) => {
    if (reason === "EMAIL_ONLY_PENDING") {
      return { title: t.conflictEmailOnlyTitle, message: t.conflictEmailOnlyMessage };
    }
    if (reason === "PHONE_ONLY_PENDING") {
      return { title: t.conflictPhoneOnlyTitle, message: t.conflictPhoneOnlyMessage };
    }
    // EMAIL_ONLY_PAID, PHONE_ONLY_PAID, SPLIT all share the same generic
    // wording — the backend never reveals which field mismatched once a paid
    // registration is involved.
    return { title: t.conflictGenericTitle, message: t.conflictGenericMessage };
  };

  // Formats a payment-link expiry in the visitor's own browser timezone,
  // e.g. "Friday, 10 July 2026, 02:30 PM GMT+5" — no server-side timezone
  // detection needed since this renders live in the visitor's own browser.
  const formatExpiryLocal = (expiresAt) => {
    if (!expiresAt) return "";
    try {
      return new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "shortOffset",
      }).format(new Date(expiresAt));
    } catch {
      return new Date(expiresAt).toLocaleString();
    }
  };

  // Live breakdown for the selected ticket (base + event fees + VAT).
  const selectedTicket = event?.ticketTypes?.find((tt) => tt._id === selectedTicketTypeId) || null;
  const paymentBreakdown = selectedTicket
    ? computePaymentBreakdown(selectedTicket.price, event?.fees || [], event?.vatPercentage ?? 0)
    : null;

  // image background only (no videos on registration page)
  const getImageBackground = useMemo(() => {
    if (!event || !event.background) return null;

    const langKey = lang === "ar" ? "ar" : "en";
    const bg = event.background[langKey];

    if (bg && typeof bg === 'object' && bg.url && bg.fileType === "image") {
      return bg.url;
    }

    const otherLangKey = lang === "ar" ? "en" : "ar";
    const otherBg = event.background[otherLangKey];
    if (otherBg && typeof otherBg === 'object' && otherBg.url && otherBg.fileType === "image") {
      return otherBg.url;
    }

    if (event.backgroundUrl) {
      return event.backgroundUrl;
    }

    return null;
  }, [event, lang]);

  const imageBackgroundUrl = getImageBackground;

  // Loading
  if (loading || !event || !translatedEvent || !translationsReady) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
        <Background />
        <CircularProgress />
      </Box>
    );
  }

  // Render fields
  const renderField = (field) => {
    const errorMsg = fieldErrors[field.name];
    const fieldLabel = translations[field.label] || field.label;

    const commonProps = {
      fullWidth: true,
      name: field.name,
      label: fieldLabel,
      value: formData[field.name] || "",
      onChange: handleInputChange,
      error: !!errorMsg,
      helperText: errorMsg || "",
      required: field.required,
      sx: { mb: 2 },
    };

    if (field.type === "radio")
      return (
        <Box key={field.name} sx={{ mb: 2, textAlign: "center" }}>
          <Typography sx={{ mb: 1 }}>
            {fieldLabel}
            {field.required && <Typography component="span" sx={{ color: "error.main" }}> *</Typography>}
          </Typography>
          <RadioGroup
            row
            name={field.name}
            value={formData[field.name] ?? ""}
            onChange={handleInputChange}
            sx={{ justifyContent: "center", gap: 2 }}
          >
            {field.options.map((opt) => (
              <FormControlLabel
                key={`${field.name}-${opt}`}
                value={opt}
                control={<Radio sx={{ p: 0.5 }} />}
                label={translations[opt] || opt}
              />
            ))}
          </RadioGroup>
          {errorMsg && (
            <Typography variant="caption" color="error">
              {errorMsg}
            </Typography>
          )}
        </Box>
      );

    if (field.type === "list")
      return (
        <SearchableSelect
          key={field.name}
          name={field.name}
          label={fieldLabel}
          value={formData[field.name] ?? ""}
          onChange={handleInputChange}
          options={field.options.map((opt) => ({ value: opt, label: translations[opt] || opt }))}
          required={field.required}
          error={!!errorMsg}
          helperText={errorMsg || ""}
          lang={isArabic ? "ar" : "en"}
          dir={dir}
          sx={{ mb: 2 }}
        />
      );

    if (field.type === "country") {
      return (
        <Box key={field.name} sx={{ mb: 2 }}>
          <CountryPicker
            label={fieldLabel}
            value={formData[field.name] || ""}
            onChange={(iso) => handleInputChange({ target: { name: field.name, value: iso } })}
            required={field.required}
            error={!!errorMsg}
            helperText={errorMsg || ""}
            lang={isArabic ? "ar" : "en"}
            dir={dir}
          />
        </Box>
      );
    }

    if (field.type === "file") {
      const fd = fileData[field.name];
      return (
        <FileUploadField
          key={field.name}
          field={field}
          fd={fd}
          fieldLabel={fieldLabel}
          errorMsg={errorMsg}
          isArabic={isArabic}
          chooseFileOrDrop={t.chooseFileOrDrop}
          onFileSelect={(file) => handleFileSelect(field.name, file)}
          onFileRemove={() => handleFileRemove(field.name)}
        />
      );
    }

    const isPhoneField = field.type === "phone" || ((!event.useCustomFields || !event.formFields?.length) && field.name.toLowerCase() === "phone");
    const useInternationalNumbers = event.useInternationalNumbers !== false;

    if (isPhoneField) {
      const isoCode = countryIsoCodes[field.name] || DEFAULT_ISO_CODE;
      const phoneValue = formData[field.name] || "";

      return (
        <TextField
          key={field.name}
          {...commonProps}
          value={phoneValue}
          onChange={(e) => handlePhoneChange(field.name, e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <CountryCodeSelector
                  value={isoCode}
                  onChange={(iso) => handleCountryCodeChange(field.name, iso)}
                  disabled={!useInternationalNumbers}
                  dir={dir}
                />
              ),
            }
          }}
        />
      );
    }

    return (
      <TextField
        key={field.name}
        {...commonProps}
        type={
          field.type === "number"
            ? "number"
            : field.type === "email" || field.name.toLowerCase() === "email"
              ? "email"
              : "text"
        }
      />
    );
  };

  const { name, description, logoUrl, footnote } = translatedEvent || event;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        px: 2,
        py: 4,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Image Background */}
      {imageBackgroundUrl && (
        <Box
          component="img"
          src={imageBackgroundUrl}
          alt="Event background"
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: -1,
            pointerEvents: "none",
          }}
        />
      )}
      {!imageBackgroundUrl && <Background />}
      {logoUrl && (
        <Box
          sx={{
            width: "100%",
            maxWidth: 1040,
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: 3,
            mt: { xs: 6, sm: 0 },
          }}
        >
          <Box
            component="img"
            src={logoUrl}
            alt={`${name} Logo`}
            sx={{
              display: "block",
              width: "100%",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </Box>
      )}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, width: '100%', maxWidth: 1040, justifyContent: 'center', alignItems: 'flex-start' }}>
        <Paper
          dir={dir}
          elevation={3}
          sx={{
            flex: 1,
            width: "100%",
            maxWidth: 600,
            borderRadius: 3,
            p: { xs: 2, sm: 4 },
            textAlign: "center",
            backdropFilter: "blur(6px)",
            backgroundColor: (theme) => theme.palette.overlay.cardTransparent,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              mb: 1
            }}>
            {name}
          </Typography>
          {description && (
            <Box
              sx={{
                mb: 3,
                color: "text.secondary",
                fontSize: "0.875rem",
                "& h1": { fontSize: "2em", fontWeight: "bold", margin: "0.67em 0" },
                "& h2": { fontSize: "1.5em", fontWeight: "bold", margin: "0.75em 0" },
                "& h3": { fontSize: "1.17em", fontWeight: "bold", margin: "0.83em 0" },
                "& ul, & ol": { margin: "1em 0", paddingLeft: "2.5em" },
                "& ul": { listStyleType: "disc" },
                "& ol": { listStyleType: "decimal" },
                "& li": { margin: "0.5em 0" },
                "& p": { margin: "1em 0" },
                "& strong, & b": { fontWeight: "bold" },
                "& em, & i": { fontStyle: "italic" },
                "& u": { textDecoration: "underline" },
                "& s, & strike": { textDecoration: "line-through" },
              }}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}

          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              mb: 2
            }}>
            {t.registerForEvent}
          </Typography>

          {fieldErrors._global && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {fieldErrors._global}
            </Alert>
          )}

          {/* Ticket type selector for paid events */}
          {event?.isPaid && event?.ticketTypes?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth error={!!ticketTypeError}>
                <InputLabel id="ticket-type-label">
                  {t.selectTicket} *
                </InputLabel>
                <Select
                  labelId="ticket-type-label"
                  value={selectedTicketTypeId || ""}
                  label={`${t.selectTicket} *`}
                  onChange={(e) => {
                    const newTicketId = e.target.value;
                    setSelectedTicketTypeId(newTicketId);
                    setTicketTypeError("");

                    // Clear old dependent field values when ticket changes
                    setFormData(prev => {
                      const allDepFieldNames = (event?.globalDependentFields || []).map(f => f.inputName);
                      const cleared = {};
                      allDepFieldNames.forEach(name => {
                        if (name in prev) cleared[name] = "";
                      });
                      return { ...prev, ...cleared };
                    });
                  }}
                  onClose={() => setTicketSearch("")}
                  inputProps={{ dir }}
                  sx={{
                    textAlign: "start",
                    "& .MuiSelect-icon": {
                      right: isArabic ? "unset" : undefined,
                      left: isArabic ? 7 : "unset",
                    },
                    "& .MuiSelect-select": {
                      display: "flex",
                      justifyContent: "flex-start",
                      ...(isArabic
                        ? { paddingRight: "14px !important", paddingLeft: "32px !important" }
                        : {}),
                    },
                  }}
                  MenuProps={{ autoFocus: false }}
                  slotProps={{ paper: { sx: { maxHeight: 360 } } }}
                  renderValue={(val) => {
                    const tt = event.ticketTypes.find((x) => x._id === val);
                    if (!tt) return "";
                    return (
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, width: "100%" }}>
                        <Typography variant="body2" fontWeight={600} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {tt.name}
                        </Typography>
                        <Typography variant="body2" color="primary.main" fontWeight={700} sx={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                          {tt.price} {t.omr}
                        </Typography>
                      </Box>
                    );
                  }}
                >
                  {event.ticketTypes.length > 5 && (
                    <ListSubheader sx={{ bgcolor: "background.paper", pt: 1, pb: 0.5 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder={isArabic ? "بحث عن تذكرة…" : "Search tickets…"}
                        value={ticketSearch}
                        onChange={(e) => setTicketSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        autoFocus
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <ICONS.search fontSize="small" />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </ListSubheader>
                  )}
                  {event.ticketTypes.map((tt) => {
                    const isSoldOut = tt.capacity !== null && tt.sold >= tt.capacity;
                    const remaining = tt.capacity !== null ? tt.capacity - (tt.sold || 0) : null;
                    const isLowStock = remaining !== null && remaining > 0 && remaining <= 20;
                    const q = ticketSearch.toLowerCase().trim();
                    const matches = !q || tt.name.toLowerCase().includes(q);
                    return (
                      <MenuItem
                        key={tt._id}
                        value={tt._id}
                        disabled={isSoldOut}
                        style={{ display: event.ticketTypes.length > 5 ? (matches ? "flex" : "none") : "flex" }}
                        sx={{ "&:not(:last-of-type)": { borderBottom: "1px solid", borderColor: "divider" } }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 2, py: 0.5 }}>
                          {/* The menu Paper's width tracks the (often wide) anchor field —
                              MUI sets an inline minWidth there that beats any CSS maxWidth
                              on the Paper — so the wrap has to be forced here instead. */}
                          <Box sx={{ minWidth: 0, maxWidth: 320 }}>
                            <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                              {tt.name}
                            </Typography>
                            {tt.description && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3, whiteSpace: "normal", wordBreak: "break-word" }}>
                                {tt.description}
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              sx={{ display: "block", color: isSoldOut ? "error.main" : isLowStock ? "warning.main" : "text.secondary", fontWeight: isSoldOut || isLowStock ? 600 : 400 }}
                            >
                              {isSoldOut ? t.ticketSoldOut : remaining !== null ? `${remaining} ${t.available}` : ""}                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={700} color={isSoldOut ? "text.disabled" : "primary.main"} sx={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                            {isSoldOut ? "—" : `${tt.price} ${t.omr}`}
                          </Typography>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
                {ticketTypeError && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block", textAlign: "start", px: 1.5 }}>
                    {ticketTypeError}
                  </Typography>
                )}
              </FormControl>
              {ticketDependentFields.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {ticketDependentFields.map(f => renderField(f))}
                </Box>
              )}
            </Box>
          )}

          {visibleFields.map((f) => renderField(f))}

          <Button
            variant="contained"
            fullWidth
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? <CircularProgress size={22} /> : event?.isPaid ? t.proceedToPayment : t.submit}
          </Button>

          {footnote && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", whiteSpace: "pre-line", textAlign: "start", fontStyle: "italic", mt: 1.5 }}
            >
              {footnote}
            </Typography>
          )}
        </Paper>

        {event?.showBadgePreviewDuringRegistration && (
          <Box sx={{ flex: 1, width: '100%', maxWidth: 400, position: { md: 'sticky' }, top: { md: 24 }, mt: { md: -1.5 } }}>
            <BadgePreview
              registration={formData}
              event={translatedEvent || event}
              preview={true}
              badgeFields={(() => { const keys = Object.keys(event?.customizations || {}).filter(k => !RESERVED_CUSTOMIZATION_KEYS.includes(k)); return keys.length > 0 ? keys : ["Full Name", "Company"]; })()}
              phoneIsoCodes={countryIsoCodes}
              filePreviews={Object.fromEntries(Object.entries(fileData).map(([k, v]) => [k, v ? { preview: v.preview, fileType: v.file?.type || "" } : null]).filter(([, v]) => v && v.preview))}
            />
          </Box>
        )}
      </Box>
      {/* Payment summary dialog (paid events) */}
      <Dialog
        open={showPaymentSummary}
        onClose={() => { if (!payProcessing) { setShowPaymentSummary(false); setDuplicateNotice(null); setConflictReason(null); } }}
        maxWidth="xs"
        fullWidth
        dir={dir}
        slotProps={{
          paper: {
            sx: {
              overflow: "hidden",
              boxShadow: theme.palette.shadow.dialogLarge,
            },
          },
        }}
      >
        {/* Header band */}
        <Box
          sx={{
            background: (theme) => theme.palette.gradients.infoCard, color: "common.white",
            px: 3,
            pt: 3,
            pb: 2.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              flexShrink: 0,
              backgroundColor: theme.palette.overlay.glassLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ICONS.list sx={{ fontSize: 24, color: theme.palette.common.white }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              {t.paymentSummary}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85, lineHeight: 1.4, display: "block" }}>
              {t.paymentSummaryNote}
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ px: 3, pt: 2.5, pb: 2 }}>
          {paymentBreakdown && (
            <Box>
              {/* Ticket base — emphasized line */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body1" fontWeight={700} noWrap>
                    {selectedTicket?.name || t.ticketLabel}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t.ticketCaption}
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={700} sx={{ whiteSpace: "nowrap", pl: 1 }}>
                  {formatOmr(paymentBreakdown.base, t.omr)}
                </Typography>
              </Box>

              {/* Fees */}
              {paymentBreakdown.feeLines.map((fee, i) => (
                <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.6 }}>
                  <Typography variant="body2" color="text.secondary">
                    {fee.name} <Box component="span" sx={{ opacity: 0.7 }}>· {fee.percentage}%</Box>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap", pl: 1 }}>
                    {formatOmr(fee.amount, t.omr)}
                  </Typography>
                </Box>
              ))}

              {/* Subtotal (only when there are fees or VAT) */}
              {(paymentBreakdown.feeLines.length > 0 || paymentBreakdown.vatAmount > 0) && (
                <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.9, mt: 0.5, borderTop: "1px dashed", borderColor: "divider" }}>
                  <Typography variant="body2" color="text.secondary">{t.subtotal}</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: "nowrap", pl: 1 }}>
                    {formatOmr(paymentBreakdown.subtotal, t.omr)}
                  </Typography>
                </Box>
              )}

              {/* VAT */}
              {paymentBreakdown.vatAmount > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.6 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t.vatLabel} <Box component="span" sx={{ opacity: 0.7 }}>· {paymentBreakdown.vatPercentage}%</Box>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap", pl: 1 }}>
                    {formatOmr(paymentBreakdown.vatAmount, t.omr)}
                  </Typography>
                </Box>
              )}

              {/* Total — highlighted */}
              <Box
                sx={{
                  mt: 1.5,
                  px: 2,
                  py: 1.5,
                  borderRadius: 2.5,
                  backgroundColor: (theme) => theme.palette.overlay.infoCard,

                  border: (theme) =>
                    `1px solid ${theme.palette.overlay.infoCardBorder}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                    {t.amountDue}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={800}>{t.totalLabel}</Typography>
                </Box>
                <Typography variant="h6" fontWeight={800} color="primary.dark" sx={{ whiteSpace: "nowrap", pl: 1 }}>
                  {formatOmr(paymentBreakdown.total, t.omr)}
                </Typography>
              </Box>

              {/* Trust note */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, mt: 2 }}>
                <ICONS.verified sx={{ fontSize: 16, color: "success.main" }} />
                <Typography variant="caption" color="text.secondary">
                  {t.securePayment}
                </Typography>
              </Box>
            </Box>
          )}

          {conflictReason ? (
            <Box
              sx={{
                backgroundColor: (theme) => alpha(theme.palette.error.main, 0.12),
                borderLeft:
                  dir === "rtl"
                    ? "none"
                    : (theme) => `4px solid ${theme.palette.error.main}`,
                borderRight:
                  dir === "rtl"
                    ? (theme) => `4px solid ${theme.palette.error.main}`
                    : "none", borderRadius: 1,
                p: 2,
                mt: 2,
                textAlign: dir === "rtl" ? "right" : "left",
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                {conflictCopy(conflictReason).title}
              </Typography>
              <Typography variant="body2">
                {conflictCopy(conflictReason).message}
              </Typography>
              {(globalConfig?.support?.email || globalConfig?.contact?.email) && (
                <Typography variant="body2" sx={{ mt: 1.5 }}>
                  {t.duplicateSupportLine}{" "}
                  <a
                    href={`mailto:${globalConfig?.support?.email || globalConfig?.contact?.email}`}
                    style={{ color: theme.palette.error.main, fontWeight: 600, textDecoration: "none" }}
                  >
                    {globalConfig?.support?.email || globalConfig?.contact?.email}
                  </a>
                </Typography>
              )}
            </Box>
          ) : duplicateNotice ? (
            <Box
              sx={{
                backgroundColor: (theme) => alpha(theme.palette.info.main, 0.12),

                borderLeft:
                  dir === "rtl"
                    ? "none"
                    : (theme) => `4px solid ${theme.palette.info.main}`,

                borderRight:
                  dir === "rtl"
                    ? (theme) => `4px solid ${theme.palette.info.main}`
                    : "none", borderRadius: 1,
                p: 2,
                mt: 2,
                textAlign: dir === "rtl" ? "right" : "left",
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                {duplicateNotice.status === "paid" ? t.duplicatePaidTitle : t.duplicatePendingTitle}
              </Typography>
              <Typography variant="body2">
                {duplicateNotice.status === "paid" ? t.duplicatePaidMessage : t.duplicatePendingMessage}
              </Typography>
              {duplicateNotice.status === "pending" && duplicateNotice.expiresAt && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>{t.duplicatePendingExpiry}</strong> {formatExpiryLocal(duplicateNotice.expiresAt)}
                </Typography>
              )}
              {duplicateNotice.status === "pending" && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {t.duplicatePendingAutoDelete}
                </Typography>
              )}
              {(globalConfig?.support?.email || globalConfig?.contact?.email) && (
                <Typography variant="body2" sx={{ mt: 1.5 }}>
                  {t.duplicateSupportLine}{" "}
                  <a
                    href={`mailto:${globalConfig?.support?.email || globalConfig?.contact?.email}`}
                    style={{ color: theme.palette.info.main, fontWeight: 600, textDecoration: "none" }}
                  >
                    {globalConfig?.support?.email || globalConfig?.contact?.email}
                  </a>
                </Typography>
              )}
            </Box>
          ) : (
            paymentError && <Alert severity="error" sx={{ mt: 2 }}>{paymentError}</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>
          {conflictReason || duplicateNotice ? (
            <>
              <Button
                onClick={() => { setShowPaymentSummary(false); setDuplicateNotice(null); setConflictReason(null); }}
                sx={{ textTransform: "none", fontWeight: 700, color: "text.secondary" }}
              >
                {t.cancel}
              </Button>
              {duplicateNotice?.status === "pending" && duplicateNotice?.sessionUrl && (
                <Button
                  variant="contained"
                  onClick={() => { window.location.href = duplicateNotice.sessionUrl; }}
                  startIcon={<ICONS.payment />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    px: 3,
                    py: 1.1,
                    boxShadow: (theme) => theme.palette.shadow.infoCard, ...getStartIconSpacing(dir),
                  }}
                >
                  {t.resumePaymentNow}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                onClick={() => setShowPaymentSummary(false)}
                disabled={payProcessing}
                sx={{ textTransform: "none", fontWeight: 700, color: "text.secondary" }}
              >
                {t.cancel}
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirmPayment}
                disabled={payProcessing || !paymentBreakdown}
                startIcon={!payProcessing ? <ICONS.payment /> : undefined}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2.5,
                  px: 3,
                  py: 1.1,
                  boxShadow: (theme) => theme.palette.shadow.infoCard, ...getStartIconSpacing(dir),
                }}
              >
                {payProcessing ? <CircularProgress size={22} color="inherit" /> : t.confirmAndPay}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Success dialog */}
      <Dialog
        open={showDialog}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        dir={dir}
      >
        <DialogTitle sx={{ textAlign: "center", position: "relative" }}>
          {/* Close IconButton */}
          <IconButton
            onClick={handleDialogClose}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 36,
              height: 36,
              bgcolor: "error.main",
              color: "common.white",
              boxShadow: 2,
              "&:hover": {
                bgcolor: "error.dark",
              },
            }}
          >
            <ICONS.close sx={{ fontSize: 22 }} />
          </IconButton>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mt: 1
            }}>
            <ICONS.checkCircle sx={{ fontSize: 44, color: "success.main", mb: 0.5 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                fontSize: "1.1rem"
              }}>
              {t.registrationSuccess}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ textAlign: "center", px: 1 }}>
          {/* Hidden QR for download logic if preview is shown */}
          {qrToken && (
            <Box sx={{ display: "none" }} ref={qrCodeRef}>
              <QRCodeCanvas
                id="qr-code-download-hidden"
                value={qrToken}
                size={180}
                bgColor="background.paper"
                includeMargin
              />
            </Box>
          )}

          {event?.showBadgeCardAfterRegistration && registrationData ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', mt: 2, mb: 2 }}>
              <Box ref={badgePreviewRef} sx={{ display: 'inline-block', mt: 0 }}>
                <BadgeCard
                  registration={registrationData}
                  event={translatedEvent || event}
                  module={event?.module}
                  qrRef={qrCodeRef}
                  t={t}
                  compact={true}
                />
              </Box>
            </Box>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {t.thankYouForRegistering}
              </Typography>

              {/* Approval message (does NOT block QR anymore) */}
              {event?.requiresApproval && (
                <Box
                  sx={{
                    backgroundColor: (theme) => theme.palette.overlay.warningCard,

                    borderLeft: (theme) =>
                      dir === "rtl"
                        ? "none"
                        : `4px solid ${theme.palette.overlay.warningCardBorder}`,

                    borderRight: (theme) =>
                      dir === "rtl"
                        ? `4px solid ${theme.palette.overlay.warningCardBorder}`
                        : "none",
                    borderRadius: 1,
                    p: 2,
                    mb: 3,
                    textAlign: dir === "rtl" ? "right" : "left",
                    mx: "auto",
                    width: "fit-content",
                    maxWidth: "100%",
                  }}
                >
                  <Typography variant="body1">
                    {t.approvalPendingMessage}
                  </Typography>
                </Box>
              )}

              {/* Show QR ONLY if event.showQrAfterRegistration is true */}
              {event?.showQrAfterRegistration && qrToken && (
                <>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                    {t.yourToken}
                  </Typography>

                  <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                    <Box
                      sx={{
                        px: 2,
                        py: 0.5,
                        backgroundColor: "primary.main",
                        color: "common.white",
                        borderRadius: "20px",
                        fontWeight: 600,
                        fontFamily: "monospace",
                        fontSize: 16,
                      }}
                    >
                      {qrToken}
                    </Box>
                  </Box>

                  {/* QR canvas */}
                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      justifyContent: "center"
                    }}>
                    <Paper
                      id="qr-container"
                      elevation={3}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: (theme) => theme.palette.background.paper,
                        display: "inline-block",
                      }}
                    >
                      <QRCodeCanvas
                        id="qr-code"
                        value={qrToken}
                        size={180}
                        bgColor={(theme) => theme.palette.background.paper}
                        includeMargin
                        style={{
                          padding: "12px",
                          background: (theme) => theme.palette.background.paper,
                          borderRadius: "8px",
                        }}
                      />
                    </Paper>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          {/* Download BadgeCard button */}
          {event?.showBadgeCardAfterRegistration && registrationData && (
            <Button
              variant="contained"
              color="primary"
              onClick={async () => {
                const badgeElement = badgePreviewRef.current;
                if (!badgeElement) return;

                try {
                  const canvas = await html2canvas(badgeElement, {
                    backgroundColor: null,
                    useCORS: true,
                    scale: Math.max(window.devicePixelRatio || 1, 2),
                    logging: false,
                  });
                  const link = document.createElement("a");
                  link.href = canvas.toDataURL("image/png");
                  link.download = `badge-${qrToken || "download"}.png`;
                  link.click();
                } catch (err) {
                  console.error(err);
                  showMessage(t.qrError, "error");
                }
              }}
            >
              {t.downloadBadge}            </Button>
          )}

          {/* Download QR button (only when QR is shown) */}
          {event?.showQrAfterRegistration && qrToken && (
            <Button
              variant="contained"
              color="primary"
              onClick={async () => {
                const downloadName = `qr-${qrToken}.png`;
                if (hasCustomDesign) {
                  try {
                    await downloadDefaultQrWrapperAsImage(event.customQrWrapper, qrToken, downloadName, {
                      fonts: globalConfig?.fonts ?? [],
                    });
                  } catch (err) {
                    showMessage(t.qrError, "error");
                  }
                  return;
                }
                if (hasDefaultDesign && globalConfig?.defaultQrWrapper) {
                  try {
                    await downloadDefaultQrWrapperAsImage(globalConfig.defaultQrWrapper, qrToken, downloadName, {
                      fonts: globalConfig.fonts ?? [],
                    });
                  } catch (err) {
                    showMessage(t.qrError, "error");
                  }
                  return;
                }
                const canvas = qrCodeRef.current?.querySelector("canvas");
                if (!canvas) {
                  showMessage(t.qrError, "error");
                  return;
                }
                const qrDataURL = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.href = qrDataURL;
                link.download = downloadName;
                link.click();
              }}
            >
              {t.downloadQr}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <LanguageSelector top={20} right={20} />
    </Box>
  );
}

function FileUploadField({ field, fd, fieldLabel, errorMsg, isArabic, chooseFileOrDrop, onFileSelect, onFileRemove }) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <Box sx={{ mb: 2, textAlign: isArabic ? "right" : "left" }}>
      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, textAlign: "start" }}>
        {fieldLabel}
        {field.required && <Typography component="span" sx={{ color: "error.main" }}> *</Typography>}
      </Typography>
      {fd ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1, pr: 2, border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "background.paper", textAlign: "left", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
          {fd.file.type.startsWith("image/") ? (
            <Box component="img" src={fd.preview} alt="Preview" sx={{ width: 48, height: 48, borderRadius: 1.5, objectFit: "contain", bgcolor: "grey.100", flexShrink: 0 }} />
          ) : fd.file.type.startsWith("video/") ? (
            <Box component="video" src={fd.preview} sx={{ width: 48, height: 48, borderRadius: 1.5, objectFit: "contain", bgcolor: "grey.100", flexShrink: 0 }} />
          ) : (
            <ICONS.upload sx={{ fontSize: 28, color: "text.secondary", mx: 0.5, flexShrink: 0 }} />
          )}
          <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fd.file.name}
          </Typography>
          <IconButton onClick={onFileRemove} size="small" sx={{ bgcolor: "error.main",  color: "error.contrastText", "&:hover": { bgcolor: "error.dark" }, width: 28, height: 28, flexShrink: 0 }}>
            <ICONS.delete sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      ) : (
        <Box
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) onFileSelect(file); }}
          sx={{
            border: "2px dashed",
            borderColor: dragOver ? "primary.main" : "divider",
            borderRadius: 3,
            py: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            bgcolor: dragOver ? "action.hover" : "transparent",
            transition: "border-color 0.2s, background-color 0.2s",
          }}
          onClick={() => document.getElementById(`file-input-${field.name}`)?.click()}
        >
          <ICONS.upload sx={{ fontSize: 28, color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            {/* {isArabic ? "اختر ملفًا أو اسحب وأفلت" : "Choose File or Drag & Drop"} */}
            {chooseFileOrDrop}
          </Typography>
          <input id={`file-input-${field.name}`} type="file" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) onFileSelect(file); e.target.value = ""; }} />
        </Box>
      )}
      {errorMsg && <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>{errorMsg}</Typography>}
    </Box>
  );
}
