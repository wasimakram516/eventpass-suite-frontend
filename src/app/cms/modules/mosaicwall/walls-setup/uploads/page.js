"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Button,
  Paper,
  Skeleton,
  InputAdornment,
  Stack,
  Divider,
  Dialog,
  Tooltip,
  Zoom,
} from "@mui/material";
import {
  getDisplayMedia,
  deleteDisplayMedia,
} from "@/services/mosaicwall/displayMediaService";
import { useAuth } from "@/contexts/AuthContext";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { formatDate } from "@/utils/dateUtils";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import NoDataAvailable from "@/components/NoDataAvailable";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    mediaGallery: "Media Gallery",
    businessDescription:
      "View and manage media from your business display walls.",
    adminDescription:
      "View and manage all submitted media from your display walls.",
    filterTitle: "Filter Your Media",
    businessFilterDescription:
      "Use the search and dropdowns below to find media by wall, mode, or keywords from your business walls.",
    adminFilterDescription:
      "Use the search and dropdowns below to find media by wall, mode, or keywords.",
    searchPlaceholder: "Search by wall name or text...",
    wall: "Wall",
    allWalls: "All Walls",
    mode: "Mode",
    allModes: "All Modes",
    clearFilters: "Clear Filters",
    noMediaFound: "No media found",
    adjustFilters: "Try adjusting your filters to see more results.",
    noMediaAvailable: "No media available to display.",
    uploadedVia: "Uploaded via",
    cardWall: "Card Wall",
    mosaicWall: "Mosaic Wall",
    noMessage: "No message provided",
    viewDetails: "View Details",
    delete: "Delete",
    deleteTitle: "Delete Media?",
    deleteMessage:
      "Are you sure you want to permanently delete this media item? This action cannot be undone.",
    deleteSuccess: "Media deleted successfully",
    showingResults: "Showing {count} of {total} media items",
  },
  ar: {
    mediaGallery: "معرض الوسائط",
    businessDescription: "عرض وإدارة الوسائط من جدران عرض عملك.",
    adminDescription:
      "عرض وإدارة جميع الوسائط المرسلة من جدران العرض الخاصة بك.",
    filterTitle: "تصفية الوسائط الخاصة بك",
    businessFilterDescription:
      "استخدم البحث والقوائم المنسدلة أدناه للعثور على الوسائط حسب الجدار أو الوضع أو الكلمات المفتاحية من جدران عملك.",
    adminFilterDescription:
      "استخدم البحث والقوائم المنسدلة أدناه للعثور على الوسائط حسب الجدار أو الوضع أو الكلمات المفتاحية.",
    searchPlaceholder: "البحث باسم الجدار أو النص...",
    wall: "الجدار",
    allWalls: "جميع الجدران",
    mode: "الوضع",
    allModes: "جميع الأوضاع",
    clearFilters: "مسح المرشحات",
    noMediaFound: "لم يتم العثور على وسائط",
    adjustFilters: "حاول ضبط المرشحات لرؤية المزيد من النتائج.",
    noMediaAvailable: "لا توجد وسائط متاحة للعرض.",
    uploadedVia: "تم التحميل عبر",
    cardWall: "جدار البطاقات",
    mosaicWall: "جدار الفسيفساء",
    noMessage: "لم يتم تقديم رسالة",
    viewDetails: "عرض التفاصيل",
    delete: "حذف",
    deleteTitle: "حذف الوسائط؟",
    deleteMessage:
      "هل أنت متأكد من أنك تريد حذف عنصر الوسائط هذا نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteSuccess: "تم حذف الوسائط بنجاح",
    showingResults: "عرض {count} من {total} عنصر وسائط",
  },
};

