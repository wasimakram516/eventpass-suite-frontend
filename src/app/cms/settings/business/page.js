"use client";

import {
  Box,
  Typography,
  Grid,
  CardActions,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Container,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useEffect, useState } from "react";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import {
  getAllBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
} from "@/services/businessService";

import { useAuth } from "@/contexts/AuthContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import slugify from "@/utils/slugify";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import ICONS from "@/utils/iconUtil";
import NoDataAvailable from "@/components/NoDataAvailable";
import { wrapTextBox } from "@/utils/wrapTextStyles";
import AppCard, { AppCardText } from "@/components/cards/AppCard";
import RecordMetadata from "@/components/RecordMetadata";

const translations = {
  en: {
    title: "Business Details",
    subtitle: "Edit business contact info and branding.",
    name: "Name",
    email: "Email",
    slug: "Slug",
    logo: "Business Logo",
    upload: "Upload Logo",
    save: "Save",
    cancel: "Cancel",
    createNewBusiness: "Create New Business",
    create: "create",
    edit: "Edit Business",
    delete: "Delete Business",
    saving: "Saving...",
    creating: "Creating...",
    confirmDeleteTitle: "Confirm Delete",
    confirmDeleteMessage: `Are you sure you want to move this item to the Recycle Bin?`,

    confirmDeleteButton: "Delete",
    createdBy: "Created:",
    updatedBy: "Updated:",
    createdAt: "Created At:",
    updatedAt: "Updated At:",
    owner: "Owner",
    noBiz: "You haven't created a business yet.",
    errors: {
      name: "Name is required",
      slug: "Slug is required",
      email: "Email is required",
      emailInvalid: "Invalid email format",
    },
  },
  ar: {
    title: "تفاصيل العمل",
    subtitle: "تعديل معلومات الاتصال والعلامة التجارية للشركة.",
    name: "الاسم",
    email: "البريد الإلكتروني",
    slug: "المعرف الفريد",
    logo: "شعار الشركة",
    upload: "تحميل الشعار",
    save: "حفظ",
    cancel: "إلغاء",
    createNewBusiness: "إنشاء شركة جديدة",
    create: "إنشاء",
    edit: "تعديل الشركة",
    delete: "حذف الشركة",
    saving: "جارٍ الحفظ...",
    creating: "جارٍ الإنشاء...",
    confirmDeleteTitle: "تأكيد الحذف",
    confirmDeleteMessage: `هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟`,

    confirmDeleteButton: "حذف",
    createdBy: "أنشئ:",
    updatedBy: "حدث:",
    createdAt: "تاريخ الإنشاء:",
    updatedAt: "تاريخ التحديث:",
    owner: "المالك",
    noBiz: "لم تقم بإنشاء أي شركة بعد.",
    errors: {
      name: "الاسم مطلوب",
      slug: "المعرف مطلوب",
      email: "البريد الإلكتروني مطلوب",
      emailInvalid: "تنسيق البريد الإلكتروني غير صالح",
    },
  },
};

