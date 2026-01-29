"use client";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  TextField,
} from "@mui/material";
import { Shuffle as ShuffleIcon, Sort as SortIcon, ChevronRight as ChevronRightIcon } from "@mui/icons-material";
import Confetti from "react-confetti";

import {
  getParticipantsBySlug,
  saveWinner,
  removeWinner,
  addParticipantsOnSpot,
  getWinners,
} from "@/services/eventwheel/spinWheelParticipantService";
import { getSpinWheelBySlug } from "@/services/eventwheel/spinWheelService";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";
import LanguageSelector from "@/components/LanguageSelector";

const btnSpin = "/freespin1.png";
const btnSpinClicked = "/freespin2.png";

const translations = {
  en: {
    winner: "Winner",
    spinning: "Spinning... Good Luck!",
    spinTheWheel: "Spin the Wheel!",
    congratulations: "Congratulations!",
    removeWinner: "Remove Winner",
    removeWinnerMessage: "This winner will be removed from the wheel but kept in records.",
    close: "Close",
    entries: "Participants",
    results: "Results",
    shuffle: "Shuffle",
    sort: "Sort",
    ready: "Ready",
    noWinners: "No winners yet",
    alertMessage: "Please enter at least one participant name!",
  },
  ar: {
    winner: "الفائز",
    spinning: "جاري الدوران... حظ سعيد!",
    spinTheWheel: "أدر العجلة!",
    congratulations: "تهانينا!",
    removeWinner: "إزالة الفائز",
    removeWinnerMessage: "سيتم إزالة هذا الفائز من العجلة ولكن سيتم الاحتفاظ به في السجلات.",
    close: "إغلاق",
    entries: "المشاركون",
    results: "النتائج",
    shuffle: "خلط",
    sort: "ترتيب",
    ready: "جاهز",
    noWinners: "لا يوجد فائزون بعد",
    alertMessage: "يرجى إدخال اسم مشارك واحد على الأقل!",
  },
};

const SPINS = 10; // deterministic spins
const DURATION_MS = 10000; // must match transition duration
const EASING = "cubic-bezier(0.17, 0.67, 0.32, 1)";

const normalizeDeg = (deg) => ((deg % 360) + 360) % 360;