const CMSUploadsPage = () => {
  const [media, setMedia] = useState([]);
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState(null);
  const { user } = useAuth(); // Add this line
  const [filters, setFilters] = useState({
    wall: "",
    mode: "",
    search: "",
  });
  const { t, dir } = useI18nLayout(translations);
  // Enhanced fetchMedia function with optional loader control
  const fetchMedia = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const response = await getDisplayMedia();
    let mediaData = response;
    // Filter by user role
    if (user?.role === "business" && user?.business?._id) {
      mediaData = mediaData.filter(
        (item) => item.wall?.business === user.business._id
      );
    }
    setMedia(mediaData);
    setFilteredMedia(mediaData);
    if (showLoader) setLoading(false);
  };

  // Initial data fetch
  useEffect(() => {
    fetchMedia();
  }, []);

  // Filter media based on current filters
  useEffect(() => {
    let filtered = media;

    if (filters.wall) {
      filtered = filtered.filter((item) => item.wall._id === filters.wall);
    }

    if (filters.mode) {
      filtered = filtered.filter((item) => item.wall.mode === filters.mode);
    }

    if (filters.search) {
      filtered = filtered.filter(
        (item) =>
          item.text.toLowerCase().includes(filters.search.toLowerCase()) ||
          item.wall.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredMedia(filtered);
  }, [filters, media]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ wall: "", mode: "", search: "" });
  };

  const getUniqueWalls = () => {
    let walls = media.map((item) => item.wall);
    // Filter by user role
    if (user?.role === "business" && user?.business?._id) {
      walls = walls.filter((wall) => wall?.business === user.business._id);
    }
    return walls.filter(
      (wall, index, self) => index === self.findIndex((w) => w._id === wall._id)
    );
  };

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
    setDeleteDialogOpen(false);
    setMediaToDelete(null);
    fetchMedia(false);
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
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "#000", // clean black background
        },
      }}
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
              backdropFilter: "blur(6px)",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.8)" },
            }}
          >
            <ICONS.close />
          </IconButton>

          {/* Image Display */}
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
                maxHeight: "100%",
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: 5,
              }}
            >
              <img
                src={media.imageUrl}
                alt="Full screen preview"
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                }}
              />
            </Box>
          </Box>

          {/* Caption Section */}
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

            <Typography
              variant="h5"
              fontWeight="bold"
              gutterBottom
              sx={{ textTransform: "capitalize" }}
            >
              {media.wall.name}
            </Typography>

            {media.wall.mode === "card" && media.text && (
              <Typography
                variant="body1"
                color="grey.200"
                sx={{
                  mt: 1,
                  whiteSpace: "pre-wrap",
                  maxWidth: "250px",
                }}
              >
                {media.text}
              </Typography>
            )}
            <Typography variant="caption" color="grey.500" mt={1}>
              {formatDate(media.createdAt)}
            </Typography>
          </Box>
        </Box>
      )}
    </Dialog>
  );

  if (loading) {
    return (
      <Container
        dir={dir}
        maxWidth={false}
        sx={{ py: 4, px: { xs: 2, sm: 4, md: 8 } }}
      >
        {/* Title Skeletons */}
        <Box mb={4}>
          <Skeleton variant="text" sx={{ width: "30%", height: 50 }} />
          <Skeleton variant="text" sx={{ width: "50%", height: 25 }} />
        </Box>

        {/* Filters Skeleton */}
        <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
            sx={{ my: 3 }}
          >
            <Skeleton
              variant="rectangular"
              sx={{ width: { xs: "100%", sm: 300 }, height: 56 }}
            />
            <Skeleton
              variant="rectangular"
              sx={{ width: { xs: "100%", sm: 200 }, height: 56 }}
            />
            <Skeleton
              variant="rectangular"
              sx={{ width: { xs: "100%", sm: 150 }, height: 56 }}
            />
          </Stack>
        </Paper>

        {/* Grid Skeleton */}
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={30} />
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="text" height={20} width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ my: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {t.mediaGallery}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {user?.role === "business"
              ? t.businessDescription
              : t.adminDescription}
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ mb: 4 }} />

      <Paper
        elevation={1}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 4,
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <Box mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">
            {t.filterTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.role === "business"
              ? t.businessFilterDescription
              : t.adminFilterDescription}
          </Typography>
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          sx={{ my: 3 }}
        >
          {/* Search on the left */}
          <TextField
            variant="outlined"
            size="small"
            placeholder={t.searchPlaceholder}
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            sx={{ width: { xs: "100%", sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ICONS.search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {/* Filters on the right */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
            sx={{ my: 3 }}
          >
            {/* Wall Selector */}
            <FormControl size="small" sx={{ width: { xs: "100%", sm: 160 } }}>
              <InputLabel>Wall</InputLabel>
              <Select
                value={filters.wall}
                label="Wall"
                onChange={(e) => handleFilterChange("wall", e.target.value)}
              >
                <MenuItem value="">
                  <em>{t.allWalls}</em>
                </MenuItem>
                {getUniqueWalls().map((wall) => (
                  <MenuItem key={wall._id} value={wall._id}>
                    {wall.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Mode Selector */}
            <FormControl size="small" sx={{ width: { xs: "100%", sm: 160 } }}>
              <InputLabel>{t.mode}</InputLabel>
              <Select
                value={filters.mode}
                label="Mode"
                onChange={(e) => handleFilterChange("mode", e.target.value)}
              >
                <MenuItem value="">
                  <em>{t.allModes}</em>
                </MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="mosaic">Mosaic</MenuItem>
              </Select>
            </FormControl>

            {/* Clear Button */}
            {(filters.wall || filters.mode || filters.search) && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<ICONS.clear />}
                sx={getStartIconSpacing(dir)}
                onClick={clearFilters}
              >
                {t.clearFilters}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Results Count */}
      <Box mb={3}>
        <Typography
          component="div"
          variant="body2"
          color="text.secondary"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <ICONS.library fontSize="small" />
          {t.showingResults
            .replace("{count}", filteredMedia.length)
            .replace("{total}", media.length)}
        </Typography>
      </Box>

      {/* Media Display */}
      {filteredMedia.length === 0 ? (
        <NoDataAvailable />
      ) : (
        <Grid container spacing={3}>
          {filteredMedia.map((item) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={item._id}
              sx={{ display: "flex" }}
            >
              <Card
                elevation={2}
                sx={{
                  width: "300px",
                  mx: "auto",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  transition: "0.3s ease",
                  "&:hover": { transform: "translateY(-2px)" },
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={item.imageUrl}
                  alt="Media"
                  sx={{ objectFit: "cover", cursor: "pointer" }}
                  onClick={() => handlePreview(item)}
                />

                {/* Top-right mode chip */}
                <Chip
                  label={item.wall.mode.toUpperCase()}
                  size="small"
                  color={item.wall.mode === "card" ? "primary" : "secondary"}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 2,
                    fontWeight: "bold",
                  }}
                />

                <CardContent
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    p: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ wordBreak: "break-word", mb: 1 }}
                  >
                    {item.wall.name}
                  </Typography>

                  {item.wall.mode === "card" && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        wordBreak: "break-word",
                      }}
                    >
                      {item.text || (
                        <em style={{ color: "#888" }}>{t.noMessage}</em>
                      )}
                    </Typography>
                  )}

                  <Box flexGrow={1} />

                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <ICONS.time fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(item.createdAt)}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 1 }} />

                    <Box display="flex" justifyContent="center" gap={1}>
                      <Tooltip title={t.viewDetails}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handlePreview(item)}
                        >
                          <ICONS.view fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={t.delete}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(item)}
                        >
                          <ICONS.delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
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
      />
    </Container>
  );
};

export default CMSUploadsPage;
