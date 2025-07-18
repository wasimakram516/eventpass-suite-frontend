"use client";

import { useState, useEffect } from "react";
import {
  createWallConfig,
  updateWallConfig,
  deleteWallConfig,
  getWallConfigBySlug,
  getWallConfigs,
} from "@/services/mosaicwall/wallConfigService";
import LoadingState from "@/components/LoadingState";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  Stack,
  Tooltip,
} from "@mui/material";
import ShareLinkModal from "@/components/ShareLinkModal";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { formatDate } from "@/utils/dateUtils";
import { getAllBusinesses } from "@/services/businessService";
import { useAuth } from "@/contexts/AuthContext";
import BusinessDrawer from "@/components/BusinessDrawer";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";

const translations = {
  en: {
    wallConfigurations: "Wall Configurations",
    manageDisplayWalls: "Manage display walls for",
    selectBusinessToView:
      "Select a business to view and manage its wall configurations.",
    selectBusiness: "Select Business",
    newWallConfig: "New Wall Config",
    editWallConfig: "Edit Wall Config",
    createNewWallConfig: "Create New Wall Config",
    name: "Name",
    slug: "Slug",
    mode: "Mode",
    mosaic: "mosaic",
    card: "card",
    cancel: "Cancel",
    update: "Update",
    create: "Create",
    deleteWallConfig: "Delete Wall Config?",
    deleteConfirmMessage: "Are you sure you want to permanently delete",
    deleteActionCannotBeUndone: "This action cannot be undone.",
    delete: "Delete",
    slugLabel: "Slug:",
    createdLabel: "Created:",
    showQRCode: "Show QR Code",
    openBigScreen: "Open Big Screen",
    edit: "Edit",
    wallConfigUpdated: "Wall configuration updated successfully",
    wallConfigCreated: "Wall configuration created successfully",
    wallConfigDeleted: "Wall configuration deleted successfully",
    invalidDate: "Invalid Date",
    notAvailable: "N/A",
  },
  ar: {
    wallConfigurations: "تكوينات الجدار",
    manageDisplayWalls: "إدارة جدران العرض لـ",
    selectBusinessToView: "حدد عملاً لعرض وإدارة تكوينات الجدار الخاصة به.",
    selectBusiness: "اختر العمل",
    newWallConfig: "تكوين جدار جديد",
    editWallConfig: "تحرير تكوين الجدار",
    createNewWallConfig: "إنشاء تكوين جدار جديد",
    name: "الاسم",
    slug: "الرمز",
    mode: "النمط",
    mosaic: "فسيفساء",
    card: "بطاقة",
    cancel: "إلغاء",
    update: "تحديث",
    create: "إنشاء",
    deleteWallConfig: "حذف تكوين الجدار؟",
    deleteConfirmMessage: "هل أنت متأكد من أنك تريد حذف",
    deleteActionCannotBeUndone: "لا يمكن التراجع عن هذا الإجراء.",
    delete: "حذف",
    slugLabel: "الرمز:",
    createdLabel: "تم الإنشاء:",
    showQRCode: "عرض رمز الاستجابة السريعة",
    openBigScreen: "فتح الشاشة الكبيرة",
    edit: "تحرير",
    wallConfigUpdated: "تم تحديث تكوين الجدار بنجاح",
    wallConfigCreated: "تم إنشاء تكوين الجدار بنجاح",
    wallConfigDeleted: "تم حذف تكوين الجدار بنجاح",
    invalidDate: "تاريخ غير صالح",
    notAvailable: "غير متاح",
  },
};
export default function WallConfigsPage() {
  const [wallConfigs, setWallConfigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [currentSlug, setCurrentSlug] = useState("");
  const [currentWallConfig, setCurrentWallConfig] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [wallToDelete, setWallToDelete] = useState(null);
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t, dir, align } = useI18nLayout(translations);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    mode: "mosaic",
    businessId: "",
  });

  useEffect(() => {
    const fetchBusinesses = async () => {
      setIsLoading(true);

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
          fetchWallConfigs(userBusiness.slug);
        }
      }

      setIsLoading(false);
    };

    fetchBusinesses();
  }, [user]);
  const fetchWallConfigs = async (businessSlug = "") => {
    setIsLoading(true);
    const response = await getWallConfigs();

    let configs = response.data || response || [];
    if (businessSlug) {
      configs = configs.filter(
        (config) => config.business?.slug === businessSlug
      );
    }
    setWallConfigs(configs);
    setIsLoading(false);
  };

  const handleBusinessSelect = (businessSlug) => {
    setSelectedBusiness(businessSlug);
    fetchWallConfigs(businessSlug);
    setDrawerOpen(false);
  };

  const selectedBusinessObject = businesses.find(
    (business) => business.slug === selectedBusiness
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "name" && !currentConfig) {
      const slug = value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");
      setFormData((prev) => ({
        ...prev,
        slug,
      }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      businessId: selectedBusinessObject?._id || null,
    };
    if (currentConfig) {
      await updateWallConfig(currentConfig._id, payload);
    } else {
      console.log("In walls component:", payload);
      await createWallConfig(payload);
    }
    setIsModalOpen(false);
    fetchWallConfigs(selectedBusiness);
  };

  const handleEdit = (config) => {
    setCurrentConfig(config);
    setFormData({
      name: config.name,
      slug: config.slug,
      mode: config.mode,
      businessId: config.business?._id || "",
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!wallToDelete) return;
    await deleteWallConfig(wallToDelete._id);
    setDeleteDialogOpen(false);
    setWallToDelete(null);
    fetchWallConfigs(selectedBusiness);
  };

  const showQRCode = async (slug) => {
    setCurrentSlug(slug);
    const response = await getWallConfigBySlug(slug);
    setCurrentWallConfig(response);
    setIsQRModalOpen(true);
  };
  let uploadUrl = "";
  let qrCodeUrl = "";
  if (typeof window !== "undefined" && currentWallConfig) {
    uploadUrl = `${window.location.origin}/mosaicwall/${currentSlug}/qr`;
    qrCodeUrl = `${window.location.origin}/mosaicwall/${currentSlug}/upload`;
  }
  return (
    <Container dir={dir} maxWidth="lg">
      <BreadcrumbsNav />
      {/* Header Section */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ my: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {t.wallConfigurations}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {selectedBusiness
              ? `${t.manageDisplayWalls} ${selectedBusinessObject?.name}`
              : t.selectBusinessToView}
          </Typography>
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          sx={{ my: 3 }}
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
              onClick={() => {
                setCurrentConfig(null);
                setFormData({
                  name: "",
                  slug: "",
                  mode: "mosaic",
                });
                setIsModalOpen(true);
              }}
              sx={getStartIconSpacing(dir)}
            >
              {t.newWallConfig}
            </Button>
          )}
        </Stack>
      </Stack>
      {/* Divider */}
      <Divider sx={{ mb: 4 }} />

      {/* Grid of Config Cards */}
      {!selectedBusiness ? (
        <EmptyBusinessState />
      ) : isLoading ? (
        <Box sx={{ textAlign: align, mt: 8 }}>
          <LoadingState />
        </Box>
      ) : wallConfigs.length === 0 ? (
        <NoDataAvailable />
      ) : (
        <Grid container spacing={3} justifyContent={"center"}>
          {wallConfigs.map((config) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={config._id}>
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
                {/* Chip at top-right */}
                <Chip
                  label={config.mode}
                  color={config.mode === "mosaic" ? "primary" : "secondary"}
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
                    {config.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, wordBreak: "break-word" }}
                  >
                    <strong>{t.slugLabel}</strong> {config.slug}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Created:{" "}
                    {(() => {
                      try {
                        if (!config.createdAt) return t.notAvailable;
                        const testDate = new Date(config.createdAt);
                        if (isNaN(testDate.getTime())) return t.invalidDate;
                        return formatDate(config.createdAt);
                      } catch (error) {
                        console.error(
                          "Error formatting date:",
                          error,
                          config.createdAt
                        );
                        return t.invalidDate;
                      }
                    })()}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: "space-between", p: 1.5 }}>
                  <Box>
                    <Tooltip title={t.showQRCode}>
                      <IconButton
                        size="small"
                        onClick={() => showQRCode(config.slug)}
                        aria-label="QR Code"
                      >
                        <ICONS.qrcode fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t.openBigScreen}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          window.open(
                            `/mosaicwall/${config.slug}/big-screen`,
                            "_blank"
                          )
                        }
                        aria-label="Big Screen"
                      >
                        <ICONS.view fontSize="small" color="primary" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box>
                    <Tooltip title={t.edit}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(config)}
                        aria-label="Edit"
                      >
                        <ICONS.edit fontSize="small" color="primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t.delete}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setWallToDelete(config);
                          setDeleteDialogOpen(true);
                        }}
                        aria-label="Delete"
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
      {user?.role === "admin" && (
        <BusinessDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          businesses={businesses}
          selectedBusinessSlug={selectedBusiness}
          onSelect={handleBusinessSelect}
        />
      )}
      {/* Create/Edit Modal */}
      <Dialog
        open={isModalOpen}
        maxWidth="sm"
        fullWidth
        onClose={() => setIsModalOpen(false)}
      >
        <DialogTitle>
          {currentConfig ? t.editWallConfig : t.createNewWallConfig}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                width: "100%",
              }}
            >
              <TextField
                label={t.name}
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <TextField
                label={t.slug}
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <FormControl fullWidth>
                <InputLabel>{t.mode}</InputLabel>
                <Select
                  name="mode"
                  value={formData.mode}
                  label={t.mode}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="mosaic">{t.mosaic}</MenuItem>
                  <MenuItem value="card">{t.card}</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsModalOpen(false)}>{t.cancel}</Button>
            <Button type="submit" variant="contained">
              {currentConfig ? t.update : t.create}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* QR Modal */}
      <ShareLinkModal
        open={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        url={uploadUrl}
        qrUrl={qrCodeUrl}
        name={currentSlug}
      />
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={t.deleteWallConfig}
        message={`${t.deleteConfirmMessage} "${wallToDelete?.name}"? ${t.deleteActionCannotBeUndone}`}
        confirmButtonText={t.delete}
      />
    </Container>
  );
}
