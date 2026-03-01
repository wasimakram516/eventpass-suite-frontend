"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Stack,
  useMediaQuery,
  useTheme,
  List,
  ListItem,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import { useAuth } from "@/contexts/AuthContext";
import { globalSearch as fetchGlobalSearch } from "@/services/globalSearchService";
import useI18nLayout from "@/hooks/useI18nLayout";
import { formatDateTimeWithLocale } from "@/utils/dateUtils";
import BreadcrumbsNav from "@/components/nav/BreadcrumbsNav";

const translations = {
  en: {
    title: "Global Search",
    subtitle: "Search Full Name, Phone, Email, Company / Organization, or Country across all modules.",
    searchPlaceholder: "Search…",
    searchButton: "Search",
    searching: "Searching in Database..",
    noResults: "No results found.",
    loadError: "Search failed. Please try again.",
    recordsPerPage: "Records per page",
    showing: "Showing",
    of: "of",
    records: "records",
  },
  ar: {
    title: "البحث العام",
    subtitle: "ابحث بالاسم الكامل أو الهاتف أو البريد الإلكتروني أو الشركة/المؤسسة أو الدولة عبر جميع الوحدات.",
    searchPlaceholder: "بحث…",
    searchButton: "بحث",
    searching: "جاري البحث في قاعدة البيانات..",
    noResults: "لم يتم العثور على نتائج.",
    loadError: "فشل البحث. يرجى المحاولة مرة أخرى.",
    recordsPerPage: "عدد السجلات لكل صفحة",
    showing: "عرض",
    of: "من",
    records: "سجلات",
  },
};

