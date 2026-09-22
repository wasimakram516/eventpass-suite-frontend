  "use client";

  import { useState, useMemo } from "react";
  import {
    Box,
    Container,
    Typography,
    Divider,
    Stack,
    Button,
    TextField,
    InputAdornment,
    Chip,
  } from "@mui/material";
  import SupportAgentIcon from "@mui/icons-material/SupportAgent";
  import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
  import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
  import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
  import { useRouter } from "next/navigation";

  import { useAuth } from "@/contexts/AuthContext";
  import { useGlobalConfig } from "@/contexts/GlobalConfigContext";
  import useI18nLayout from "@/hooks/useI18nLayout";
  import { useModules, useModuleCategories } from "@/hooks/useModules";
  import { useModuleSearch } from "@/hooks/useModuleSearch";
  import CoreModuleBanner from "@/components/modules/CoreModuleBanner";
  import { CategoryCard, CategoryDetailView, ModuleCard, cardGridSx } from "@/components/modules/CategoryCard";
  import { groupByModuleCategory, getCategoryLabel, getCategoryMeta } from "@/utils/moduleCategories";
  import LoadingState from "@/components/LoadingState";
  import { fillTemplate } from "@/utils/stringUtil";

  const translations = {
    en: {
      title: "Modules",
      subtitle:
        "Manage all your interactive event tools in one place — quizzes, polls, audience engagement, registration, and more.",
      noPermission: "You currently do not have access to any modules.",
      contactSupport: "Please contact support to request access:",
      coreModule: "Core Module",
      coreFoundationBadge: "Core foundation",
      coreModuleTitle: "EventReg",
      coreTagline: "One attendee record. Every module connected.",
      coreSubtext: "The identity layer behind operations, engagement and reporting.",
      connectedModules: "Connected modules",
      openEventReg: "Open EventReg",
      attendeeDataConsumers: "Attendee data is used by",
      searchModules: "Find a module",
      allCategories: "All categories",
      exploreEcosystem: "Explore the ecosystem",
      categorySummary: "{count} categories",
      moduleSummary: "{count} modules",
      openCategory: "Open category",
      openModule: "Open module",
      allModules: "All modules",
      noSearchResults: "No modules match your search.",
    },
    ar: {
      title: "الوحدات",
      subtitle:
        "قم بإدارة جميع أدوات الفعاليات التفاعلية في مكان واحد — الاختبارات، الاستطلاعات، تفاعل الجمهور، التسجيل والمزيد.",
      noPermission: "ليس لديك إذن للوصول إلى أي وحدات حالياً.",
      contactSupport: "يرجى الاتصال بالدعم لطلب الوصول:",
      coreModule: "الوحدة الأساسية",
      coreFoundationBadge: "الأساس الأساسي",
      coreModuleTitle: "EventReg",
      coreTagline: "سجل واحد للحضور، وكل الوحدات متصلة.",
      coreSubtext: "طبقة الهوية التي تدعم العمليات والمشاركة والتقارير.",
      connectedModules: "الوحدات المتصلة",
      openEventReg: "فتح EventReg",
      attendeeDataConsumers: "تُستخدم بيانات الحضور في",
      searchModules: "ابحث عن وحدة",
      allCategories: "كل الفئات",
      exploreEcosystem: "استكشف منظومة الفعاليات",
      categorySummary: "{count} فئات",
      moduleSummary: "{count} وحدات",
      openCategory: "فتح الفئة",
      openModule: "فتح الوحدة",
      allModules: "كل الوحدات",
      noSearchResults: "لا توجد وحدات تطابق بحثك.",
    },
  };

  export default function Modules() {
    const { user } = useAuth();
    const { globalConfig } = useGlobalConfig();
    const { dir, align, language, t } = useI18nLayout(translations);
    const router = useRouter();

    const { modules, moduleLabelsById, loading } = useModules(user, { fetchFullCatalog: true, filterByRole: true });
    const { coreModules, groupedByCategory } = useModuleCategories(modules, groupByModuleCategory);

    const moduleRoutesById = useMemo(() => {
      const map = {};
      modules.forEach((m) => {
        if (m?.key && m?.route) map[m.key] = m.route;
      });
      return map;
    }, [modules]);

    // Category objects by id, so the EventReg banner can link its category chips.
    const categoriesById = useMemo(
      () => Object.fromEntries(groupedByCategory.map((group) => [group.category.id, group.category])),
      [groupedByCategory],
    );

    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [detailCategoryId, setDetailCategoryId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const { searchFilteredGroups, normalizedQuery } = useModuleSearch({
      groupedByCategory,
      searchQuery,
      language,
    });

    const coreModule = coreModules[0];
    const isCoreVisible = Boolean(coreModule);

    const noSearchMatches = Boolean(normalizedQuery && searchFilteredGroups.length === 0);

    const totalModuleCount = searchFilteredGroups.reduce((sum, group) => sum + group.items.length, 0);
    const totalCategoryCount = searchFilteredGroups.length;

    const activeGroup = selectedCategoryId
      ? searchFilteredGroups.find((group) => group.category.id === selectedCategoryId) || null
      : null;
    const detailGroup = detailCategoryId
      ? groupedByCategory.find((group) => group.category.id === detailCategoryId) || null
      : null;

    const handleOpenCategory = (categoryId) => {
      setSelectedCategoryId(categoryId);
    };

    const handleOpenModule = (mod) => {
      if (mod?.route) router.push(mod.route);
    };

    const handleBackFromDetail = () => {
      setDetailCategoryId(null);
    };

    const handleOpenDetail = (categoryId) => {
      setDetailCategoryId(categoryId);
    };

    // The search lives in the page header, so it must follow the same rule the
    // old in-body search did: only while the category overview is on screen.
    const showSearch = !loading && modules?.length > 0 && !(detailCategoryId && detailGroup);

    return (
      <Container
        maxWidth={false}
        dir={dir}
        sx={{ maxWidth: 1400, pb: 8, bgcolor: "background.default", px: { xs: 0 } }}
      >
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "flex-end" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h2" gutterBottom sx={{ fontWeight: "bold", textAlign: align }}>
                {t.title}
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", textAlign: align }}>
                {t.subtitle}
              </Typography>
            </Box>

            {showSearch && (
              <TextField
                size="small"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  if (event.target.value) {
                    setSelectedCategoryId(null);
                    setDetailCategoryId(null);
                  }
                }}
                placeholder={t.searchModules}
                sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlinedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                  htmlInput: { "aria-label": t.searchModules },
                }}
              />
            )}
          </Box>
          <Divider sx={{ my: 1.5, "&::before, &::after": { borderTopStyle: "dotted" } }} />
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <LoadingState />
          </Box>
        ) : modules?.length === 0 ? (
          <Stack spacing={2} sx={{ mt: 5, alignItems: "center" }}>
            <SupportAgentIcon color="primary" sx={{ fontSize: 64 }} />
            <Typography variant="h6" sx={{ textAlign: "center" }}>
              {t.noPermission}
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", textAlign: "center" }}>
              {t.contactSupport}
            </Typography>

            {(globalConfig?.support?.email || globalConfig?.support?.phone) && (
              <Stack spacing={1} sx={{ textAlign: "center", alignItems: "center" }}>
                {globalConfig?.support?.email && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <EmailOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="body2">{globalConfig.support.email}</Typography>
                  </Stack>
                )}
                {globalConfig?.support?.phone && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <PhoneOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="body2">{globalConfig.support.phone}</Typography>
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        ) : detailCategoryId && detailGroup ? (
          <CategoryDetailView
            group={detailGroup}
            language={language}
            t={t}
            onBack={handleBackFromDetail}
            onOpenModule={handleOpenModule}
          />
        ) : (
          <Box>
            {isCoreVisible && (
              <CoreModuleBanner
                coreModule={coreModule}
                moduleLabelsById={moduleLabelsById}
                moduleRoutesById={moduleRoutesById}
                categoriesById={categoriesById}
                onOpenCategory={handleOpenCategory}
                language={language}
                t={t}
              />
            )}

            {noSearchMatches ? (
              <Typography color="text.secondary" sx={{ textAlign: align }}>
                {t.noSearchResults}
              </Typography>
            ) : (
              <Box>
                <Stack direction="row" sx={{ flexWrap: "wrap", rowGap: { xs: 1, md: 0.75 }, columnGap: 1, mb: 4 }}>
                  <Chip
                    label={`${t.allCategories} (${totalModuleCount})`}
                    clickable
                    onClick={() => setSelectedCategoryId(null)}
                    color={!selectedCategoryId ? "primary" : "default"}
                    variant={!selectedCategoryId ? "filled" : "outlined"}
                  />
                  {searchFilteredGroups.map((group) => (
                    <Chip
                      key={group.category.id}
                      label={`${getCategoryLabel(group.category, language)} (${group.items.length})`}
                      clickable
                      onClick={() => handleOpenCategory(group.category.id)}
                      color={group.category.id === selectedCategoryId ? "primary" : "default"}
                      variant={group.category.id === selectedCategoryId ? "filled" : "outlined"}
                    />
                  ))}
                </Stack>

                {selectedCategoryId && activeGroup ? (
                  <Box>
                    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ textAlign: align }}>
                        {getCategoryLabel(activeGroup.category, language)}
                      </Typography>
                      <Button size="small" onClick={() => handleOpenDetail(activeGroup.category.id)} sx={{ textTransform: "none" }}>
                        {t.openCategory} ›
                      </Button>
                    </Stack>
                    <Box sx={cardGridSx}>
                      {activeGroup.items.map((mod) => (
                        <ModuleCard key={mod.key} mod={mod} categoryLabel={getCategoryLabel(activeGroup.category, language)} categoryColor={getCategoryMeta(activeGroup.category.id)?.color} language={language} onClick={handleOpenModule} />
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ textAlign: align }}>
                        {t.exploreEcosystem}
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                          {fillTemplate(t.categorySummary, { count: totalCategoryCount })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {fillTemplate(t.moduleSummary, { count: totalModuleCount })}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Box sx={cardGridSx}>
                      {searchFilteredGroups.map((group) => (
                        <CategoryCard key={group.category.id} group={group} language={language} onOpenCategory={handleOpenCategory} onOpenModule={handleOpenModule} t={t} />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </Container>
    );
  }