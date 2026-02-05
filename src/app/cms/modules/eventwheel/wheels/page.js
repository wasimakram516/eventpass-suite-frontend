"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
  TextField,
  MenuItem,
  Tooltip,
  Divider,
  Container,
  Stack,
  Chip,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";

import { useRouter } from "next/navigation";
import {
  getAllSpinWheels,
  createSpinWheel,
  updateSpinWheel,
  deleteSpinWheel,
} from "@/services/eventwheel/spinWheelService";
import { getAllBusinesses } from "@/services/businessService";
import ShareLinkModal from "@/components/modals/ShareLinkModal";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import BusinessDrawer from "@/components/drawers/BusinessDrawer";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import { useAuth } from "@/contexts/AuthContext";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import LoadingState from "@/components/LoadingState";
import RecordMetadata from "@/components/RecordMetadata";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import slugify from "@/utils/slugify";
import CircularProgress from "@mui/material/CircularProgress";
import { uploadMediaFiles } from "@/utils/mediaUpload";
import MediaUploadProgress from "@/components/MediaUploadProgress";
import { deleteMedia } from "@/services/deleteMediaService";
import { useMessage } from "@/contexts/MessageContext";
import { getEventsByBusinessId } from "@/services/eventreg/eventService";
const translations = {
  en: {
    spinWheelManagement: "Spin Wheel Management",
    managingWheelsFor: "Managing wheels for",
    selectBusinessToView:
      "Select a business to view and manage its spin wheels.",
    selectBusiness: "Select Business",
    createSpinWheel: "Create Spin Wheel",
    collectInfo: "Collect Info",
    enterNames: "Enter Names",
    slug: "Slug",
    business: "Business",
    noBusiness: "No Business",
    created: "Created",
    notAvailable: "Not Available",
    invalidDate: "Invalid Date",
    shareSpinWheel: "Share Spin Wheel",
    manageParticipants: "Manage Participants",
    editSpinWheel: "Edit Spin Wheel",
    deleteSpinWheel: "Delete Spin Wheel",
    edit: "Edit",
    delete: "Delete",
    wheelTitle: "Wheel Title",
    wheelType: "Wheel Type",
    urlHelper: "This will be used in the URL (e.g., /spin-wheel/your-slug)",
    uploadLogo: "Upload Logo",
    uploadBackground: "Upload Background",
    selected: "Selected",
    cancel: "Cancel",
    save: "Save",
    deleteWheelTitle: "Delete Spin Wheel?",
    deleteWheelMessage:
      "Are you sure you want to move this item to the Recycle Bin?",
    adminLabel: "Admin (Admin adds names)",
    adminChipLabel: "Admin",
    onSpotLabel: "On-Spot (Participants enter their names)",
    onSpotChipLabel: "On-Spot",
    syncedLabel: "Sync Registrations (Sync with event registrations)",
    syncedChipLabel: "Synced",
    shareSpinWheelTitle: "Share Spin Wheel",
    participants: "Participants",
    participantCount: "Participant Count",
    createdBy: "Created:",
    createdAt: "Created At:",
    updatedBy: "Updated:",
    updatedAt: "Updated At:",
  },
  ar: {
    spinWheelManagement: "إدارة عجلة الدوران",
    managingWheelsFor: "إدارة العجلات لـ",
    selectBusinessToView: "اختر عملاً لعرض وإدارة عجلات الدوران الخاصة به.",
    selectBusiness: "اختيار العمل",
    createSpinWheel: "إنشاء عجلة دوران",
    collectInfo: "جمع المعلومات",
    enterNames: "إدخال الأسماء",
    slug: "الرابط المختصر",
    business: "العمل",
    noBusiness: "لا يوجد عمل",
    created: "تم الإنشاء",
    notAvailable: "غير متوفر",
    invalidDate: "تاريخ غير صالح",
    shareSpinWheel: "مشاركة عجلة الدوران",
    manageParticipants: "إدارة المشاركين",
    editSpinWheel: "تعديل عجلة الدوران",
    deleteSpinWheel: "حذف عجلة الدوران",
    edit: "تعديل",
    delete: "حذف",
    wheelTitle: "عنوان العجلة",
    wheelType: "نوع العجلة",
    urlHelper: "سيتم استخدام هذا في الرابط (مثال: /spin-wheel/your-slug)",
    uploadLogo: "رفع شعار",
    uploadBackground: "رفع خلفية",
    selected: "مختار",
    cancel: "إلغاء",
    save: "حفظ",
    deleteWheelTitle: "حذف عجلة الدوران؟",
    deleteWheelMessage:
      "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    adminLabel: "إدارة (المشرف يضيف الأسماء)",
    adminChipLabel: "إدارة",
    onSpotLabel: "على الفور (المشاركون يدخلون أسماءهم)",
    onSpotChipLabel: "على الفور",
    syncedLabel: "مزامنة التسجيلات (مزامنة مع تسجيلات الحدث)",
    syncedChipLabel: "متزامن",
    shareSpinWheelTitle: "مشاركة عجلة الدوران",
    participants: "المشاركون",
    participantCount: "عدد المشاركين",
    createdBy: "أنشئ:",
    createdAt: "تاريخ الإنشاء:",
    updatedBy: "حدث:",
    updatedAt: "تاريخ التحديث:",
  },
};

