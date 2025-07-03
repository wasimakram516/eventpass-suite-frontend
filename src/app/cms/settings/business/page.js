"use client";
import { useState } from "react";
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
  Divider
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";

const dummyBusinesses = [
  {
    id: "whitewall",
    name: "WhiteWall",
    slug: "whitewall",
    email: "info@whitewall.om",
    logo: "/WW.png",
  },
  {
    id: "takaful",
    name: "Takaful Oman",
    slug: "takaful-oman",
    email: "hello@takaful.om",
    logo: null,
  },
];

export default function BusinessDetailsPage() {
  const [businesses, setBusinesses] = useState(dummyBusinesses);
  const [editingBiz, setEditingBiz] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", logo: "" });

  const handleOpen = (biz) => {
    setEditingBiz(biz);
    setForm({
      name: biz.name,
      email: biz.email,
      logo: biz.logo || "",
    });
  };

  const handleClose = () => {
    setEditingBiz(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const updated = businesses.map((b) =>
      b.id === editingBiz.id ? { ...b, ...form } : b
    );
    setBusinesses(updated);
    handleClose();
  };

  return (
    <Container>
      <BreadcrumbsNav />

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Business Details
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Edit business contact info and branding.
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {businesses.map((biz) => (
          <Grid item xs={12} sm={6} md={4} key={biz.id}>
            <Card elevation={3} sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={biz.logo}
                  alt={biz.name}
                  sx={{ width: 56, height: 56, bgcolor: "primary.light" }}
                >
                  {biz.logo ? null : biz.name[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6">{biz.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Slug: <strong>{biz.slug}</strong>
                  </Typography>
                  <Typography variant="body2">{biz.email}</Typography>
                </Box>
              </Stack>

              <Box sx={{ mt: 2, textAlign: "right" }}>
                <Tooltip title="Edit Business" placement="top">
                  <IconButton color="primary" onClick={() => handleOpen(biz)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={Boolean(editingBiz)} onClose={handleClose} fullWidth>
        <DialogTitle>Edit Business</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            margin="dense"
            label="Name"
            name="name"
            fullWidth
            value={form.name}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Email"
            name="email"
            fullWidth
            value={form.email}
            onChange={handleChange}
          />

          {/* Logo Upload */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Business Logo
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                src={form.logo}
                alt="Preview"
                sx={{ width: 64, height: 64, border: "1px solid #ccc" }}
              >
                {form.name?.[0]}
              </Avatar>

              <Button variant="outlined" component="label" size="small">
                Upload Logo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setForm((prev) => ({ ...prev, logo: reader.result }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </Button>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
