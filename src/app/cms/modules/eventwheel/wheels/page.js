"use client";
import React, { useState, useEffect, useCallback } from "react";
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
import ShareLinkModal from "@/components/ShareLinkModal";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import BusinessDrawer from "@/components/BusinessDrawer";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import { useAuth } from "@/contexts/AuthContext";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import LoadingState from "@/components/LoadingState";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import slugify from "@/utils/slugify";
import CircularProgress from "@mui/material/CircularProgress";
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
    deleteWheelMessage: "Are you sure you want to move this item to the Recycle Bin?",
    collectInfoLabel: "Collect Info (Admin adds names)",
    enterNamesLabel: "Enter Names (Participants enter their names)",
    shareSpinWheelTitle: "Share Spin Wheel",
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
    deleteWheelMessage: "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    collectInfoLabel: "جمع المعلومات (المشرف يضيف الأسماء)",
    enterNamesLabel: "إدخال الأسماء (المشاركون يدخلون أسماءهم)",
    shareSpinWheelTitle: "مشاركة عجلة الدوران",
  },
};

const Dashboard = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { t, dir } = useI18nLayout(translations);
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
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const eventTypes = [
    { label: t.collectInfoLabel, value: "collect_info" },
    {
      label: t.enterNamesLabel,
      value: "enter_names",
    },
  ];
  const [form, setForm] = useState({
    business: "",
    title: "",
    slug: "",
    type: "collect_info",
    logo: null,
    background: null,
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const initializeBusinesses = async () => {
      setLoading(true);
      const businessList = await getAllBusinesses();
      setBusinesses(businessList);

      if (user?.role === "business") {
        const userBusiness = businessList.find(
          (business) =>
            business.slug === user.business?.slug ||
            business._id === user.business?._id
        );
        if (userBusiness) {
          setSelectedBusiness(userBusiness.slug);
          fetchSpinWheels(userBusiness.slug);
        }
      }
      setLoading(false);
    };

    initializeBusinesses();
  }, [user]);

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
    const selectedBusinessObject = businesses.find(
      (business) => business.slug === selectedBusiness
    );

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
        }
        : {
          business: selectedBusinessObject?._id || "",
          title: "",
          slug: "",
          type: "collect_info",
          logo: null,
          background: null,
        }
    );
    setLogoPreview(wheel?.logoUrl || null);
    setBackgroundPreview(wheel?.backgroundUrl || null);
    setErrors({});
    setOpenModal(true);
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    setForm((prev) => ({
      ...prev,
      [name]: file,
    }));

    if (name === "logo" && file) {
      setLogoPreview(URL.createObjectURL(file));
    }
    if (name === "background" && file) {
      setBackgroundPreview(URL.createObjectURL(file));
    }
  };

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
    if (!form.logo && !logoPreview) newErrors.logo = "Logo is required";
    if (!form.background && !backgroundPreview)
      newErrors.background = "Background is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveEvent = async () => {
    if (!validateForm()) return;
    setSaving(true);
    const formattedSlug = validateShortName(form.slug);
    const selectedBusinessObject = businesses.find(
      (business) => business.slug === selectedBusiness
    );

    const formData = new FormData();
    formData.append(
      "business",
      form.business || selectedBusinessObject?._id || ""
    );
    formData.append("title", form.title);
    formData.append("slug", formattedSlug);
    formData.append("type", form.type);

    if (form.logo) {
      formData.append("logo", form.logo);
    }
    if (form.background) {
      formData.append("background", form.background);
    }

    if (selectedWheel) {
      await updateSpinWheel(selectedWheel._id, formData);
    } else {
      await createSpinWheel(formData);
    }

    fetchSpinWheels(selectedBusiness);
    setOpenModal(false);
    setSaving(false);
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
      type === "collect_info"
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

  const selectedBusinessObject = businesses.find(
    (business) => business.slug === selectedBusiness
  );

  return (
    <Box dir={dir} sx={{ display: "flex", minHeight: "100vh" }}>
      {user?.role === "admin" && (
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
            {user?.role === "admin" && (
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
            {spinWheels.map((wheel) => (
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
                    label={
                      wheel.type === "collect_info"
                        ? t.collectInfo
                        : t.enterNames
                    }
                    color={
                      wheel.type === "collect_info" ? "primary" : "secondary"
                    }
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

                    <Typography variant="caption" color="text.secondary">
                      {t.created}:{" "}
                      {(() => {
                        try {
                          if (!wheel.createdAt) return t.notAvailable;
                          const testDate = new Date(wheel.createdAt);
                          if (isNaN(testDate.getTime())) return t.invalidDate;
                          return new Date(wheel.createdAt).toLocaleDateString();
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
                  <Divider />
                  <CardActions sx={{ justifyContent: "space-between", p: 1.5 }}>
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
                      {wheel.type === "collect_info" && (
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
            ))}
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

            <Box sx={{ mt: 2 }}>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="logo-upload"
                type="file"
                name="logo"
                onChange={handleFileChange}
              />
              <label htmlFor="logo-upload">
                <Button variant="outlined" component="span" fullWidth>
                  {t.uploadLogo}
                </Button>
              </label>
              {logoPreview && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Preview:
                  </Typography>
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      style={{ maxWidth: "100%", maxHeight: 120 }}
                    />
                  </Box>
                </>
              )}
              {errors.logo && (
                <Typography variant="caption" color="error">
                  {errors.logo}
                </Typography>
              )}
            </Box>

            <Box sx={{ mt: 2 }}>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="background-upload"
                type="file"
                name="background"
                onChange={handleFileChange}
              />
              <label htmlFor="background-upload">
                <Button variant="outlined" component="span" fullWidth>
                  {t.uploadBackground}
                </Button>
              </label>
              {backgroundPreview && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Preview:
                  </Typography>
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <img
                      src={backgroundPreview}
                      alt="Background Preview"
                      style={{ maxWidth: "100%", maxHeight: 120 }}
                    />
                  </Box>
                </>
              )}
              {errors.background && (
                <Typography variant="caption" color="error">
                  {errors.background}
                </Typography>
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
      </Container>
    </Box>
  );
};

export default Dashboard;