export default function BusinessDetailsPage() {
  const { user, setUser } = useAuth();
  const { dir, align, language, t } = useI18nLayout(translations);
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bizToDelete, setBizToDelete] = useState(null);
  const [editingBiz, setEditingBiz] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    slug: "",
    logoPreview: "",
    logoFile: null,
    address: "",
    owners: [],
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    setLoading(true);
    const data = await getAllBusinesses();
    const list =
      user.role === "admin" || user.role === "superadmin"
        ? data
        : data.filter(
          (b) =>
            Array.isArray(b.owners) &&
            b.owners.some((o) =>
              typeof o === "string" ? o === user.id : o._id === user.id,
            ),
        );

    // Fallback: for business users, include the business attached to the user
    // even if owners are not populated on the business record.
    if (
      user.role === "business" &&
      Array.isArray(list) &&
      list.length === 0 &&
      user?.business?._id
    ) {
      setBusinesses([user.business]);
      setLoading(false);
      return;
    }
    setBusinesses(list);
    setLoading(false);
  };

  const handleOpen = (biz = null) => {
    setEditingBiz(biz);

    setForm({
      name: biz?.name ?? "",
      email: biz?.contact?.email ?? "",
      phone: biz?.contact?.phone ?? "",
      slug: biz?.slug ?? "",
      logoPreview: biz?.logoUrl ?? "",
      logoFile: null,
      address: biz?.address ?? "",
      owners: biz?.owners ?? [],
    });

    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setFormErrors({});
    setTimeout(() => {
      setEditingBiz(null);
      setForm({
        name: "",
        email: "",
        phone: "",
        slug: "",
        logoPreview: "",
        logoFile: null,
        address: "",
        owners: [],
      });
    }, 200);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name" && !editingBiz
        ? { slug: slugify(value, { lower: true }) }
        : {}),
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        logoPreview: reader.result,
        logoFile: file,
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) errors.name = t.errors.name;
    if (!form.slug.trim()) errors.slug = t.errors.slug;

    if (!form.email.trim()) {
      errors.email = t.errors.email;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = t.errors.emailInvalid;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);

    const payload = {
      name: form.name,
      slug: form.slug,
      email: form.email,
      phone: form.phone,
      address: form.address,
    };

    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      fd.append(k, typeof v === "object" ? JSON.stringify(v) : v);
    });
    if (form.logoFile) fd.append("file", form.logoFile);

    let res = null;
    if (editingBiz?._id) {
      res = await updateBusiness(editingBiz._id, fd);
    } else {
      res = await createBusiness(fd);
    }

    if (res?.error) {
      setLoading(false);
      return;
    }
    fetchBusinesses();

    if (user.role === "business") {
      const updatedUser = {
        ...user,
        business: res,
      };
      setUser(updatedUser);
    }

    handleClose();
    setLoading(false);
  };

  // open the delete confirmation dialog
  const openDeleteConfirm = (biz) => {
    if (user.role !== "superadmin") return;
    setBizToDelete(biz);
    setConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    setLoading(true);
    const res = await deleteBusiness(bizToDelete._id);
    if (!res.error) {
      fetchBusinesses();
    }
    setLoading(false);
    setConfirmOpen(false);
    setBizToDelete(null);
  };

  return (
    <Container
      dir={dir}
      maxWidth={false}
      sx={{ maxWidth: "1500px", px: { xs: 2, md: 3 } }}
    >
      <BreadcrumbsNav />

      {/* HEADER: only show “Create” for admins OR business users with no biz */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "flex-start" }}
        spacing={2}
        mb={2}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" textAlign={align}>
            {t.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            mt={0.5}
            textAlign={align}
          >
            {t.subtitle}
          </Typography>
        </Box>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {/* IF business user AND no biz => special “no biz” callout */}
      {user.role === "business" && businesses.length === 0 ? (
        <Box textAlign="center" sx={{ mt: 6 }}>
          <Typography variant="h6" gutterBottom>
            {t.noBiz}
          </Typography>
          <Button variant="contained" onClick={() => handleOpen()}>
            {t.createNewBusiness}
          </Button>
        </Box>
      ) : loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress size={36} />
        </Box>
      ) : businesses.length === 0 ? (
        <NoDataAvailable />
      ) : (
        /* ELSE show the grid of businesses
        - admin: all businesses
        - business user: all businesses they own */
        <Grid
          container
          rowSpacing={{ xs: 2, sm: 2 }}
          columnSpacing={{ xs: 0, sm: 2 }}
          justifyContent={{ xs: "stretch", sm: "center" }}
          sx={{ width: "100%", mx: 0 }}
        >
          {businesses.map((biz) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={biz._id}
              sx={{
                display: "flex",
                justifyContent: "stretch",
                width: { xs: "100%", sm: "auto" },
                maxWidth: { xs: "100%", sm: 380 },
                flexBasis: { sm: 380 },
                flexGrow: { sm: 0 },
                minWidth: 0,
                px: { xs: 0 },
              }}
            >
              <AppCard
                sx={{
                  p: 2,
                  width: "100%",
                  maxWidth: { xs: "100%", sm: 360, md: 380 },
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  ...wrapTextBox,
                }}
              >
                {/* Top: Avatar and Name */}
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Avatar
                    src={biz.logoUrl}
                    alt={biz.name}
                    sx={{ width: 56, height: 56 }}
                  >
                    {biz.name?.[0]}
                  </Avatar>

                  <AppCardText sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{
                        ...wrapTextBox,
                      }}
                    >
                      {biz.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        ...wrapTextBox,
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      Slug: {biz.slug}
                    </Typography>
                  </AppCardText>
                </Box>

                {/* Details aligned fully left */}
                <AppCardText sx={{ mt: 1, pl: 0, minHeight: 92 }}>
                  {biz.contact?.email && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                        mt: 0.5,
                        minWidth: 0,
                        flexWrap: "wrap",
                      }}
                    >
                      <ICONS.email fontSize="small" color="action" />
                      <Typography
                        variant="body2"
                        sx={{
                          ...wrapTextBox,
                          flex: 1,
                          minWidth: 0,
                          maxWidth: "100%",
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {biz.contact.email}
                      </Typography>
                    </Box>
                  )}
                  {biz.contact?.phone && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                        mt: 0.5,
                        minWidth: 0,
                        flexWrap: "wrap",
                      }}
                    >
                      <ICONS.phone fontSize="small" color="action" />
                      <Typography
                        variant="body2"
                        sx={{
                          ...wrapTextBox,
                          flex: 1,
                          minWidth: 0,
                          maxWidth: "100%",
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {biz.contact.phone}
                      </Typography>
                    </Box>
                  )}
                  {biz.address && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                        mt: 0.5,
                        minWidth: 0,
                        flexWrap: "wrap",
                      }}
                    >
                      <ICONS.location fontSize="small" color="action" />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          ...wrapTextBox,
                          flex: 1,
                          minWidth: 0,
                          maxWidth: "100%",
                        }}
                      >
                        {biz.address}
                      </Typography>
                    </Box>
                  )}
                  {Array.isArray(biz.owners) && biz.owners.length > 0 && (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t.owner}:
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        mt={0.5}
                        sx={{ minWidth: 0 }}
                      >
                        {biz.owners.map((o) => (
                          <Chip
                            key={typeof o === "string" ? o : o._id}
                            size="small"
                            label={typeof o === "string" ? o : o.name}
                            icon={<ICONS.person fontSize="small" />}
                            sx={{
                              maxWidth: "100%",
                              "& .MuiChip-label": {
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "block",
                              },
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </AppCardText>

                <RecordMetadata
                  createdByName={biz.createdBy}
                  updatedByName={biz.updatedBy}
                  createdAt={biz.createdAt}
                  updatedAt={biz.updatedAt}
                  locale={language === "ar" ? "ar-SA" : "en-GB"}
                />

                {/* Card Actions */}
                <CardActions
                  sx={{
                    mt: "auto",
                    justifyContent: "flex-end",
                    px: 0,
                    pt: 1,
                  }}
                >
                  <Tooltip title={t.edit}>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpen(biz)}
                      size="small"
                    >
                      <ICONS.edit fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {user.role === "superadmin" && (
                    <Tooltip title={t.delete}>
                      <IconButton
                        color="error"
                        onClick={() => openDeleteConfirm(biz)}
                        size="small"
                      >
                        <ICONS.delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </AppCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* MODAL FORM */}
      <Dialog open={formOpen} onClose={handleClose} fullWidth dir={dir}>
        <DialogTitle>{editingBiz ? t.edit : t.createNewBusiness}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            label={t.name}
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={!!formErrors.name}
            helperText={formErrors.name}
          />
          <TextField
            label={t.slug}
            name="slug"
            value={form.slug}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={!!formErrors.slug}
            helperText={formErrors.slug}
          />
          <TextField
            label={t.email}
            name="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={!!formErrors.email}
            helperText={formErrors.email}
          />

          <TextField
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            fullWidth
            margin="normal"
            type="tel"
            inputProps={{ pattern: "[0-9]*" }}
            error={!!formErrors.phone}
            helperText={formErrors.phone}
          />
          <TextField
            label="Address"
            name="address"
            value={form.address}
            onChange={handleChange}
            multiline
            rows={2}
            fullWidth
            margin="normal"
            error={!!formErrors.address}
            helperText={formErrors.address}
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t.logo}
            </Typography>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ gap: dir === "rtl" ? 2 : undefined }}
            >
              <Avatar
                src={form.logoPreview}
                alt="Preview"
                sx={{ width: 64, height: 64 }}
              />
              <Button variant="outlined" component="label" size="small">
                {t.upload}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 1,
            px: { xs: 3, sm: 2 },
          }}
        >
          <Button
            variant="outlined"
            onClick={handleClose}
            startIcon={<ICONS.cancel />}
            disabled={loading}
            sx={{
              width: { xs: "100%", sm: "auto" },
              ...getStartIconSpacing(dir),
            }}
          >
            {t.cancel}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress color="inherit" size={20} />
              ) : (
                <ICONS.save />
              )
            }
            sx={{
              width: { xs: "100%", sm: "auto" },
              ...getStartIconSpacing(dir),
            }}
          >
            {loading
              ? editingBiz
                ? t.saving
                : t.creating
              : editingBiz
                ? t.save
                : t.create}
          </Button>
        </DialogActions>
      </Dialog>
      {user.role === "superadmin" && (
        <ConfirmationDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleDeleteConfirmed}
          title={t.confirmDeleteTitle}
          message={t.confirmDeleteMessage}
          confirmButtonText={t.confirmDeleteButton}
          confirmButtonIcon={<ICONS.delete />}
        />
      )}
    </Container>
  );
}
