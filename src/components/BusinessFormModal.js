"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
  Avatar,
  CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import api from "../services/api";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function BusinessFormModal({
  open,
  onClose,
  onSubmit,
  initialValues = {},
  userList = [],
}) {
  const { user } = useAuth();
  const isAdmin = ["admin", "superadmin"].includes(user?.role);
  const isEdit = !!(initialValues && initialValues._id);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    logoFile: null,
    logoPreview: "",
    brandingFile: null,
    brandingPreview: null,
    poweredByFile: null,
    poweredByPreview: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    owner: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const safe = initialValues || {};

    setForm({
      name: safe.name || "",
      slug: safe.slug || "",
      logoFile: null,
      logoPreview: safe.logoUrl || "",
      brandingFile: null,
      brandingPreview: safe.brandingUrl || "",
      poweredByFile: null,
      poweredByPreview: safe.poweredByUrl || "",
      contactEmail: safe.contactEmail || "",
      contactPhone: safe.contactPhone || "",
      address: safe.address || "",
      owner: typeof safe.owner === "object" ? safe.owner._id : safe.owner || user?._id,
    });

    setErrors({});
    setLoading(false);
  }, [open, initialValues, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        logoFile: file,
        logoPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleBrandingChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        brandingFile: file,
        brandingPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handlePoweredByChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        poweredByFile: file,
        poweredByPreview: URL.createObjectURL(file),
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Business name is required";
    if (!form.slug.trim()) newErrors.slug = "Slug is required";
    if (!form.owner) newErrors.owner = "Owner is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      let logoUrl = form.logoPreview;
      let brandingUrl = form.brandingPreview;
      let poweredByUrl = form.poweredByPreview;

      // Upload new logo if selected
      if (form.logoFile) {
        const uploadData = new FormData();
        uploadData.append("file", form.logoFile);
        const response = await api.post("/upload", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        logoUrl = response.data.data.url;
      }

      // Upload new branding if selected
      if (form.brandingFile) {
        const uploadData = new FormData();
        uploadData.append("file", form.brandingFile);
        const response = await api.post("/upload", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        brandingUrl = response.data.data.url;
      }

      // Upload new powered by logo if selected
      if (form.poweredByFile) {
        const uploadData = new FormData();
        uploadData.append("file", form.poweredByFile);
        const response = await api.post("/upload", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        poweredByUrl = response.data.data.url;
      }

      const businessData = {
        name: form.name,
        slug: form.slug,
        logoUrl,
        brandingUrl,
        poweredByUrl,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        address: form.address,
        owner: form.owner,
      };

      await onSubmit(businessData, isEdit ? initialValues._id : null);
      setLoading(false);
    } catch (error) {
      console.error("Upload or save failed:", error);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Business" : "Create Business"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Business Name"
            name="name"
            fullWidth
            required
            value={form.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            label="Slug"
            name="slug"
            fullWidth
            required
            value={form.slug}
            onChange={handleChange}
            error={!!errors.slug}
            helperText={errors.slug}
          />

          {/* Logo Upload */}
          <Button startIcon={<CloudUploadIcon />} component="label" variant="outlined">
            Upload Logo
            <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
          </Button>
          {form.logoPreview && (
            <Avatar
              src={form.logoPreview}
              alt="Logo preview"
              variant="rounded"
              sx={{ width: 100, height: 100 }}
            />
          )}

          {/* Branding Upload */}
          <Button startIcon={<CloudUploadIcon />} component="label" variant="outlined">
            Upload Branding
            <input type="file" hidden accept="image/*" onChange={handleBrandingChange} />
          </Button>
          {form.brandingPreview && (
            <Avatar
              src={form.brandingPreview}
              alt="Branding preview"
              variant="rounded"
              sx={{ width: 100, height: 100 }}
            />
          )}

          {/* Powered By Upload */}
          <Button component="label" startIcon={<CloudUploadIcon />} variant="outlined">
            Upload Powered By Image
            <input type="file" hidden accept="image/*" onChange={handlePoweredByChange} />
          </Button>
          {form.poweredByPreview && (
            <Avatar
              src={form.poweredByPreview}
              alt="Powered By preview"
              variant="rounded"
              sx={{ width: 300, height: 100 }}
            />
          )}

          {/* Contact Info */}
          <TextField
            label="Contact Email"
            name="contactEmail"
            fullWidth
            value={form.contactEmail}
            onChange={handleChange}
          />
          <TextField
            label="Contact Phone"
            name="contactPhone"
            fullWidth
            value={form.contactPhone}
            onChange={handleChange}
          />
          <TextField
            label="Address"
            name="address"
            fullWidth
            value={form.address}
            onChange={handleChange}
          />

          {/* Owner (for Admins) */}
          {isAdmin && (
            <FormControl fullWidth>
              <InputLabel>Owner</InputLabel>
              <Select
                label="Owner"
                name="owner"
                value={form.owner}
                onChange={handleChange}
                error={!!errors.owner}
              >
                {userList.map((u) => (
                  <MenuItem key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={18} color="inherit" />}
        >
          {loading
            ? isEdit
              ? "Updating..."
              : "Creating..."
            : isEdit
            ? "Update"
            : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
