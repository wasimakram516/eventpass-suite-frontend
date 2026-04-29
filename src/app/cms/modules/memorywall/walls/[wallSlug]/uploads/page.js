"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
} from "@/services/memorywall/displayMediaService";
import { getWallConfigBySlug } from "@/services/memorywall/wallConfigService";
import { useAuth } from "@/contexts/AuthContext";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import NoDataAvailable from "@/components/NoDataAvailable";
import useMediaSocket from "@/hooks/modules/memorywall/useMemoryWallMediaSocket";

const translations = {
  en: {
    mediaGallery: "Media Gallery",
    businessDescription: "View and manage media from your business display walls.",
    adminDescription: "View and manage all submitted media from your display walls.",
    noMediaAvailable: "No media available to display.",
    uploadedVia: "Uploaded via",
    cardWall: "Card Wall",
    memoryWall: "Memory Wall",
    mediaCount: "{total} media uploads",
    noMessage: "No message provided",
    noSignature: "No signature provided",
    viewDetails: "View Details",
    delete: "Delete",
    deleteTitle: "Delete Media?",
    deleteMessage: "Are you sure you want to move this item to the Recycle Bin?",
    deleteSuccess: "Media deleted successfully",
  },
  ar: {
    mediaGallery: "معرض الوسائط",
    businessDescription: "عرض وإدارة الوسائط من جدران عرض عملك.",
    adminDescription: "عرض وإدارة جميع الوسائط المرسلة من جدران العرض الخاصة بك.",
    noMediaAvailable: "لا توجد وسائط متاحة للعرض.",
    uploadedVia: "تم التحميل عبر",
    cardWall: "جدار البطاقات",
    memoryWall: "جدار الذاكرة",
    noMessage: "لم يتم تقديم رسالة",
    noSignature: "لم يتم تقديم توقيع",
    mediaCount: "{total} من الوسائط المرفوعة",
    viewDetails: "عرض التفاصيل",
    delete: "حذف",
    deleteTitle: "حذف الوسائط؟",
    deleteMessage: "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    deleteSuccess: "تم حذف الوسائط بنجاح",
  },
};

const FullScreenPreview = ({ open, media, wallConfig, onClose, t }) => {
  const wallMode = media?.wall?.mode || wallConfig?.mode;
  const wallName = media?.wall?.name || wallConfig?.name;
  const inputType = media?.wall?.cardSettings?.inputType || wallConfig?.cardSettings?.inputType;

  return (
  <Dialog
    open={open}
    onClose={onClose}
    fullScreen
    TransitionComponent={Zoom}
    sx={{ "& .MuiDialog-paper": { backgroundColor: "#000" } }}
  >
    {media && (
      <Box position="relative" display="flex" flexDirection="column" height="100vh">
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

        <Box flex={1} display="flex" alignItems="center" justifyContent="center" px={2} py={4}>
          <Box sx={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: 2, overflow: "hidden", boxShadow: 5 }}>
            {media.imageUrl ? (
              <img
                src={media.imageUrl}
                alt="Full screen preview"
                style={{ maxWidth: "90%", maxHeight: "85vh", objectFit: "contain", display: "block", margin: "0 auto" }}
              />
            ) : (
              <Box
                width={300}
                height={300}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bgcolor="grey.900"
              >
                <Typography variant="h5" color="grey.500" sx={{ textTransform: "capitalize" }}>
                  No Image Content
                </Typography>
              </Box>
            )}
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
            background: "linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.6), transparent)",
            color: "white",
          }}
        >
          <Typography variant="subtitle2" color="grey.400" gutterBottom>
            {t.uploadedVia} {wallMode === "card" ? t.cardWall : t.memoryWall}
          </Typography>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {wallName}
          </Typography>
          {wallMode === "card" && (
            <Box sx={{ mt: 1, mb: 1 }}>
              {media.text && (
                <Typography variant="body1" color="grey.200" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: "800px", mb: media.signatureUrl ? 2 : 0 }}>
                  {media.text}
                </Typography>
              )}
              {media.signatureUrl && (
                <Box
                  component="img"
                  src={media.signatureUrl}
                  alt="Signature"
                  sx={{ width: 120, height: 120, objectFit: "contain", bgcolor: "#fff", borderRadius: 1, p: 0.5 }}
                />
              )}
              {!media.text && !media.signatureUrl && (
                <Typography variant="body2" color="grey.300" sx={{ fontStyle: "italic" }}>
                  {t.noMessage}
                </Typography>
              )}
            </Box>
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
)};