export default function GlobalSearchPage() {
  const { user, selectedBusiness, setSelectedBusiness } = useAuth();
  const router = useRouter();
  const { dir, align, language, t } = useI18nLayout(translations);
  const labels =
    language === "ar"
      ? {
          fullName: "الاسم الكامل",
          company: "الشركة",
          phone: "الهاتف",
          email: "البريد الإلكتروني",
          itemType: "نوع العنصر",
          module: "الوحدة",
          eventName: "اسم الفعالية",
          time: "الوقت",
        }
      : {
          fullName: "Full Name",
          company: "Company",
          phone: "Phone",
          email: "Email",
          itemType: "Item Type",
          module: "Module",
          eventName: "Event Name",
          time: "Time",
        };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [clickLoading, setClickLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== "superadmin") {
      router.replace("/cms");
    }
  }, [user, router]);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setHasSearched(true);
    setSearching(true);
    setLoadError("");
    setResults([]);
    setPage(1);
    try {
      const res = await fetchGlobalSearch(q);
      if (res?.error) {
        setLoadError(res?.message || t.loadError);
        setResults([]);
      } else {
        const list = Array.isArray(res?.results) ? res.results : (res?.data?.results ?? []);
        setResults(Array.isArray(list) ? list.filter(Boolean) : []);
      }
    } catch (_err) {
      setLoadError(t.loadError);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(results.length / limit));
  const paginatedResults = results.slice((page - 1) * limit, page * limit);

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const renderTime = (date) =>
    date ? formatDateTimeWithLocale(date, language === "ar" ? "ar-SA" : "en-GB") : "—";

  const formatItemType = (value) => {
    if (!value) return "-";
    const map = {
      SurveyResponse: "Survey Response",
      SurveyRecipient: "Survey Recipient",
      SpinWheelParticipant: "Spin Wheel Participant",
    };
    const base = map[value] || value;
    return base.replace(/([a-z])([A-Z])/g, "$1 $2");
  };

  const handleRowClick = (row) => {
    if (!row) return;
    setClickLoading(true);
    const businessSlug = row.businessSlug;
    if (businessSlug && selectedBusiness !== businessSlug) {
      setSelectedBusiness(businessSlug);
    }

    const buildSearchQuery = () => {
      const candidates = [
        row.email,
        row.phone,
        row.fullName,
        row.company,
      ];
      const value =
        candidates.find((v) => v && v !== "-") || "";
      return value
        ? `?search=${encodeURIComponent(String(value))}`
        : "";
    };

    const searchQuery = buildSearchQuery();

    // Registrations (Event Reg / Check-in / DigiPass)
    if (row.itemType === "Registration") {
      const moduleName = row.module;
      const tokenSearch = row.token
        ? `?search=${encodeURIComponent(String(row.token))}`
        : searchQuery;

      if (row.eventSlug) {
        if (moduleName === "Check-in") {
          router.push(
            `/cms/modules/checkin/events/${row.eventSlug}/registrations${tokenSearch}`,
          );
        } else if (moduleName === "DigiPass") {
          router.push(
            `/cms/modules/digipass/events/${row.eventSlug}/registrations${tokenSearch}`,
          );
        } else {
          router.push(
            `/cms/modules/eventreg/events/${row.eventSlug}/registrations${tokenSearch}`,
          );
        }
      } else {
        if (moduleName === "Check-in") {
          router.push("/cms/modules/checkin/events");
        } else if (moduleName === "DigiPass") {
          router.push("/cms/modules/digipass/events");
        } else {
          router.push("/cms/modules/eventreg/events");
        }
      }
      return;
    }

    // SurveyGuru – recipients & responses
    if (row.module === "SurveyGuru") {
      if (row.itemType === "SurveyResponse" && row.formSlug) {
        const responseSearch =
          [row.fullName, row.email, row.company].find((v) => v && v !== "-") || "";
        const responseQuery = responseSearch
          ? `?search=${encodeURIComponent(String(responseSearch))}`
          : "";
        router.push(
          `/cms/modules/surveyguru/surveys/forms/${row.formSlug}/responses${responseQuery}`,
        );
        return;
      }

      if (row.itemType === "SurveyRecipient") {
        const params = new URLSearchParams();
        if (row?.businessId) params.set("businessId", String(row.businessId));
        if (row.eventId) params.set("eventId", String(row.eventId));
        if (row.formId) params.set("formId", String(row.formId));
        const recipientSearch =
          row.email || row.fullName || row.company || "";
        if (recipientSearch) {
          params.set("search", String(recipientSearch));
        }
        const qs = params.toString();
        router.push(
          `/cms/modules/surveyguru/surveys/recipients${qs ? `?${qs}` : ""}`,
        );
        return;
      }

      router.push("/cms/modules/surveyguru/surveys/recipients");
      return;
    }

    // Event Wheel participants
    if (row.itemType === "SpinWheelParticipant") {
      if (row.spinWheelSlug) {
        router.push(
          `/cms/modules/eventwheel/wheels/${row.spinWheelSlug}/participants${searchQuery}`,
        );
      } else {
        router.push("/cms/modules/eventwheel/wheels");
      }
      return;
    }

    // StageQ visitors
    if (row.itemType === "Visitor" || row.module === "StageQ") {
      const visitorSearch =
        [row.fullName, row.phone, row.company].find((v) => v && v !== "-") || "";
      const visitorQuery = visitorSearch
        ? `?search=${encodeURIComponent(String(visitorSearch))}`
        : "";
      router.push(`/cms/modules/stageq/queries/visitors${visitorQuery}`);
      return;
    }

    // Game players (TapMatch, QuizNest, EventDuel)
    if (row.itemType === "Player" && row.gameSlug) {
      const playerSearch =
        [row.fullName, row.phone, row.company].find((v) => v && v !== "-") || "";
      const playerQuery = playerSearch
        ? `?search=${encodeURIComponent(String(playerSearch))}`
        : "";
      if (row.module === "TapMatch") {
        router.push(
          `/cms/modules/tapmatch/games/${row.gameSlug}/results${playerQuery}`,
        );
        return;
      }
      if (row.module === "QuizNest") {
        router.push(
          `/cms/modules/quiznest/games/${row.gameSlug}/results${playerQuery}`,
        );
        return;
      }
      if (row.module === "EventDuel") {
        router.push(
          `/cms/modules/eventduel/games/${row.gameSlug}/host/sessions${playerQuery}`,
        );
        return;
      }
    }

    // Fallback: go to module root if we know it
    if (row.module === "Event Reg" || row.module === "Check-in" || row.module === "DigiPass") {
      if (row.module === "Check-in") {
        router.push("/cms/modules/checkin/events");
      } else if (row.module === "DigiPass") {
        router.push("/cms/modules/digipass/events");
      } else {
        router.push("/cms/modules/eventreg/events");
      }
      return;
    }
    if (row.module === "Event Wheel") {
      router.push("/cms/modules/eventwheel/wheels");
      return;
    }
    if (row.module === "TapMatch") {
      router.push("/cms/modules/tapmatch/games");
      return;
    }
    if (row.module === "QuizNest") {
      router.push("/cms/modules/quiznest/games");
      return;
    }
    if (row.module === "EventDuel") {
      router.push("/cms/modules/eventduel/games");
      return;
    }
  };

  const renderRowDesktop = (row, index) => (
    <TableRow
      key={`${row.fullName}-${row.email}-${row.time}-${index}`}
      sx={{
        "&:hover": { bgcolor: "action.hover" },
        "&:nth-of-type(odd)": { bgcolor: "action.selected" },
        "&:last-child td": { border: 0 },
        cursor: "pointer",
      }}
      onClick={() => handleRowClick(row)}
    >
      <TableCell sx={{ py: 1.5, textAlign: align }}>{row.fullName}</TableCell>
      <TableCell sx={{ py: 1.5, textAlign: align }}>{row.company}</TableCell>
      <TableCell sx={{ py: 1.5, textAlign: align }}>{row.phone}</TableCell>
      <TableCell sx={{ py: 1.5, textAlign: align }}>{row.email}</TableCell>
      <TableCell sx={{ py: 1.5, textAlign: align }}>{row.module}</TableCell>
      <TableCell sx={{ py: 1.5, textAlign: align }}>{row.eventName}</TableCell>
      <TableCell sx={{ py: 1.5, textAlign: align }}>{formatItemType(row.itemType)}</TableCell>
      <TableCell sx={{ py: 1.5, textAlign: align }}>{renderTime(row.time)}</TableCell>
    </TableRow>
  );

  const renderRowMobile = (row, index) => (
    <ListItem
      key={`${row.fullName}-${row.email}-${row.time}-${index}`}
      sx={{ px: 0, py: 1.5 }}
      onClick={() => handleRowClick(row)}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2.5,
          overflow: "hidden",
          boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 10px 24px rgba(15,23,42,0.1)",
          },
        }}
      >
        <Stack sx={{ py: 1.5, px: 2 }} spacing={0.75}>
          <Typography variant="body2" color="text.secondary" textAlign={align}>
            <Box component="span" sx={{ fontWeight: 600, color: "text.primary", marginInlineEnd: 0.5 }}>
              {labels.fullName}:
            </Box>
            {row.fullName}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign={align}>
            <Box component="span" sx={{ fontWeight: 600, color: "text.primary", marginInlineEnd: 0.5 }}>
              {labels.company}:
            </Box>
            {row.company}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign={align}>
            <Box component="span" sx={{ fontWeight: 600, color: "text.primary", marginInlineEnd: 0.5 }}>
              {labels.phone}:
            </Box>
            {row.phone}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign={align}>
            <Box component="span" sx={{ fontWeight: 600, color: "text.primary", marginInlineEnd: 0.5 }}>
              {labels.email}:
            </Box>
            {row.email}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign={align}>
            <Box component="span" sx={{ fontWeight: 600, color: "text.primary", marginInlineEnd: 0.5 }}>
              {labels.module}:
            </Box>
            {row.module}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign={align}>
            <Box component="span" sx={{ fontWeight: 600, color: "text.primary", marginInlineEnd: 0.5 }}>
              {labels.eventName}:
            </Box>
            {row.eventName}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign={align}>
            <Box component="span" sx={{ fontWeight: 600, color: "text.primary", marginInlineEnd: 0.5 }}>
              {labels.itemType}:
            </Box>
            {formatItemType(row.itemType)}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign={align}>
            <Box component="span" sx={{ fontWeight: 600, color: "text.primary", marginInlineEnd: 0.5 }}>
              {labels.time}:
            </Box>
            {renderTime(row.time)}
          </Typography>
        </Stack>
      </Paper>
    </ListItem>
  );

  if (user && user.role !== "superadmin") {
    return null;
  }

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {clickLoading && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(255,255,255,0.7)",
          }}
        >
          <CircularProgress size={48} />
        </Box>
      )}
      <Container
        dir={dir}
        maxWidth={false}
        sx={{ maxWidth: "1500px", px: { xs: 2, md: 3 } }}
      >
        <BreadcrumbsNav />

        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          gap={2}
          sx={{ mb: 3 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" fontWeight="bold" textAlign={align}>
              {t.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} textAlign={align}>
              {t.subtitle}
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ width: { xs: "100%", md: "auto" } }}
          >
            <TextField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t.searchPlaceholder}
              size="small"
              sx={{
                flex: 1,
                maxWidth: { sm: 320, md: 360 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  bgcolor: "background.paper",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ICONS.search fontSize="small" sx={{ opacity: 0.7 }} />
                  </InputAdornment>
                ),
                endAdornment: query ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setQuery("")} aria-label="Clear">
                      <ICONS.clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              startIcon={
                searching ? <CircularProgress size={18} color="inherit" /> : <ICONS.search />
              }
            >
              {t.searchButton}
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {searching && (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t.searching}
            </Typography>
          </Box>
        )}

        {!searching && loadError && (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="body1" color="error.main">
              {loadError}
            </Typography>
          </Box>
        )}

        {hasSearched && !searching && !loadError && results.length > 0 && (
          <>
            <Box
              display="flex"
              flexDirection={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              gap={2}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2" color="text.secondary" fontWeight={500} textAlign={align}>
                {t.showing}{" "}
                {(page - 1) * limit + 1}-{Math.min(page * limit, results.length)} {t.of}{" "}
                {results.length} {t.records}
              </Typography>
              <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 170 } }}>
                <InputLabel>{t.recordsPerPage}</InputLabel>
                <Select
                  value={limit}
                  onChange={handleLimitChange}
                  label={t.recordsPerPage}
                  sx={{ borderRadius: 2.5 }}
                >
                  {[5, 10, 20, 50, 100, 250, 500].map((n) => (
                    <MenuItem key={n} value={n}>
                      {n}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {isMobile ? (
              <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {paginatedResults.map((row, index) => renderRowMobile(row, index))}
              </List>
            ) : (
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2.5,
                  overflow: "hidden",
                  bgcolor: "background.paper",
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>
                        {labels.fullName}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>
                        {labels.company}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>
                        {labels.phone}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>
                        {labels.email}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>
                        {labels.module}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>
                        {labels.eventName}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>
                        {labels.itemType}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "background.default", py: 1.5, textAlign: align }}>
                        {labels.time}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedResults.map((row, index) => renderRowDesktop(row, index))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {results.length > limit && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  dir="ltr"
                  count={totalPages}
                  page={Math.min(page, totalPages)}
                  onChange={(_e, value) => setPage(value)}
                  shape="rounded"
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}

        {hasSearched && !searching && !loadError && results.length === 0 && query.trim() && (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              {t.noResults}
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