const Dashboard = () => {
  const router = useRouter();
  const { user, selectedBusiness, setSelectedBusiness } = useAuth();
  const { t, dir, language } = useI18nLayout(translations);
  const { showMessage } = useMessage();
  const [spinWheels, setSpinWheels] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openShareModal, setOpenShareModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedWheel, setSelectedWheel] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [shareTitle, setShareTitle] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const eventTypes = [
    { label: t.adminLabel, value: "admin" },
    {
      label: t.onSpotLabel,
      value: "onspot",
    },
    {
      label: t.syncedLabel,
      value: "synced",
    },
  ];
  const typeMap = {
    admin: {
      chipText: t.adminChipLabel,
      label: t.adminLabel,
      color: "primary",
    },
    onspot: {
      chipText: t.onSpotChipLabel,
      label: t.onSpotLabel,
      color: "secondary",
    },
    synced: {
      chipText: t.syncedChipLabel,
      label: t.syncedLabel,
      color: "info",
    },
  };

  const [form, setForm] = useState({
    business: "",
    title: "",
    slug: "",
    type: "admin",
    logo: null,
    background: null,
    logoPreview: "",
    backgroundPreview: "",
    removeLogo: false,
    removeBackground: false,
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    type: null,
    fileUrl: null,
  });
  const [buttonWidths, setButtonWidths] = useState({
    logo: null,
    background: null,
  });
  const logoButtonRef = useRef(null);
  const backgroundButtonRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  const wheelType = form.type;
  const selectedBusinessObject = businesses.find(
    (business) => business.slug === selectedBusiness
  );

  const selectedBusinessId = selectedBusinessObject?._id || "";

  useEffect(() => {
    if (wheelType !== "synced" || !selectedBusinessId) {
      setEvents([]);
      setSelectedEventId("");
      return;
    }

    getEventsByBusinessId(selectedBusinessId)
      .then((res) => {
        setEvents(res?.events || []);
      })
      .catch(() => {
        setEvents([]);
      });
  }, [wheelType, selectedBusinessId]);

  useEffect(() => {
    const initializeBusinesses = async () => {
      setLoading(true);
      const businessList = await getAllBusinesses();
      setBusinesses(businessList);

      if (user?.role === "business" && !selectedBusiness) {
        const userBusiness = businessList.find(
          (business) =>
            business.slug === user.business?.slug ||
            business._id === user.business?._id
        );
        if (userBusiness) {
          setSelectedBusiness(userBusiness.slug);
          fetchSpinWheels(userBusiness.slug);
        }
      } else if (selectedBusiness) {
        fetchSpinWheels(selectedBusiness);
      }
      setLoading(false);
    };

    initializeBusinesses();
  }, [user, selectedBusiness, setSelectedBusiness]);

  const fetchSpinWheels = useCallback(
    async (businessSlug = "") => {
      setLoading(true);
      const wheelList = await getAllSpinWheels();
      const filteredWheels = businessSlug
        ? wheelList.filter(
          (wheel) =>
            wheel.business?.slug === businessSlug ||
            wheel.business?._id ===
            businesses.find((b) => b.slug === businessSlug)?._id
        )
        : wheelList;

      setSpinWheels(filteredWheels);
      setLoading(false);
    },
    [businesses]
  );
  const handleBusinessSelect = (businessSlug) => {
    setSelectedBusiness(businessSlug);
    fetchSpinWheels(businessSlug);
    setDrawerOpen(false);
  };

  const handleOpenModal = (wheel = null) => {
    setSelectedWheel(wheel);

    setForm(
      wheel
        ? {
          business:
            wheel.business?._id ||
            wheel.business ||
            selectedBusinessObject?._id ||
            "",
          title: wheel.title,
          slug: wheel.slug,
          type: wheel.type,
          logo: null,
          background: null,
          logoPreview: wheel.logoUrl || "",
          backgroundPreview: wheel.backgroundUrl || "",
          removeLogo: false,
          removeBackground: false,
        }
        : {
          business: selectedBusinessObject?._id || "",
          title: "",
          slug: "",
          type: "admin",
          logo: null,
          background: null,
          logoPreview: "",
          backgroundPreview: "",
          removeLogo: false,
          removeBackground: false,
        }
    );

    if (wheel?.type === "synced") {
      setSelectedEventId(wheel?.eventSource?.eventId || "");
    } else {
      setSelectedEventId("");
    }

    setLogoPreview(wheel?.logoUrl || null);
    setBackgroundPreview(wheel?.backgroundUrl || null);
    setErrors({});
    setShowUploadProgress(false);
    setUploadProgress([]);
    setDeleteConfirm({ open: false, type: null, fileUrl: null });
    setOpenModal(true);
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if (name === "logo" && file) {
      const preview = URL.createObjectURL(file);
      setForm((prev) => ({
        ...prev,
        logo: file,
        logoPreview: preview,
        removeLogo: false,
      }));
      setLogoPreview(preview);
    }
    if (name === "background" && file) {
      const preview = URL.createObjectURL(file);
      setForm((prev) => ({
        ...prev,
        background: file,
        backgroundPreview: preview,
        removeBackground: false,
      }));
      setBackgroundPreview(preview);
    }
  };

  useEffect(() => {
    const measureWidths = () => {
      const widths = {
        logo: logoButtonRef.current?.offsetWidth || null,
        background: backgroundButtonRef.current?.offsetWidth || null,
      };
      setButtonWidths(widths);
    };

    const timeoutId = setTimeout(measureWidths, 100);
    window.addEventListener("resize", measureWidths);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", measureWidths);
    };
  }, [form.logoPreview, form.backgroundPreview]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === "title") {
        return {
          ...prev,
          title: value,
          slug: slugify(value),
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const validateShortName = (slug) => {
    return slug.toLowerCase().trim().replace(/\s+/g, "-");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.title || form.title.trim() === "") {
      newErrors.title = "Title is required";
    }
    if (!form.slug || form.slug.trim() === "") {
      newErrors.slug = "Slug is required";
    }
    if (!form.type || form.type.trim() === "") {
      newErrors.type = "Type is required";
    }
    // Logo and background are optional, so no validation needed
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDeleteMedia = (type, fileUrl) => {
    if (fileUrl && fileUrl.startsWith("blob:")) {
      if (type === "logo") {
        setForm((prev) => ({
          ...prev,
          logo: null,
          logoPreview: "",
          removeLogo: false,
        }));
        setLogoPreview("");
        URL.revokeObjectURL(fileUrl);
      } else if (type === "background") {
        setForm((prev) => ({
          ...prev,
          background: null,
          backgroundPreview: "",
          removeBackground: false,
        }));
        setBackgroundPreview("");
        URL.revokeObjectURL(fileUrl);
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
      if (!selectedBusinessObject?.slug) {
        showMessage("Business information is missing", "error");
        return;
      }

      const deletePayload = {
        fileUrl: deleteConfirm.fileUrl,
        storageType: "s3",
      };

      if (selectedWheel?._id) {
        deletePayload.spinWheelId = selectedWheel._id;
        deletePayload.mediaType = deleteConfirm.type;
      }

      const updatedWheel = await deleteMedia(deletePayload);

      if (deleteConfirm.type === "logo") {
        setForm((prev) => ({
          ...prev,
          logo: null,
          logoPreview: "",
          removeLogo: true,
        }));
        setLogoPreview("");
      } else if (deleteConfirm.type === "background") {
        setForm((prev) => ({
          ...prev,
          background: null,
          backgroundPreview: "",
          removeBackground: true,
        }));
        setBackgroundPreview("");
      }

      if (selectedWheel?._id && updatedWheel && !updatedWheel.error) {
        if (updatedWheel._id) {
          Object.assign(selectedWheel, updatedWheel);
        }
      }

      setDeleteConfirm({ open: false, type: null, fileUrl: null });
      showMessage("Media deleted successfully", "success");
    } catch (err) {
      showMessage(err.message || "Failed to delete media", "error");
    }
  };

  const handleSaveEvent = async () => {
    if (!validateForm()) return;

    if (!selectedBusinessObject?.slug) {
      showMessage("Business information is missing", "error");
      return;
    }

    setSaving(true);

    try {
      const filesToUpload = [];
      let logoUrl = form.removeLogo
        ? null
        : form.logo
          ? null
          : form.logoPreview || null;
      let backgroundUrl = form.removeBackground
        ? null
        : form.background
          ? null
          : form.backgroundPreview || null;

      if (form.logo && !form.removeLogo) {
        filesToUpload.push({
          file: form.logo,
          type: "logo",
          label: "Logo",
        });
      }

      if (form.background && !form.removeBackground) {
        filesToUpload.push({
          file: form.background,
          type: "background",
          label: "Background",
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
        }));

        setUploadProgress(uploads);

        const urls = await uploadMediaFiles({
          files: filesToUpload.map((item) => item.file),
          businessSlug: selectedBusinessObject.slug,
          moduleName: "EventWheel",
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

        setShowUploadProgress(false);

        filesToUpload.forEach((item, index) => {
          if (urls && urls[index]) {
            if (item.type === "logo") {
              logoUrl = urls[index];
            } else if (item.type === "background") {
              backgroundUrl = urls[index];
            }
          }
        });
      }

      const formattedSlug = validateShortName(form.slug);
      const payload = {
        business: form.business || selectedBusinessObject?._id || "",
        title: form.title,
        slug: formattedSlug,
        type: form.type,
        logoUrl: logoUrl || null,
        backgroundUrl: backgroundUrl || null,
      };

      if (wheelType === "synced") {
        payload.eventSource = {
          enabled: true,
          eventId: selectedEventId,
        };
      }

      if (selectedWheel) {
        await updateSpinWheel(selectedWheel._id, payload);
      } else {
        await createSpinWheel(payload);
      }

      fetchSpinWheels(selectedBusiness);
      setOpenModal(false);
    } catch (error) {
      console.error("Save failed:", error);
      showMessage(error.message || "Failed to save spin wheel", "error");
    } finally {
      setSaving(false);
      setShowUploadProgress(false);
    }
  };

  const handleDeleteEvent = (wheel) => {
    setSelectedWheel(wheel);
    setConfirmDelete(true);
  };

  const confirmDeleteEvent = async () => {
    if (selectedWheel && selectedWheel._id) {
      await deleteSpinWheel(selectedWheel._id);
      fetchSpinWheels(selectedBusiness);
    }
    setConfirmDelete(false);
    setSelectedWheel(null);
  };

  const handleNavigateToParticipants = (slug) => {
    router.push(`/cms/modules/eventwheel/wheels/${slug}/participants`);
  };

  const handleOpenShareModal = (slug, type) => {
    const url =
      type === "admin" || type === "synced"
        ? `${window.location.origin}/eventwheel/spin/${slug}`
        : `${window.location.origin}/eventwheel/wheels/${slug}`;
    setShareUrl(url);
    setShareTitle(
      `${t.shareSpinWheelTitle}: ${spinWheels.find((w) => w.slug === slug)?.title || slug
      }`
    );

    setTimeout(() => {
      setOpenShareModal(true);
    }, 0);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setErrors({});
  };

  return (
    <Box dir={dir} sx={{ display: "flex", minHeight: "100vh" }}>
      {(user?.role === "admin" || user?.role === "superadmin") && (
        <BusinessDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          businesses={businesses}
          selectedBusinessSlug={selectedBusiness}
          onSelect={handleBusinessSelect}
        />
      )}

      {/* Main Content */}
      <Container maxWidth="lg">
        <BreadcrumbsNav />

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
          <Box sx={{ flex: { xs: "1 1 100%", sm: "auto" } }}>
            <Typography variant="h4" fontWeight="bold">
              {t.spinWheelManagement}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {selectedBusinessObject
                ? `${t.managingWheelsFor} ${selectedBusinessObject.name}`
                : t.selectBusinessToView}
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              flexShrink: 0,
              alignItems: "stretch",
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {(user?.role === "admin" || user?.role === "superadmin") && (
              <Button
                variant="outlined"
                onClick={() => setDrawerOpen(true)}
                startIcon={<ICONS.business fontSize="small" />}
                sx={getStartIconSpacing(dir)}
              >
                {t.selectBusiness}
              </Button>
            )}
            {selectedBusiness && (
              <Button
                variant="contained"
                startIcon={<ICONS.add />}
                onClick={() => handleOpenModal()}
                sx={getStartIconSpacing(dir)}
              >
                {t.createSpinWheel}
              </Button>
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {!selectedBusiness ? (
          <EmptyBusinessState />
        ) : loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="50vh"
          >
            <LoadingState />
          </Box>
        ) : spinWheels.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <Grid container spacing={3} justifyContent={"center"}>
            {spinWheels.map((wheel) => {
              const typeConfig = typeMap[wheel.type] || {};
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={wheel._id}>
                  <Card
                    elevation={3}
                    sx={{
                      position: "relative",
                      height: "100%",
                      minWidth: "250px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      borderRadius: 2,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                  >
                    <Chip
                      label={typeConfig.chipText}
                      color={typeConfig.color}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        fontWeight: 500,
                        fontSize: "0.75rem",
                        textTransform: "capitalize",
                        zIndex: 2,
                      }}
                    />

                    <CardContent sx={{ flexGrow: 1, pt: 4 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {wheel.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, wordBreak: "break-word" }}
                      >
                        <strong>{t.slug}:</strong> {wheel.slug}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, wordBreak: "break-word" }}
                      >
                        <strong>{t.business}:</strong>{" "}
                        {wheel.business?.name || t.noBusiness}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        <strong>{t.participants}:</strong> {wheel.participantCount || 0}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {t.created}:{" "}
                        {(() => {
                          try {
                            if (!wheel.createdAt) return t.notAvailable;
                            const testDate = new Date(wheel.createdAt);
                            if (isNaN(testDate.getTime())) return t.invalidDate;
                            return new Date(
                              wheel.createdAt
                            ).toLocaleDateString();
                          } catch (error) {
                            console.error(
                              "Error formatting date:",
                              error,
                              wheel.createdAt
                            );
                            return t.invalidDate;
                          }
                        })()}
                      </Typography>
                    </CardContent>
                    <RecordMetadata
                      createdBy={wheel.createdBy}
                      updatedBy={wheel.updatedBy}
                      createdAt={wheel.createdAt}
                      updatedAt={wheel.updatedAt}
                      locale={language === "ar" ? "ar-SA" : "en-GB"}
                      createdByLabel={t.createdBy}
                      createdAtLabel={t.createdAt}
                      updatedByLabel={t.updatedBy}
                      updatedAtLabel={t.updatedAt}
                    />
                    <Divider />
                    <CardActions
                      sx={{ justifyContent: "space-between", p: 1.5 }}
                    >
                      <Box>
                        <Tooltip title={t.shareSpinWheel}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleOpenShareModal(wheel.slug, wheel.type)
                            }
                            aria-label="Share"
                          >
                            <ICONS.share fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {["admin", "onspot", "synced"].includes(wheel.type) && (
                          <Tooltip title={t.manageParticipants}>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleNavigateToParticipants(wheel.slug)
                              }
                              aria-label="Manage Participants"
                            >
                              <ICONS.people fontSize="small" color="primary" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                      <Box>
                        <Tooltip title={t.editSpinWheel}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenModal(wheel)}
                            aria-label={t.edit}
                          >
                            <ICONS.edit fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t.deleteSpinWheel}>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteEvent(wheel)}
                            aria-label={t.delete}
                          >
                            <ICONS.delete fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        <ShareLinkModal
          open={openShareModal}
          onClose={() => setOpenShareModal(false)}
          url={shareUrl}
          title={shareTitle}
          name={shareTitle}
        />

        {/* Event Creation/Edit Modal */}
        <Dialog
          open={openModal}
          onClose={handleCloseModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedWheel ? t.editSpinWheel : t.createSpinWheel}
          </DialogTitle>
          <DialogContent>
            <TextField
              name="title"
              label={t.wheelTitle}
              fullWidth
              margin="normal"
              value={form.title}
              onChange={handleInputChange}
              required
              error={!!errors.title}
              helperText={errors.title}
            />
            <TextField
              name="slug"
              label={t.slug}
              fullWidth
              margin="normal"
              value={form.slug}
              onChange={handleInputChange}
              required
              error={!!errors.slug}
              helperText={errors.slug || t.urlHelper}
            />
            <TextField
              name="type"
              label={t.wheelType}
              select
              fullWidth
              margin="normal"
              value={form.type}
              onChange={handleInputChange}
              error={!!errors.type}
              helperText={errors.type}
            >
              {eventTypes.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            {wheelType === "synced" && (
              <TextField
                select
                fullWidth
                label={t.selectEvent}
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                required
              >
                {Array.isArray(events) &&
                  events.map((event) => (
                    <MenuItem key={event._id} value={event._id}>
                      {event.name}
                    </MenuItem>
                  ))}
              </TextField>
            )}

            {/* Logo Upload */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 2,
                width: "100%",
                mt: 2,
              }}
            >
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="logo-upload"
                type="file"
                name="logo"
                onChange={handleFileChange}
              />
              <label htmlFor="logo-upload">
                <Button
                  variant="outlined"
                  component="span"
                  ref={logoButtonRef}
                  startIcon={<ICONS.upload />}
                  sx={getStartIconSpacing(dir)}
                >
                  {t.uploadLogo}
                </Button>
              </label>

              {form.logoPreview && !form.removeLogo && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    {selectedWheel && !form.logo ? "Current Image" : "Preview"}
                  </Typography>

                  <Box
                    sx={{
                      position: "relative",
                      display: "inline-block",
                      width: buttonWidths.logo || "auto",
                    }}
                  >
                    <img
                      src={form.logoPreview}
                      alt="Logo preview"
                      style={{
                        width: buttonWidths.logo
                          ? `${buttonWidths.logo}px`
                          : "auto",
                        maxHeight: 100,
                        height: "auto",
                        borderRadius: 6,
                        objectFit: "cover",
                      }}
                    />

                    <IconButton
                      size="small"
                      onClick={() => {
                        const fileUrl =
                          selectedWheel?.logoUrl || form.logoPreview;
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
                mt: 2,
              }}
            >
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="background-upload"
                type="file"
                name="background"
                onChange={handleFileChange}
              />
              <label htmlFor="background-upload">
                <Button
                  variant="outlined"
                  component="span"
                  ref={backgroundButtonRef}
                  startIcon={<ICONS.upload />}
                  sx={getStartIconSpacing(dir)}
                >
                  {t.uploadBackground}
                </Button>
              </label>

              {form.backgroundPreview && !form.removeBackground && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    {selectedWheel && !form.background
                      ? "Current Image"
                      : "Preview"}
                  </Typography>

                  <Box
                    sx={{
                      position: "relative",
                      display: "inline-block",
                      width: buttonWidths.background || "auto",
                    }}
                  >
                    <img
                      src={form.backgroundPreview}
                      alt="Background preview"
                      style={{
                        width: buttonWidths.background
                          ? `${buttonWidths.background}px`
                          : "auto",
                        maxHeight: 100,
                        height: "auto",
                        borderRadius: 6,
                        objectFit: "cover",
                      }}
                    />

                    <IconButton
                      size="small"
                      onClick={() => {
                        const fileUrl =
                          selectedWheel?.backgroundUrl ||
                          form.backgroundPreview;
                        handleDeleteMedia("background", fileUrl);
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
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>{t.cancel}</Button>
            <Button
              variant="contained"
              onClick={handleSaveEvent}
              disabled={saving}
              startIcon={
                saving ? <CircularProgress size={20} color="inherit" /> : null
              }
            >
              {t.save}
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmationDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={confirmDeleteEvent}
          title={t.deleteWheelTitle}
          message={t.deleteWheelMessage}
          confirmButtonText={t.delete}
          confirmButtonIcon={<ICONS.delete />}
        />

        {/* Media Delete Confirmation */}
        <ConfirmationDialog
          open={deleteConfirm.open}
          onClose={() =>
            setDeleteConfirm({ open: false, type: null, fileUrl: null })
          }
          onConfirm={confirmDeleteMedia}
          title="Delete Media?"
          message="Are you sure you want to delete this media? This action cannot be undone."
          confirmButtonText="Delete"
          confirmButtonIcon={<ICONS.delete />}
        />

        {/* Media Upload Progress */}
        <MediaUploadProgress
          open={showUploadProgress}
          uploads={uploadProgress}
          onClose={() => setShowUploadProgress(false)}
          allowClose={false}
        />
      </Container>
    </Box>
  );
};

export default Dashboard;