const CMSUploadsPage = () => {
  const { wallSlug } = useParams();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wallConfig, setWallConfig] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState(null);
  const { user } = useAuth();
  const { t, dir } = useI18nLayout(translations);

  const userRef = useRef(user);
  const wallSlugRef = useRef(wallSlug);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { wallSlugRef.current = wallSlug; }, [wallSlug]);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDisplayMedia();
      let mediaData = response || [];

      if (userRef.current?.role === "business" && userRef.current?.business?._id) {
        mediaData = mediaData.filter(
          (item) => item.wall?.business === userRef.current.business._id
        );
      }

      mediaData = mediaData.filter((item) => item.wall?.slug === wallSlugRef.current);

      mediaData = mediaData.filter((item) => !item.deletedAt && !item.isDeleted);

      setMedia(mediaData);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWallConfig = useCallback(async () => {
    try {
      const config = await getWallConfigBySlug(wallSlug);
      setWallConfig(config);
    } catch (error) {
      console.error("Failed to fetch wall config:", error);
    }
  }, [wallSlug]);

  useEffect(() => {
    fetchMedia();
    fetchWallConfig();
  }, [wallSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  useMediaSocket({
    wallSlug,
    onMediaUpdate: useCallback((updatedList) => {
      if (!updatedList || !Array.isArray(updatedList)) return;

      const user = userRef.current;
      const currentSlug = wallSlugRef.current;

      let scoped = updatedList;
      if (user?.role === "business" && user?.business?._id) {
        scoped = updatedList.filter(
          (item) => item.wall?.business === user.business._id
        );
      }

      scoped = scoped.filter((item) => !item.deletedAt && !item.isDeleted);

      setMedia((prev) => {
        const incomingById = new Map(updatedList.map((item) => [item._id, item]));
        const scopedById = new Map(scoped.map((item) => [item._id, item]));

        const patched = prev
          .filter((item) => {
            const incoming = incomingById.get(item._id);
            if (incoming && (incoming.deletedAt || incoming.isDeleted)) return false;
            return true;
          })
          .map((item) => {
            const updated = scopedById.get(item._id);
            return updated || item;
          });

        const existingIds = new Set(prev.map((item) => item._id));
        const newItems = scoped.filter(
          (item) =>
            !existingIds.has(item._id) &&
            item.wall?.slug === currentSlug
        );

        return [...patched, ...newItems];
      });
    }, []),
  });

  const handlePreview = (item) => {
    setSelectedMedia(item);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setSelectedMedia(null);
  };

  const handleDeleteClick = (item) => {
    setMediaToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!mediaToDelete) return;
    await deleteDisplayMedia(mediaToDelete._id);
    setMedia((prev) => prev.filter((item) => item._id !== mediaToDelete._id));
    setDeleteDialogOpen(false);
    setMediaToDelete(null);
  };

  if (loading) {
    return (
      <Container dir={dir} maxWidth={false} sx={{ py: 4 }}>
        <Skeleton variant="text" width="30%" height={50} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} />
      </Container>
    );
  }

  return (
    <Container dir={dir} maxWidth={false} disableGutters>
      <BreadcrumbsNav />
      <Typography variant="h4" fontWeight="bold" mt={3}>
        {t.mediaGallery}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {user?.role === "business" ? t.businessDescription : t.adminDescription}
      </Typography>
      <Divider sx={{ mb: 4 }} />

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
        <Grid container spacing={3} justifyContent="center">
          {media.map((item) => {
            const wallMode = item.wall?.mode || wallConfig?.mode;
            const wallName = item.wall?.name || wallConfig?.name;
            const displayTag = (!item.imageUrl && wallMode !== "card") ? "card" : wallMode;

            return (
            <Grid item xs={12} sm={12} md={6} key={item._id}>
              <Card elevation={2} sx={{ height: "100%", position: "relative" }}>
                {item.imageUrl ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={item.imageUrl}
                    alt="Media"
                    sx={{ objectFit: "cover", cursor: "pointer" }}
                    onClick={() => handlePreview(item)}
                  />
                ) : (
                  <Box
                    height={200}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bgcolor="grey.100"
                    onClick={() => handlePreview(item)}
                    sx={{ cursor: "pointer", borderBottom: "1px solid #eee" }}
                  >
                    <Typography variant="h6" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                      No Image
                    </Typography>
                  </Box>
                )}
                {displayTag && (
                  <Chip
                    label={displayTag.toUpperCase()}
                    size="small"
                    color={displayTag === "card" ? "primary" : "secondary"}
                    sx={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}
                  />
                )}

                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {wallName}
                  </Typography>

                  {wallMode === "card" && (
                    <Box sx={{ mt: 1, mb: 1 }}>
                      {item.text && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: item.signatureUrl ? 1 : 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {item.text}
                        </Typography>
                      )}
                      {item.signatureUrl && (
                        <Box
                          component="img"
                          src={item.signatureUrl}
                          alt="Signature"
                          sx={{ width: 96, height: 96, objectFit: "contain", bgcolor: "#fafafa", borderRadius: 1, border: "1px solid #eee", p: 0.5 }}
                        />
                      )}
                      {!item.text && !item.signatureUrl && (
                        <Typography variant="body2" color="text.secondary">
                          <em>{t.noMessage}</em>
                        </Typography>
                      )}
                    </Box>
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
                      <IconButton color="primary" size="small" onClick={() => handlePreview(item)}>
                        <ICONS.view fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t.delete}>
                      <IconButton color="error" size="small" onClick={() => handleDeleteClick(item)}>
                        <ICONS.delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        </Grid>
      )}

      <FullScreenPreview
        open={previewOpen}
        media={selectedMedia}
        wallConfig={wallConfig}
        onClose={closePreview}
        t={t}
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