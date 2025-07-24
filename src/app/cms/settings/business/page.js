"use client";

import {
  Box,
  Typography,
  Grid,
  Card,
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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import {
  getAllBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
} from "@/services/businessService";

import { getUnassignedUsers } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import slugify from "@/utils/slugify";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import ICONS from "@/utils/iconUtil";
import NoDataAvailable from "@/components/NoDataAvailable";
import { wrapTextBox } from "@/utils/wrapTextStyles";

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
    create: "Create New Business",
    edit: "Edit Business",
    delete: "Delete Business",
    saving: "Saving...",
    creating: "Creating...",
    confirmDeleteTitle: "Confirm Delete",
    confirmDeleteMessage: (name) =>
      `Are you sure you want to delete ${name}? This will also delete all of its associated data and cannot be undone.`,

    confirmDeleteButton: "Delete",
    owner: "Owner",
    noBiz: "You haven't created a business yet.",
    errors: {
      name: "Name is required",
      slug: "Slug is required",
      email: "Email is required",
      emailInvalid: "Invalid email format",
      owner: "Owner is required",
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
    create: "إنشاء شركة جديدة",
    edit: "تعديل الشركة",
    delete: "حذف الشركة",
    saving: "جارٍ الحفظ...",
    creating: "جارٍ الإنشاء...",
    confirmDeleteTitle: "تأكيد الحذف",
    confirmDeleteMessage: (name) =>
      `هل أنت متأكد أنك تريد حذف ${name}؟ سيؤدي هذا أيضًا إلى حذف جميع البيانات المرتبطة به ولا يمكن التراجع عنه.`,

    confirmDeleteButton: "حذف",
    owner: "المالك",
    noBiz: "لم تقم بإنشاء أي شركة بعد.",
    errors: {
      name: "الاسم مطلوب",
      slug: "المعرف مطلوب",
      email: "البريد الإلكتروني مطلوب",
      emailInvalid: "تنسيق البريد الإلكتروني غير صالح",
      owner: "المالك مطلوب",
    },
  },
};

