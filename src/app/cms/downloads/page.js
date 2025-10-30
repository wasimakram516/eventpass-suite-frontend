"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Divider,
  IconButton,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import {
  CloudUpload as UploadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Share as ShareIcon,
} from "@mui/icons-material";

import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import BusinessDrawer from "@/components/BusinessDrawer";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getAllBusinesses } from "@/services/businessService";
import {
  getAllFiles,
  createFile,
  updateFile,
  deleteFile,
} from "@/services/fileResourceService";
import FileUploadDialog from "@/components/FileUploadDialog";
import AppCard from "@/components/cards/AppCard";
import ShareLinkModal from "@/components/ShareLinkModal";
import ConfirmationDialog from "@/components/ConfirmationDialog";

const translations = {
  en: {
    pageTitle: "Manage Files",
    pageDescription: "Manage downloadable media files for this business.",
    selectBusiness: "Select Business",
    uploadFile: "Upload File",
    noFiles: "No files found.",
    title: "Title",
    slug: "Slug",
    type: "Type",
    edit: "Edit",
    delete: "Delete",
    share: "Share",
    deleteConfirmTitle: "Delete File?",
    deleteConfirmMsg:
      "Are you sure you want to permanently delete this file? This action cannot be undone.",
    yesDelete: "Yes, Delete",
  },
  ar: {
    pageTitle: "إدارة الملفات",
    pageDescription: "إدارة الملفات القابلة للتنزيل لهذا العمل.",
    selectBusiness: "اختر العمل",
    uploadFile: "تحميل ملف",
    noFiles: "لا توجد ملفات.",
    title: "العنوان",
    slug: "المعرف",
    type: "النوع",
    edit: "تعديل",
    delete: "حذف",
    share: "مشاركة",
    deleteConfirmTitle: "حذف الملف؟",
    deleteConfirmMsg:
      "هل أنت متأكد أنك تريد حذف هذا الملف نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.",
    yesDelete: "نعم، حذف",
  },
};

export default function FileStorePage() {
  const { user } = useAuth();
  const { t, dir } = useI18nLayout(translations);

  const [allBusinesses, setAllBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [shareData, setShareData] = useState({
    open: false,
    url: "",
    name: "",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    fileId: null,
  });

  useEffect(() => {
    getAllBusinesses()
      .then((b) => setAllBusinesses(b || []))
      .catch(() => setAllBusinesses([]));
  }, []);

  useEffect(() => {
    if (user?.role === "business" && user.business?.slug)
      setSelectedBusiness(user.business.slug);
  }, [user]);

  const fetchFiles = async () => {
    if (!selectedBusiness) {
      setFiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getAllFiles(selectedBusiness);
    setFiles(res || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, [selectedBusiness]);

  const handleBusinessSelect = (slug) => {
    setSelectedBusiness(slug);
    setDrawerOpen(false);
  };

  const handleCreate = async (formData) => {
    await createFile(formData);
    fetchFiles();
  };

  const handleUpdate = async (formData, id) => {
    await updateFile(id, formData);
    fetchFiles();
  };

  const handleDelete = (id) => {
    setConfirmDialog({ open: true, fileId: id });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.fileId) return;
    await deleteFile(confirmDialog.fileId);
    setConfirmDialog({ open: false, fileId: null });
    fetchFiles();
  };

  const handleShare = (slug, title) => {
    const base = typeof window !== "undefined" ? window.origin : "";
    setShareData({
      open: true,
      url: `${base}/${slug}`,
      name: title || slug,
    });
  };

  return (
    <Box dir={dir}>
      {user?.role === "admin" && (
        <BusinessDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          businesses={allBusinesses}
          selectedBusinessSlug={selectedBusiness}
          onSelect={handleBusinessSelect}
        />
      )}

      <Container maxWidth="lg">
        <BreadcrumbsNav />
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            mt: 2,
            mb: 1,
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              {t.pageTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.pageDescription}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            {user?.role === "admin" && (
              <Button
                variant="outlined"
                onClick={() => setDrawerOpen(true)}
                startIcon={<BusinessIcon />}
              >
                {t.selectBusiness}
              </Button>
            )}
            {selectedBusiness && (
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => {
                  setEditingFile(null);
                  setOpenDialog(true);
                }}
              >
                {t.uploadFile}
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {!selectedBusiness ? (
          <EmptyBusinessState />
        ) : loading ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : files.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <Grid container spacing={2}>
            {files.map((f) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={f._id}>
                <AppCard
                  sx={{
                    p: 2,
                    height: "100%",
                    justifyContent: "space-between",
                    width: { xs: "100%", sm: 360 },
                  }}
                >
                  <Box>
                    <FileIcon sx={{ fontSize: 40, color: "primary.main" }} />
                    <Typography variant="subtitle1" fontWeight="bold" mt={1}>
                      {f.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      noWrap
                      title={f.slug}
                    >
                      {f.slug}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {f.contentType}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      mt: 2,
                      gap: 1,
                    }}
                  >
                    <IconButton
                      color="primary"
                      onClick={() => handleShare(f.slug, f.title)}
                      title={t.share}
                    >
                      <ShareIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={() => {
                        setEditingFile(f);
                        setOpenDialog(true);
                      }}
                      title={t.edit}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(f._id)}
                      title={t.delete}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </AppCard>
              </Grid>
            ))}
          </Grid>
        )}

        {openDialog && (
          <FileUploadDialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            onSubmit={editingFile ? handleUpdate : handleCreate}
            editingFile={editingFile}
            businessSlug={selectedBusiness}
          />
        )}

        {shareData.open && (
          <ShareLinkModal
            open={shareData.open}
            onClose={() => setShareData({ open: false, url: "", name: "" })}
            url={shareData.url}
            name={shareData.name}
          />
        )}

        {confirmDialog.open && (
          <ConfirmationDialog
            open={confirmDialog.open}
            onClose={() => setConfirmDialog({ open: false, fileId: null })}
            onConfirm={confirmDelete}
            title={t.deleteConfirmTitle}
            message={t.deleteConfirmMsg}
            confirmButtonText={t.yesDelete}
            confirmButtonIcon={<DeleteIcon />}
            confirmButtonColor="error"
          />
        )}
      </Container>
    </Box>
  );
}
