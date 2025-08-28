"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  IconButton,
  Divider,
  Dialog,
  Tooltip,
  Zoom,
  Skeleton,
} from "@mui/material";
import {
  getDisplayMedia,
  deleteDisplayMedia,
} from "@/services/mosaicwall/displayMediaService";
import { useAuth } from "@/contexts/AuthContext";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import NoDataAvailable from "@/components/NoDataAvailable";
import useMediaSocket from "@/hooks/modules/mosaicwall/useMosaicWallMediaSocket";

const translations = {
  en: {
    mediaGallery: "Media Gallery",
    businessDescription:
      "View and manage media from your business display walls.",
    adminDescription:
      "View and manage all submitted media from your display walls.",
    noMediaAvailable: "No media available to display.",
    uploadedVia: "Uploaded via",
    cardWall: "Card Wall",
    mosaicWall: "Mosaic Wall",
    mediaCount: "{total} media uploads",
    noMessage: "No message provided",
    viewDetails: "View Details",
    delete: "Delete",
    deleteTitle: "Delete Media?",
    deleteMessage:
      "Are you sure you want to permanently delete this media item? This action cannot be undone.",
    deleteSuccess: "Media deleted successfully",
  },
  ar: {
    mediaGallery: "معرض الوسائط",
    businessDescription: "عرض وإدارة الوسائط من جدران عرض عملك.",
    adminDescription:
      "عرض وإدارة جميع الوسائط المرسلة من جدران العرض الخاصة بك.",
    noMediaAvailable: "لا توجد وسائط متاحة للعرض.",
    uploadedVia: "تم التحميل عبر",
    cardWall: "جدار البطاقات",
    mosaicWall: "جدار الفسيفساء",
    noMessage: "لم يتم تقديم رسالة",
    mediaCount: "{total} من الوسائط المرفوعة",
    viewDetails: "عرض التفاصيل",
    delete: "حذف",
    deleteTitle: "حذف الوسائط؟",
    deleteMessage:
      "هل أنت متأكد من أنك تريد حذف عنصر الوسائط هذا نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteSuccess: "تم حذف الوسائط بنجاح",
  },
};

const CMSUploadsPage = () => {
  const { wallSlug } = useParams();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState(null);
  const { user } = useAuth();
  const { t, dir } = useI18nLayout(translations);

  useMediaSocket({
  wallSlug,
  onMediaUpdate: (updatedList) => {
    let scoped = updatedList;
    if (user?.role === "business" && user?.business?._id) {
      scoped = updatedList.filter(
        (item) => item.wall?.business === user.business._id
      );
    }
    // Filter out any soft-deleted items as backup
    scoped = scoped.filter(item => !item.deletedAt && !item.isDeleted);
    setMedia(scoped);
  },
});

  const fetchMedia = async () => {
    setLoading(true);
    const response = await getDisplayMedia();
    let mediaData = response;
    if (user?.role === "business" && user?.business?._id) {
      mediaData = mediaData.filter(
        (item) => item.wall?.business === user.business._id
      );
    }
    mediaData = mediaData.filter((item) => item.wall?.slug === wallSlug);
    setMedia(mediaData);
    setLoading(false);
  };

  useEffect(() => {
    fetchMedia();
  }, [wallSlug]);

  const handlePreview = (item) => {
    setSelectedMedia(item);
    setPreviewOpen(true);
  };

  const handleDeleteClick = (item) => {
    setMediaToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
  if (!mediaToDelete) return;
  await deleteDisplayMedia(mediaToDelete._id);
  
  // Immediately remove from local state to prevent showing deleted item
  setMedia((prevMedia) => 
    prevMedia.filter((item) => item._id !== mediaToDelete._id)
  );
  
  setDeleteDialogOpen(false);
  setMediaToDelete(null);
  fetchMedia();
};
  const closePreview = () => {
    setPreviewOpen(false);
    setSelectedMedia(null);
  };

  const FullScreenPreview = ({ open, media, onClose }) => (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      TransitionComponent={Zoom}
      sx={{ "& .MuiDialog-paper": { backgroundColor: "#000" } }}
    >
      {media && (
        <Box
          position="relative"
          display="flex"
          flexDirection="column"
          height="100vh"
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 10,
              color: "white",
              backgroundColor: "rgba(0,0,0,0.5)",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.8)" },
            }}
          >
            <ICONS.close />
          </IconButton>

          <Box
            flex={1}
            display="flex"
            alignItems="center"
            justifyContent="center"
            px={2}
            py={4}
          >
            <Box
              sx={{
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: 5,
              }}
            >
              <img
                src={media.imageUrl}
                alt="Full screen preview"
                style={{ width: "70%", height: "auto", objectFit: "contain", display: "block", margin: "0 auto" }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              px: 4,
              py: 3,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.6), transparent)",
              color: "white",
            }}
          >
            <Typography variant="subtitle2" color="grey.400" gutterBottom>
              {t.uploadedVia}{" "}
              {media.wall.mode === "card" ? t.cardWall : t.mosaicWall}
            </Typography>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {media.wall.name}
            </Typography>
            {media.wall.mode === "card" && media.text && (
              <Typography
                variant="body1"
                color="grey.200"
                sx={{ mt: 1, whiteSpace: "pre-wrap", maxWidth: "250px" }}
              >
                {media.text}
              </Typography>
            )}
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <ICONS.time fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {formatDateTimeWithLocale(media.createdAt)}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Dialog>
  );

  if (loading) {
    return (
      <Container dir={dir} maxWidth={false} sx={{ py: 4 }}>
        <Skeleton variant="text" width="30%" height={50} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} />
      </Container>
    );
  }

  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />
      <Typography variant="h4" fontWeight="bold" mt={3} >
        {t.mediaGallery}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {user?.role === "business" ? t.businessDescription : t.adminDescription}
      </Typography>
      <Divider sx={{ mb: 4 }} />
      {/* Results Count */}
      <Box mb={3}>
        <Typography
          component="div"
          variant="body2"
          color="text.secondary"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <ICONS.library fontSize="small" />
          {t.mediaCount.replace("{total}", media.length)}
        </Typography>
      </Box>
      {media.length === 0 ? (
        <NoDataAvailable message={t.noMediaAvailable} />
      ) : (
        <Grid container spacing={3} justifyContent={"center"}>
          {media.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card elevation={2} sx={{ height: "100%", position: "relative" }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={item.imageUrl}
                  alt="Media"
                  sx={{ objectFit: "cover", cursor: "pointer" }}
                  onClick={() => handlePreview(item)}
                />
                {item.wall?.mode && (
                  <Chip
                    label={item.wall.mode.toUpperCase()}
                    size="small"
                    color={item.wall.mode === "card" ? "primary" : "secondary"}
                    sx={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}
                  />
                )}

                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {item.wall.name}
                  </Typography>
                  {item.wall.mode === "card" && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {item.text || <em>{t.noMessage}</em>}
                    </Typography>
                  )}
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <ICONS.time fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTimeWithLocale(item.createdAt)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" justifyContent="center" gap={1}>
                    <Tooltip title={t.viewDetails}>
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handlePreview(item)}
                      >
                        <ICONS.view fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t.delete}>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteClick(item)}
                      >
                        <ICONS.delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <FullScreenPreview
        open={previewOpen}
        media={selectedMedia}
        onClose={closePreview}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={t.deleteTitle}
        message={t.deleteMessage}
        confirmButtonText={t.delete}
        confirmButtonIcon={<ICONS.delete fontSize="small" />}
      />
    </Container>
  );
};

export default CMSUploadsPage;
