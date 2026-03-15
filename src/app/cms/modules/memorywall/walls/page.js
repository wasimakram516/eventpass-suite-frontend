"use client";

import { useState, useEffect, useMemo } from "react";
import {
  createWallConfig,
  updateWallConfig,
  deleteWallConfig,
  getWallConfigBySlug,
  getWallConfigs,
} from "@/services/memorywall/wallConfigService";
import LoadingState from "@/components/LoadingState";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";
import {
  Box,
  Button,
  Container,
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
  FormControlLabel,
  Switch,
} from "@mui/material";
import ShareLinkModal from "@/components/modals/ShareLinkModal";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import WallConfigModal from "@/components/modals/WallConfigModal";
import { formatDate } from "@/utils/dateUtils";
import { getAllBusinesses } from "@/services/businessService";
import { useAuth } from "@/contexts/AuthContext";
import BusinessDrawer from "@/components/drawers/BusinessDrawer";
import EmptyBusinessState from "@/components/EmptyBusinessState";
import NoDataAvailable from "@/components/NoDataAvailable";
import useI18nLayout from "@/hooks/useI18nLayout";
import RecordMetadata from "@/components/RecordMetadata";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { useRouter, useSearchParams } from "next/navigation";

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
    card: "cards",
    bubble: "bubble",
    uploadBackground: "Upload Background",
    uploadLogo: "Upload Logo",
    enableRandomSizes: "Enable Random Sizes",
    minSize: "Min Size (px)",
    maxSize: "Max Size (px)",
    cancel: "Cancel",
    update: "Update",
    create: "Create",
    deleteWallConfig: "Delete Wall Config?",
    deleteConfirmMessage: "Are you sure you want to move this item to the Recycle Bin?",
    delete: "Delete",
    slugLabel: "Slug:",
    createdLabel: "Created:",
    showQRCode: "Show QR Code",
    openBigScreen: "Open Big Screen",
    viewUploads: "View Uploaded Media",
    edit: "Edit",
    wallConfigUpdated: "Wall configuration updated successfully",
    wallConfigCreated: "Wall configuration created successfully",
    wallConfigDeleted: "Wall configuration deleted successfully",
    invalidDate: "Invalid Date",
    createdBy: "Created:",
    createdAt: "Created At:",
    updatedBy: "Updated:",
    updatedAt: "Updated At:",
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
    mosaic: "mosaic",
    card: "card",
    bubble: "bubble",
    uploadBackground: "رفع خلفية",
    uploadLogo: "رفع شعار",
    enableRandomSizes: "تفعيل الأحجام العشوائية",
    minSize: "الحد الأدنى (بكسل)",
    maxSize: "الحد الأقصى (بكسل)",
    cancel: "إلغاء",
    update: "تحديث",
    create: "إنشاء",
    deleteWallConfig: "حذف تكوين الجدار؟",
    deleteConfirmMessage: "هل أنت متأكد أنك تريد نقل هذا العنصر إلى سلة المحذوفات؟",
    delete: "حذف",
    slugLabel: "الرمز:",
    createdLabel: "تم الإنشاء:",
    showQRCode: "عرض رمز الاستجابة السريعة",
    openBigScreen: "فتح الشاشة الكبيرة",
    viewUploads: "عرض الوسائط المرفوعة",
    edit: "تحرير",
    wallConfigUpdated: "تم تحديث تكوين الجدار بنجاح",
    wallConfigCreated: "تم إنشاء تكوين الجدار بنجاح",
    wallConfigDeleted: "تم حذف تكوين الجدار بنجاح",
    invalidDate: "تاريخ غير صالح",
    notAvailable: "غير متاح",
    createdBy: "أنشئ:",
    createdAt: "تاريخ الإنشاء:",
    updatedBy: "حدث:",
    updatedAt: "تاريخ التحديث:",
  },
};
export default function WallConfigsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [wallConfigs, setWallConfigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [currentSlug, setCurrentSlug] = useState("");
  const [currentWallConfig, setCurrentWallConfig] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [wallToDelete, setWallToDelete] = useState(null);
  const { user, selectedBusiness, setSelectedBusiness } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t, dir, align, language } = useI18nLayout(translations);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const initialSearch = searchParams.get("search");
    if (initialSearch) {
      setSearchTerm(initialSearch.trim());
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setIsLoading(true);

      const businessList = await getAllBusinesses();
      setBusinesses(businessList);

      if (user?.role === "business" && !selectedBusiness) {
        const userBusiness = businessList.find(
          (business) => business.slug === user.business?.slug
        );
        if (userBusiness) {
          setSelectedBusiness(userBusiness.slug);
          fetchWallConfigs(userBusiness.slug);
        }
      } else if (selectedBusiness) {
        fetchWallConfigs(selectedBusiness);
      }

      setIsLoading(false);
    };

    fetchBusinesses();
  }, [user, selectedBusiness, setSelectedBusiness]);

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

  const filteredWallConfigs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return wallConfigs;
    return wallConfigs.filter((config) => {
      const name = (config.name || "").toLowerCase();
      const slugVal = (config.slug || "").toLowerCase();
      return name.includes(term) || slugVal.includes(term);
    });
  }, [wallConfigs, searchTerm]);

  const handleBusinessSelect = (businessSlug) => {
    setSelectedBusiness(businessSlug);
    fetchWallConfigs(businessSlug);
    setDrawerOpen(false);
  };

  const selectedBusinessObject = businesses?.find?.(
    (business) => business.slug === selectedBusiness
  );

  const handleOpenCreate = () => {
    setCurrentConfig(null);
    setIsModalOpen(true);
  };

  const handleEdit = (config) => {
    setCurrentConfig(config);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentConfig(null);
  };

  const handleSubmitWall = async (formData, isEdit) => {
    const payload = {
      ...formData,
      businessId: selectedBusinessObject?._id || null,
    };

    try {
      const response = isEdit
        ? await updateWallConfig(currentConfig._id, payload)
        : await createWallConfig(payload);

      if (!response.error) {
        fetchWallConfigs(selectedBusiness);
        handleCloseModal();
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
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
    uploadUrl = `${window.location.origin}/memorywall/${currentSlug}/qr`;
    qrCodeUrl = `${window.location.origin}/memorywall/${currentSlug}/upload`;
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
          spacing={1}
          sx={{ my: 3 }}
          gap={dir === "rtl" ? 2 : 1}
        >
          {(user?.role === "admin" || user?.role === "superadmin") && (
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
              onClick={handleOpenCreate}
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
      ) : filteredWallConfigs.length === 0 ? (
        <NoDataAvailable />
      ) : (
        <Grid container spacing={3} justifyContent={"center"}>
          {filteredWallConfigs.map((config) => (
            <Grid item xs={12} sm={6} md={4} key={config._id} sx={{ width: { xs: '100%', sm: 'auto' } }}>
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
                  width: { xs: "100%", md: "auto" },
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
                    [dir === "rtl" ? "left" : "right"]: 12,
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
                    {t.createdLabel}{" "}
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
                <RecordMetadata
                  createdByName={config.createdBy}
                  updatedByName={config.updatedBy}
                  createdAt={config.createdAt}
                  updatedAt={config.updatedAt}
                  locale={language === "ar" ? "ar-SA" : "en-GB"}
                />
                <Divider />
                <CardActions sx={{ justifyContent: "space-between", p: 1.5 }}>
                  <Box>
                    <Tooltip title={t.showQRCode}>
                      <IconButton
                        size="small"
                        onClick={() => showQRCode(config.slug)}
                        aria-label="QR Code"
                      >
                        <ICONS.share fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t.openBigScreen}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          window.open(
                            `/memorywall/${config.slug}/big-screen`,
                            "_blank"
                          )
                        }
                        aria-label="Big Screen"
                      >
                        <ICONS.cast fontSize="small" color="primary" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box>
                    <Tooltip title={t.viewUploads}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          router.replace(
                            `/cms/modules/memorywall/walls/${config.slug}/uploads`)
                        }
                        aria-label="View Uploads"
                      >
                        <ICONS.view fontSize="small" color="primary" />
                      </IconButton>
                    </Tooltip>
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
      {(user?.role === "admin" || user?.role === "superadmin") && (
        <BusinessDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          businesses={businesses}
          selectedBusinessSlug={selectedBusiness}
          onSelect={handleBusinessSelect}
        />
      )}
      {/* Wall Config Modal */}
      <WallConfigModal
        open={isModalOpen}
        onClose={handleCloseModal}
        editMode={!!currentConfig}
        initialValues={currentConfig || {}}
        selectedWallConfig={currentConfig}
        onSubmit={handleSubmitWall}
        selectedBusiness={selectedBusiness}
        wallConfigId={currentConfig?._id}
      />

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
        message={t.deleteConfirmMessage}
        confirmButtonText={t.delete}
        confirmButtonIcon={<ICONS.delete fontSize="small" />}
      />
    </Container>
  );
}