const SpinningPage = () => {
  const params = useParams();
  const router = useRouter();
  const shortName = params.slug;

  const [participants, setParticipants] = useState([]);
  const participantsRef = useRef([]);
  const [eventData, setEventData] = useState(null);

  const [spinning, setSpinning] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState(0);
  const [entriesText, setEntriesText] = useState("");
  const [winners, setWinners] = useState([]);
  const [loadingWinners, setLoadingWinners] = useState(false);

  const wheelRef = useRef(null);
  const rotationRef = useRef(0); // stores accumulated rotation in degrees

  const { t, dir, align } = useI18nLayout(translations);

  const fetchParticipants = useCallback(async () => {
    const data = await getParticipantsBySlug(shortName);
    if (!data) return null;

    setParticipants(data);
    participantsRef.current = data;
    return data;
  }, [shortName]);

  const fetchSpinWheelData = useCallback(async () => {
    const wheelData = await getSpinWheelBySlug(shortName);
    if (wheelData) setEventData(wheelData);
    return wheelData;
  }, [shortName]);

  useEffect(() => {
    (async () => {
      const p = await fetchParticipants();
      if (!p) router.push("/");
      await fetchSpinWheelData();
    })();
  }, [fetchParticipants, fetchSpinWheelData, router]);

  // Initialize entries text when participants change
  useEffect(() => {
    if (participants.length > 0) {
      setEntriesText(participants.map((p) => p.name).join("\n"));
    }
  }, [participants]);

  const fetchWinners = useCallback(async () => {
    if (!eventData?.slug) return;
    setLoadingWinners(true);
    try {
      const data = await getWinners(eventData.slug);
      setWinners(data || []);
    } catch (err) {
      console.error("Failed to fetch winners:", err);
      setWinners([]);
    } finally {
      setLoadingWinners(false);
    }
  }, [eventData?.slug]);

  // Fetch winners on page load/refresh
  useEffect(() => {
    if (eventData?.slug) {
      fetchWinners();
    }
  }, [eventData?.slug, fetchWinners]);

  // ---------- Wheel geometry ----------
  const useWheelSize = () => {
    const getSize = () => {
      if (typeof window === "undefined") return 320;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const base = Math.min(vw, vh);

      // HARD clamp: mobile-safe → kiosk-safe
      return Math.max(240, Math.min(base * 0.75, 520));
    };

    const [size, setSize] = useState(getSize);

    useEffect(() => {
      const onResize = () => setSize(getSize());
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("orientationchange", onResize);
      };
    }, []);

    return size;
  };

  const size = useWheelSize();
  const r = size / 2;

  const pointerSize = size * 0.12;
  const trophySize = size * 0.14;
  const spinBtnWidth = Math.max(120, Math.min(size * 0.35, 220));
  const spinBtnHeight = Math.max(42, Math.min(size * 0.12, 70));

  const count = participants.length;
  const slice = count > 0 ? 360 / count : 0;

  // Key alignment: shift wheel so pointer is exactly on center of slice 0 when rotationRef=0
  const baseOffset = useMemo(
    () => (count > 0 ? -slice / 2 : 0),
    [count, slice]
  );

  const labelRadius = Math.round(r * 0.90);

  const labelChord = useMemo(() => {
    if (!count) return 80;
    const rad = (slice * Math.PI) / 180;

    return Math.max(80, Math.floor(2 * labelRadius * Math.sin(rad / 2) - 10));
  }, [count, slice, labelRadius]);

  const fontSize = useMemo(() => {
    if (!count) return 10;
    // Find the longest name to ensure all names fit
    const maxNameLength = Math.max(...participants.map(p => p.name?.length || 0), 0);
    let baseSize = 10;
    if (slice >= 30) baseSize = 14;
    else if (slice >= 20) baseSize = 12;
    else if (slice >= 14) baseSize = 11;

    if (maxNameLength > 20) {
      baseSize = Math.max(8, baseSize - 2);
    } else if (maxNameLength > 15) {
      baseSize = Math.max(9, baseSize - 1);
    }

    return baseSize;
  }, [count, slice, participants]);

  const wheelBg = useMemo(() => {
    if (!count) return "conic-gradient(#666 0deg 360deg)";
    const baseColors = [
      "hsl(0, 70%, 50%)",
      "hsl(120, 70%, 50%)",
      "hsl(240, 70%, 50%)",
      "hsl(60, 70%, 50%)",
    ];
    return `conic-gradient(${participants
      .map((_, i) => {
        const a0 = i * slice;
        const a1 = (i + 1) * slice;
        const c = baseColors[i % 4];
        return `${c} ${a0}deg ${a1}deg`;
      })
      .join(", ")})`;
  }, [participants, count, slice]);

  const applyRotation = useCallback(
    (degRaw) => {
      if (!wheelRef.current) return;
      // Transform is always degRaw + baseOffset (baseOffset is what makes “top=center of segment”)
      wheelRef.current.style.transform = `rotate(${degRaw + baseOffset}deg)`;
    },
    [baseOffset]
  );

  // Re-apply alignment when participant count changes (e.g., fetch updates)
  useEffect(() => {
    applyRotation(rotationRef.current);
  }, [applyRotation, count]);

  const getWinnerIndexFromRotation = useCallback((degRaw, localCount) => {
    // This is the corrected version (NO +slice/2), because baseOffset already centers the pointer.
    if (!localCount) return -1;
    const localSlice = 360 / localCount;
    const thetaApplied = normalizeDeg(degRaw + -localSlice / 2); // same as baseOffset for that count
    const alpha = (360 - thetaApplied) % 360;
    const eps = 1e-6; // avoid boundary floating error
    return Math.floor((alpha + eps) / localSlice);
  }, []);

  const handleSpinWheel = async () => {
    if (spinning) return;

    setSpinning(true);
    setSelectedWinner(null);

    // Always spin using fresh data (avoid stale state)
    const freshParticipants = await fetchParticipants();
    await fetchSpinWheelData();

    const list = freshParticipants ?? participantsRef.current;
    const n = list?.length ?? 0;

    if (!n) {
      setSpinning(false);
      return;
    }

    const localSlice = 360 / n;

    // Ensure current transform is “locked” before starting (no visual jump)
    if (wheelRef.current) {
      wheelRef.current.style.transition = "none";
      applyRotation(rotationRef.current);
      // force reflow
      void wheelRef.current.offsetHeight;
    }

    // Choose landing index
    const landingIndex = Math.floor(Math.random() * n);

    // Desired rotationRef modulo 360 such that landingIndex center is at the top pointer:
    // With baseOffset = -slice/2, this simplifies to: desiredMod = 360 - landingIndex*slice
    const currentMod = normalizeDeg(rotationRef.current);
    const desiredMod = normalizeDeg(360 - landingIndex * localSlice);
    const needed = normalizeDeg(desiredMod - currentMod);

    rotationRef.current += SPINS * 360 + needed;

    // Animate
    if (wheelRef.current) {
      wheelRef.current.style.transition = `transform ${DURATION_MS}ms ${EASING}`;
      applyRotation(rotationRef.current);
    }

    // Winner computed from final rotation (source of truth)
    window.setTimeout(async () => {
      const finalList = participantsRef.current?.length
        ? participantsRef.current
        : list;
      const finalN = finalList.length;

      const idx = getWinnerIndexFromRotation(rotationRef.current, finalN);
      const w = idx >= 0 ? finalList[idx] : null;

      if (w && eventData?._id) {
        try {
          await saveWinner({
            spinWheelId: eventData._id,
            participantId: w._id,
          });
          // Refresh winners list immediately after saving
          if (eventData?.slug) {
            fetchWinners();
          }
        } catch (err) {
          console.error("Failed to save winner:", err);
        }
      }

      setSelectedWinner(w);
      setSpinning(false);

      // Optional: normalize large rotations to keep numbers small (no visible change)
      requestAnimationFrame(() => {
        if (!wheelRef.current) return;
        wheelRef.current.style.transition = "none";
        rotationRef.current = normalizeDeg(rotationRef.current);
        applyRotation(rotationRef.current);
      });
    }, DURATION_MS + 30);
  };

  const handleRemoveWinner = async () => {
    if (!selectedWinner?._id) return;

    try {
      await removeWinner(selectedWinner._id);
      setSelectedWinner(null);
      await fetchParticipants();
    } catch (err) {
      console.error("Failed to remove winner:", err);
    }
  };

  // Drawer handlers
  const handleDrawerOpen = () => {
    setDrawerOpen(true);
    if (eventData?.type === "onspot") {
      setDrawerTab(0);
      if (participants.length > 0) {
        setEntriesText(participants.map((p) => p.name).join("\n"));
      }
    } else {
      setDrawerTab(0);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleShuffle = () => {
    const namesArray = entriesText
      .split("\n")
      .filter((name) => name.trim() !== "");
    const shuffled = namesArray.sort(() => Math.random() - 0.5);
    setEntriesText(shuffled.join("\n"));
  };

  const handleSort = () => {
    const namesArray = entriesText
      .split("\n")
      .filter((name) => name.trim() !== "");
    const sorted = namesArray.sort((a, b) => a.localeCompare(b));
    setEntriesText(sorted.join("\n"));
  };

  const handleReady = async () => {
    const formattedNames = entriesText
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name !== "");

    if (formattedNames.length === 0) {
      alert(t.alertMessage);
      return;
    }

    try {
      await addParticipantsOnSpot({
        slug: shortName,
        participants: formattedNames,
      });
      await fetchParticipants();
      setDrawerOpen(false);
    } catch (err) {
      console.error("Failed to update participants:", err);
    }
  };

  // Get entries count for tab label
  const entriesCount = entriesText
    .split("\n")
    .filter((name) => name.trim() !== "").length;

  return (
    <Box
      sx={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundSize: "cover",
        backgroundImage: eventData?.backgroundUrl
          ? `url(${eventData.backgroundUrl})`
          : "none",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
      }}
      dir={dir}
    >
      {eventData?.type === "enter_names" && (
        <IconButton
          sx={{
            position: "fixed",
            top: { xs: 10, sm: 20 },
            left: { xs: 10, sm: 20 },
            backgroundColor: "primary.main",
            color: "white",
            zIndex: 9999,
          }}
          onClick={() => router.push(`/eventwheel/wheels/${shortName}`)}
        >
          <ICONS.back sx={{ fontSize: { xs: 24, md: 40 } }} />
        </IconButton>
      )}

      {/* Drawer button (for onspot, admin, and sync types) */}
      {["onspot", "admin", "synced"].includes(eventData?.type) && !drawerOpen && (
        <IconButton
          sx={{
            position: "fixed",
            top: { xs: 10, sm: 20 },
            right: { xs: 10, sm: 20 },
            backgroundColor: "primary.main",
            color: "white",
            zIndex: 9999,
          }}
          onClick={handleDrawerOpen}
        >
          <ICONS.back sx={{ fontSize: { xs: 24, md: 40 } }} />
        </IconButton>
      )}

      {selectedWinner && <Confetti numberOfPieces={500} recycle={false} />}

      <Box
        sx={{
          mb: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {/* SPINNING */}
        {spinning && (
          <Typography
            variant="h4"
            sx={{
              color: "white",
              opacity: 0.85,
              letterSpacing: 1.5,
              animation: "pulse 1.2s ease-in-out infinite",
            }}
          >
            {t.spinning}
          </Typography>
        )}

        {/* IDLE */}
        {!spinning && !selectedWinner && (
          <Typography
            variant="h4"
            sx={{
              color: "white",
              opacity: 0.8,
              letterSpacing: 1.5,
            }}
          >
            {t.spinTheWheel}
          </Typography>
        )}

        <style jsx>{`
          @keyframes winnerReveal {
            0% {
              transform: scale(0.85);
              opacity: 0;
              filter: blur(4px);
            }
            100% {
              transform: scale(1);
              opacity: 1;
              filter: blur(0);
            }
          }

          @keyframes pulse {
            0%,
            100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }
        `}</style>
      </Box>

      {/* Pointer (top centered) */}

      <Box
        sx={{
          position: "absolute",
          top: `calc(50% - ${size / 2 + pointerSize * 0.35}px)`,
          left: "50%",
          transform: "translateX(-50%) rotate(180deg)",
          width: pointerSize,
          height: pointerSize,
          backgroundColor: "primary.main",
          clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
          zIndex: 10,
          boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.9)",
        }}
      />

      {/* Wheel */}
      <Box sx={{ position: "relative", width: size, height: size }}>
        {/* Rotating wheel */}
        <Box
          ref={wheelRef}
          sx={{
            width: size,
            height: size,
            borderRadius: "50%",
            border: "6px solid #fff",
            boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.6)",
            background: wheelBg,
            position: "relative",
            willChange: "transform",
            display: "block",
          }}
        >
          {/* Labels */}
          {participants.map((p, i) => {
            const angle = i * slice + slice / 2;
            return (
              <Box
                key={p._id}
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 0,
                  height: 0,
                  transform: `rotate(${angle}deg) translateY(-${labelRadius}px)`,
                  transformOrigin: "center",
                  pointerEvents: "none",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    width: "auto",
                    maxWidth: `${labelChord * 2}px`,
                    transform: "translateX(-50%) rotate(90deg)",
                    transformOrigin: "center",
                    textAlign: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: `${fontSize}px`,
                    whiteSpace: "nowrap",
                    overflow: "visible",
                    textOverflow: "clip",
                    lineHeight: 1.1,
                    userSelect: "none",
                  }}
                  title={p.name}
                >
                  {p.name}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Static center trophy overlay (NOT rotating) */}
        <ICONS.trophy
          sx={{
            fontSize: trophySize,
            color: "gold",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 11,
            pointerEvents: "none",
            textShadow: "0px 6px 12px rgba(0, 0, 0, 0.6)",
          }}
        />
      </Box>

      <Button
        onClick={handleSpinWheel}
        disabled={spinning || participants.length === 0}
        sx={{
          width: spinBtnWidth,
          height: spinBtnHeight,
          mt: size * 0.01,
          backgroundImage: `url(${spinning ? btnSpinClicked : btnSpin})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          borderRadius: spinBtnHeight / 2,
          transition: "transform 0.15s ease, opacity 0.15s ease",
          "&:hover": {
            opacity: 0.9,
            transform: "scale(1.04)",
          },
          "&:active": {
            transform: "scale(0.96)",
          },
          "&.Mui-disabled": {
            opacity: 0.5,
          },
        }}
      />

      {/* Winner Popup Dialog */}
      <Dialog
        open={!!selectedWinner && !spinning}
        onClose={() => setSelectedWinner(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: "center",
            fontSize: "2rem",
            fontWeight: "bold",
            pb: 1,
          }}
        >
          {t.congratulations}
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", pt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <ICONS.trophy
              sx={{
                fontSize: 80,
                color: "gold",
                mb: 2,
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
              }}
            />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 2,
              textShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            {selectedWinner?.name}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: "center",
            gap: 2,
            pb: 3,
            px: 3,
          }}
        >
          <Button
            variant="outlined"
            onClick={handleRemoveWinner}
            sx={{
              borderColor: "white",
              color: "white",
              "&:hover": {
                borderColor: "white",
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            {t.removeWinner}
          </Button>
          <Button
            variant="contained"
            onClick={() => setSelectedWinner(null)}
            sx={{
              backgroundColor: "white",
              color: "primary.main",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.9)",
              },
            }}
          >
            {t.close}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drawer for onspot, admin, and sync types */}
      {["onspot", "admin", "synced"].includes(eventData?.type) && (
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={handleDrawerClose}
          PaperProps={{
            sx: {
              width: { xs: "90%", sm: 400 },
              backgroundColor: "white",
              color: "text.primary",
            },
          }}
        >
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", position: "relative" }}>
              {/* Close button on left side of tabs */}
              <IconButton
                onClick={handleDrawerClose}
                sx={{
                  position: "absolute",
                  left: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 1,
                  backgroundColor: "primary.main",
                  color: "white",
                  width: 32,
                  height: 32,
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                }}
              >
                <ChevronRightIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <Tabs
                value={drawerTab}
                onChange={(e, newValue) => setDrawerTab(newValue)}
                sx={{
                  pl: 6,
                  "& .MuiTab-root": {
                    color: "rgba(0, 0, 0, 0.7)",
                    "&.Mui-selected": {
                      color: "primary.main",
                    },
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: "primary.main",
                  },
                }}
              >
                {eventData?.type === "onspot" && (
                  <Tab label={`${t.entries} ${entriesCount}`} />
                )}
                <Tab label={`${t.results} ${winners.length}`} />
              </Tabs>
            </Box>

            {/* Tab Content */}
            <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
              {eventData?.type === "onspot" && drawerTab === 0 ? (
                // Entries Tab (only for onspot type, tab index 0)
                <Box>
                  {/* Shuffle and Sort Buttons */}
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handleShuffle}
                      startIcon={<ShuffleIcon />}
                      sx={{
                        flex: 1,
                      }}
                    >
                      {t.shuffle}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleSort}
                      startIcon={<SortIcon />}
                      sx={{
                        flex: 1,
                      }}
                    >
                      {t.sort}
                    </Button>
                  </Box>

                  {/* Editable Names TextField */}
                  <TextField
                    fullWidth
                    multiline
                    rows={12}
                    value={entriesText}
                    onChange={(e) => setEntriesText(e.target.value)}
                    variant="outlined"
                    placeholder={t.placeholder}
                  />

                  {/* Ready Button */}
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleReady}
                    disabled={entriesCount === 0}
                    sx={{
                      mt: 2,
                      py: 1.5,
                    }}
                  >
                    {t.ready}
                  </Button>
                </Box>
              ) : (
                // Results Tab (tab index 1 for onspot, or tab index 0 for admin/sync)
                <Box>
                  {loadingWinners ? (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Loading...
                      </Typography>
                    </Box>
                  ) : winners.length === 0 ? (
                    <Box sx={{ textAlign: "center", mt: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t.noWinners}
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {winners.map((winner, index) => (
                        <ListItem
                          key={index}
                          sx={{
                            backgroundColor: "rgba(0, 0, 0, 0.02)",
                            mb: 1,
                            borderRadius: 1,
                            "&:hover": {
                              backgroundColor: "rgba(0, 0, 0, 0.05)",
                            },
                          }}
                        >
                          <ListItemText
                            primary={winner.name}
                            secondary={
                              winner.createdAt
                                ? new Date(winner.createdAt).toLocaleString()
                                : undefined
                            }
                            primaryTypographyProps={{
                              sx: { fontWeight: 500 },
                            }}
                            secondaryTypographyProps={{
                              sx: { color: "text.secondary" },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Drawer>
      )}
    </Box>
  );
};

export default SpinningPage;