export default function BusinessDetailsPage() {
  const { user, setUser } = useAuth();
  const { dir, align, language, t } = useI18nLayout(translations);
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [unassignedUsers, setUnassignedUsers] = useState([]);
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
    ownerId: "",
  });

  useEffect(() => {
    fetchBusinesses();
    fetchUnassignedUsers();
  }, []);

  const fetchBusinesses = async () => {
    setLoading(true);
    const data = await getAllBusinesses();
    const list =
      user.role === "admin"
        ? data
        : data.filter((b) => {
            const ownerId =
              typeof b.owner === "string" ? b.owner : b.owner?._id;
            return ownerId === user.id;
          });
    setBusinesses(list);
    setLoading(false);
  };

  const fetchUnassignedUsers = async () => {
    if (user.role === "admin") {
      const users = await getUnassignedUsers();
      setUnassignedUsers(users);
    }
  };

  const handleOpen = (biz = null) => {
    const fallbackOwnerId = user.role !== "admin" ? user.id : "";
    setEditingBiz(biz);

    // If editing and current owner not in dropdown, add them manually
    if (
      user.role === "admin" &&
      biz?.owner?._id &&
      !unassignedUsers.some((u) => u._id === biz.owner._id)
    ) {
      setUnassignedUsers((prev) => [
        ...prev,
        {
          _id: biz.owner._id,
          name: biz.owner.name,
          email: biz.owner.email,
        },
      ]);
    }

    setForm({
      name: biz?.name ?? "",
      email: biz?.contact?.email ?? "",
      phone: biz?.contact?.phone ?? "",
      slug: biz?.slug ?? "",
      logoPreview: biz?.logoUrl ?? "",
      logoFile: null,
      address: biz?.address ?? "",
      ownerId: biz?.owner?._id ?? fallbackOwnerId,
    });

    setFormOpen(true);
  };

  const handleClose = () => {
    setEditingBiz(null);
    setFormOpen(false);
    setForm({
      name: "",
      email: "",
      phone: "",
      slug: "",
      logoPreview: "",
      logoFile: null,
      address: "",
      ownerId: "",
    });
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

    if (user.role === "admin" && !form.ownerId) {
      errors.ownerId = t.errors.owner;
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
      ownerId: form.ownerId,
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

    if (!res.error) {
      fetchUnassignedUsers();
      fetchBusinesses();

      // Update AuthContext user if role is 'business'
      if (user.role === "business") {
        const updatedUser = {
          ...user,
          business: res,
        };

        // Update Context
        setUser(updatedUser);
      }
    }

    handleClose();
    setLoading(false);
  };

  // open the delete confirmation dialog
  const openDeleteConfirm = (biz) => {
    setBizToDelete(biz);
    setConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    setLoading(true);
    const res = await deleteBusiness(bizToDelete._id);
    if (!res.error) {
      fetchBusinesses();
      fetchUnassignedUsers();
    }
    setLoading(false);
    setConfirmOpen(false);
    setBizToDelete(null);
  };

  return (
    <Container dir={dir}>
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

        {user.role === "admin" && (
          <Button
            variant="contained"
            startIcon={<ICONS.create />}
            onClick={() => handleOpen()}
            sx={getStartIconSpacing(dir)}
          >
            {t.create}
          </Button>
        )}
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {/* IF business user AND no biz => special “no biz” callout */}
      {user.role === "business" && businesses.length === 0 ? (
        <Box textAlign="center" sx={{ mt: 6 }}>
          <Typography variant="h6" gutterBottom>
            {t.noBiz}
          </Typography>
          <Button variant="contained" onClick={() => handleOpen()}>
            {t.create}
          </Button>
        </Box>
      ) : loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress size={36} />
        </Box>
      ) : businesses.length === 0 ? (
        <NoDataAvailable />
      ) : (
        /* ELSE show the grid of businesses (for admin all, for biz user exactly one) */
        <Grid container spacing={3} justifyContent={"center"}>
          {businesses.map((biz) => (
            <Grid item xs={12} sm={6} md={4} key={biz._id}>
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Card
                  elevation={3}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    width: { xs: "100%", sm: "300px" },
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
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

                    <Box sx={{ flexGrow: 1, ...wrapTextBox }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {biz.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Slug: {biz.slug}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Details aligned fully left */}
                  <Box sx={{ mt: 1, pl: 0, ...wrapTextBox }}>
                    {biz.contact?.email && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <ICONS.email fontSize="small" color="action" />
                        <Typography variant="body2" sx={wrapTextBox}>
                          {biz.contact.email}
                        </Typography>
                      </Box>
                    )}
                    {biz.contact?.phone && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <ICONS.phone fontSize="small" color="action" />
                        <Typography variant="body2" sx={wrapTextBox}>
                          {biz.contact.phone}
                        </Typography>
                      </Box>
                    )}
                    {biz.address && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <ICONS.location fontSize="small" color="action" />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={wrapTextBox}
                        >
                          {biz.address}
                        </Typography>
                      </Box>
                    )}
                    {biz.owner && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <ICONS.person fontSize="small" color="action" />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={wrapTextBox}
                        >
                          {t.owner}: {biz.owner.name || biz.owner}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Card Actions */}
                  <CardActions
                    sx={{ mt: 1, justifyContent: "flex-end", px: 0, pt: 1 }}
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

                    {user.role === "admin" && (
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
                </Card>
              </Grid>
            </Grid>
          ))}
        </Grid>
      )}

      {/* MODAL FORM */}
      <Dialog open={formOpen} onClose={handleClose} fullWidth>
        <DialogTitle>{editingBiz ? t.edit : t.create}</DialogTitle>
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

          {user.role === "admin" && (
            <FormControl fullWidth margin="normal" error={!!formErrors.ownerId}>
              <InputLabel>{t.owner}</InputLabel>
              <Select
                name="ownerId"
                value={form.ownerId}
                onChange={handleChange}
                label={t.owner}
              >
                {unassignedUsers.map((u) => (
                  <MenuItem key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </MenuItem>
                ))}
              </Select>
              {formErrors.ownerId && (
                <Typography variant="caption" color="error" mt={0.5}>
                  {formErrors.ownerId}
                </Typography>
              )}
            </FormControl>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t.logo}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
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
        <DialogActions>
          <Button
            onClick={handleClose}
            startIcon={<ICONS.cancel />}
            disabled={loading}
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
      <ConfirmationDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirmed}
        title={t.confirmDeleteTitle}
        message={t.confirmDeleteMessage(bizToDelete?.name)}
        confirmButtonText={t.confirmDeleteButton}
      />
    </Container>
  );
}
