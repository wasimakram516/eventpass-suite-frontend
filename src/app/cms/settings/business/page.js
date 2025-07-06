"use client";

import {
  Box,
  Typography,
  Grid,
  Card,
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
import { useMessage } from "@/contexts/MessageContext";
import useI18nLayout from "@/hooks/useI18nLayout";
import slugify from "@/utils/slugify";
import ConfirmationDialog from "@/components/ConfirmationDialog";

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
    confirmDeleteTitle: "Confirm Delete",
    confirmDeleteMessage: (name) => `Are you sure you want to delete ${name}?`,
    confirmDeleteButton: "Delete",
    owner: "Owner",
    noBiz: "You haven't created a business yet.",
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
    confirmDeleteTitle: "تأكيد الحذف",
    confirmDeleteMessage: (name) => `هل أنت متأكد أنك تريد حذف ${name}؟`,
    confirmDeleteButton: "حذف",
    owner: "المالك",
    noBiz: "لم تقم بإنشاء أي شركة بعد.",
  },
};

export default function BusinessDetailsPage() {
  const { user } = useAuth();
  const { showMessage } = useMessage();
  const { dir, align, language, t } = useI18nLayout(translations);
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [unassignedUsers, setUnassignedUsers] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bizToDelete, setBizToDelete] = useState(null);
  const [editingBiz, setEditingBiz] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
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

    console.log("Opening form with:", biz?.contact);

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

  const handleSave = async () => {
    try {
      setLoading(true);

      const payload = {
        name: form.name,
        slug: form.slug,
        email: form.email,
        phone: form.phone,
        address: form.address,
        ownerId: form.ownerId || user.id,
      };

      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        fd.append(k, typeof v === "object" ? JSON.stringify(v) : v);
      });
      if (form.logoFile) fd.append("file", form.logoFile);

      if (editingBiz?._id) {
        await updateBusiness(editingBiz._id, fd);
        showMessage("Business updated successfully", "success");
      } else {
        await createBusiness(fd);
        fetchUnassignedUsers();
        showMessage("Business created successfully", "success");
      }

      fetchBusinesses();
      handleClose();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to save";
      showMessage(message, "error");
    } finally {
      setLoading(false);
    }
  };

  // open the delete confirmation dialog
  const openDeleteConfirm = (biz) => {
    setBizToDelete(biz);
    setConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      setLoading(true);
      await deleteBusiness(bizToDelete._id);
      showMessage("Business deleted", "success");
      fetchBusinesses();
      fetchUnassignedUsers();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Delete failed";
  
        showMessage(message, "error");
      
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setBizToDelete(null);
    }
  };
  
  return (
    <Container dir={dir}>
      <BreadcrumbsNav />

      {/* HEADER: only show “Create” for admins OR business users with no biz */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            textAlign={align}
          >
            {t.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign={align}>
            {t.subtitle}
          </Typography>
        </Box>

        {user.role === "admin" && (
          <Button variant="contained" onClick={() => handleOpen()}>
            {t.create}
          </Button>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress size={36} />
        </Box>
      )}

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
      ) : (
        /* ELSE show the grid of businesses (for admin all, for biz user exactly one) */
        <Grid container spacing={3}>
          {businesses.map((biz) => (
            <Grid item xs={12} sm={6} md={4} key={biz._id}>
              <Card elevation={3} sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={biz.logoUrl}
                    alt={biz.name}
                    sx={{ width: 56, height: 56 }}
                  >
                    {biz.name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{biz.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Slug: <strong>{biz.slug}</strong>
                    </Typography>
                    <Typography variant="body2">
                      {biz.contact?.email}
                    </Typography>
                    {biz.owner && (
                      <Typography variant="caption" color="text.secondary">
                        {t.owner}: {biz.owner.name || biz.owner}
                      </Typography>
                    )}
                  </Box>
                </Stack>

                <Box sx={{ mt: 2, textAlign: "right" }}>
                  <Tooltip title={t.edit}>
                    <IconButton color="primary" onClick={() => handleOpen(biz)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>

                  {user.role === "admin" && (
                    <Tooltip title={t.delete}>
                      <IconButton
                        color="error"
                        onClick={() => openDeleteConfirm(biz)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Card>
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
          />
          <TextField
            label={t.slug}
            name="slug"
            value={form.slug}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label={t.email}
            name="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />

          <TextField
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Address"
            name="address"
            value={form.address}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />

          {user.role === "admin" && (
            <FormControl fullWidth margin="normal">
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
          <Button onClick={handleClose} disabled={loading}>
            {t.cancel}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            startIcon={
              loading && <CircularProgress color="inherit" size={20} />
            }
          >
            {loading ? (editingBiz ? "Updating..." : "Saving...") : t.save}
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
