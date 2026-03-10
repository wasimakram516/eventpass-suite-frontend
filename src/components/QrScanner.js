"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  Button,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";
import useI18nLayout from "@/hooks/useI18nLayout";

const translations = {
  en: {
    initializing: "Initializing camera...",
    cameraSelector: "Choose camera",
    cameraDefault: "System default",
    cameraRear: "Rear camera",
    cameraFront: "Front camera",
    tooltip: {
      cancel: "Cancel scanning",
    },
    errors: {
      permissionDenied: "Camera permission denied.",
      noCamera: "No camera found.",
      generic: "Camera error.",
      switchFailed: "Unable to switch camera.",
    },
  },
  ar: {
    initializing: "\u062c\u0627\u0631\u064a \u062a\u0647\u064a\u0626\u0629 \u0627\u0644\u0643\u0627\u0645\u064a\u0631\u0627...",
    cameraSelector: "\u0627\u062e\u062a\u0631 \u0627\u0644\u0643\u0627\u0645\u064a\u0631\u0627",
    cameraDefault: "\u0627\u0644\u0643\u0627\u0645\u064a\u0631\u0627 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629",
    cameraRear: "\u0627\u0644\u0643\u0627\u0645\u064a\u0631\u0627 \u0627\u0644\u062e\u0644\u0641\u064a\u0629",
    cameraFront: "\u0627\u0644\u0643\u0627\u0645\u064a\u0631\u0627 \u0627\u0644\u0623\u0645\u0627\u0645\u064a\u0629",
    tooltip: {
      cancel: "\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0645\u0633\u062d",
    },
    errors: {
      permissionDenied: "\u062a\u0645 \u0631\u0641\u0636 \u0625\u0630\u0646 \u0627\u0644\u0643\u0627\u0645\u064a\u0631\u0627.",
      noCamera: "\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0643\u0627\u0645\u064a\u0631\u0627.",
      generic: "\u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u0643\u0627\u0645\u064a\u0631\u0627.",
      switchFailed: "\u062a\u0639\u0630\u0631 \u062a\u0628\u062f\u064a\u0644 \u0627\u0644\u0643\u0627\u0645\u064a\u0631\u0627.",
    },
  },
};

const CAMERA_SELECTIONS = {
  AUTO_DEFAULT: "__auto_default__",
  AUTO_ENVIRONMENT: "__auto_environment__",
  AUTO_USER: "__auto_user__",
};

const CAMERA_SCAN_CONFIG = {
  fps: 10,
};

const EXTERNAL_CAMERA_PATTERN = /\b(usb|external|webcam|logitech|uvc)\b/i;
const REAR_CAMERA_PATTERN = /\b(rear|back|environment|world)\b/i;
const FRONT_CAMERA_PATTERN = /\b(front|user|facetime|selfie)\b/i;

const isMediaDevicesSupported = () =>
  typeof navigator !== "undefined" &&
  !!navigator.mediaDevices?.getUserMedia &&
  !!navigator.mediaDevices?.enumerateDevices;

const isAutomaticSelection = (cameraId) =>
  Object.values(CAMERA_SELECTIONS).includes(cameraId);

const normalizeCameraLabel = (camera, index) =>
  camera?.label || (index === 0 ? "Default Camera" : `Camera ${index + 1}`);

const dedupeCameras = (cameras = []) => {
  const seen = new Set();

  return cameras.reduce((result, camera, index) => {
    const id = camera?.id || camera?.deviceId;
    if (!id || seen.has(id)) return result;

    seen.add(id);
    result.push({
      id,
      label: normalizeCameraLabel(camera, index),
    });

    return result;
  }, []);
};

const getCameraScore = (camera) => {
  const label = camera?.label || "";
  let score = 0;

  if (EXTERNAL_CAMERA_PATTERN.test(label)) score += 60;
  if (REAR_CAMERA_PATTERN.test(label)) score += 30;
  if (FRONT_CAMERA_PATTERN.test(label)) score -= 20;

  return score;
};

const sortCamerasByScore = (cameras = []) =>
  [...dedupeCameras(cameras)].sort((left, right) => {
    const scoreDiff = getCameraScore(right) - getCameraScore(left);
    if (scoreDiff !== 0) return scoreDiff;
    return left.label.localeCompare(right.label);
  });

const buildSelectableCameraOptions = (cameras = [], t) => {
  const options = [
    { id: CAMERA_SELECTIONS.AUTO_DEFAULT, label: t.cameraDefault },
    { id: CAMERA_SELECTIONS.AUTO_ENVIRONMENT, label: t.cameraRear },
    { id: CAMERA_SELECTIONS.AUTO_USER, label: t.cameraFront },
  ];

  sortCamerasByScore(cameras).forEach((camera, index) => {
    options.push({
      id: camera.id,
      label: camera.label || `${t.cameraSelector} ${index + 1}`,
    });
  });

  return options;
};

const getCameraErrorText = (error) =>
  `${error?.name || ""} ${error?.message || ""} ${
    typeof error === "string" ? error : ""
  }`.toLowerCase();

const isPermissionError = (error) => {
  const message = getCameraErrorText(error);
  return message.includes("notallowed") || message.includes("permission");
};

const isNoCameraError = (error) => {
  const message = getCameraErrorText(error);
  return (
    message.includes("notfound") ||
    message.includes("camera not found") ||
    message.includes("requested device not found") ||
    message.includes("overconstrained")
  );
};

const getCameraErrorMessage = (error, t) => {
  if (!isMediaDevicesSupported()) return t.errors.generic;
  if (isPermissionError(error)) return t.errors.permissionDenied;
  if (isNoCameraError(error)) return t.errors.noCamera;
  return t.errors.generic;
};

const toVideoInputs = (devices = []) =>
  devices
    .filter((device) => device.kind === "videoinput")
    .map((device, index) => ({
      id: device.deviceId,
      label: device.label || normalizeCameraLabel(device, index),
    }));

const buildCameraStartCandidates = (
  cameras = [],
  preferredCameraId = CAMERA_SELECTIONS.AUTO_DEFAULT
) => {
  const candidates = [];
  const seen = new Set();
  const rankedCameras = sortCamerasByScore(cameras);

  const addCandidate = (key, source, resolvedDeviceId = "") => {
    if (!source || seen.has(key)) return;
    seen.add(key);
    candidates.push({ key, source, resolvedDeviceId });
  };

  if (preferredCameraId && !isAutomaticSelection(preferredCameraId)) {
    addCandidate(`device:${preferredCameraId}`, preferredCameraId, preferredCameraId);
    return candidates;
  }

  const frontFirst = [
    ...rankedCameras.filter((camera) => FRONT_CAMERA_PATTERN.test(camera.label)),
    ...rankedCameras.filter((camera) => !FRONT_CAMERA_PATTERN.test(camera.label)),
  ];

  const environmentFirst = [
    ...rankedCameras.filter(
      (camera) =>
        EXTERNAL_CAMERA_PATTERN.test(camera.label) ||
        REAR_CAMERA_PATTERN.test(camera.label) ||
        getCameraScore(camera) > 0
    ),
    ...rankedCameras.filter(
      (camera) =>
        !EXTERNAL_CAMERA_PATTERN.test(camera.label) &&
        !REAR_CAMERA_PATTERN.test(camera.label) &&
        getCameraScore(camera) <= 0
    ),
  ];

  const orderedCameras =
    preferredCameraId === CAMERA_SELECTIONS.AUTO_USER
      ? frontFirst
      : preferredCameraId === CAMERA_SELECTIONS.AUTO_ENVIRONMENT
        ? environmentFirst
        : rankedCameras;

  orderedCameras.forEach((camera) =>
    addCandidate(`device:${camera.id}`, camera.id, camera.id)
  );

  if (preferredCameraId === CAMERA_SELECTIONS.AUTO_USER) {
    addCandidate("constraint:user", { facingMode: "user" });
    addCandidate("constraint:default", {});
  } else if (preferredCameraId === CAMERA_SELECTIONS.AUTO_ENVIRONMENT) {
    addCandidate("constraint:environment", { facingMode: "environment" });
    addCandidate("constraint:default", {});
  } else {
    addCandidate("constraint:environment", { facingMode: "environment" });
    addCandidate("constraint:default", {});
  }

  return candidates;
};

export default function QRScanner({ onScanSuccess, onError, onCancel }) {
  const { t, dir } = useI18nLayout(translations);
  const scannerElementId = useId().replace(/:/g, "_");

  const scannerHostRef = useRef(null);
  const scannerRef = useRef(null);
  const scannerModuleRef = useRef(null);
  const requestIdRef = useRef(0);
  const refreshCameraOptionsRef = useRef(null);
  const startScannerForSelectionRef = useRef(null);
  const onScanSuccessRef = useRef(onScanSuccess);
  const onErrorRef = useRef(onError);
  const translationsRef = useRef(t);
  const scanHandledRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [cameraOptions, setCameraOptions] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState("");
  const [selectedCameraId, setSelectedCameraId] = useState(
    CAMERA_SELECTIONS.AUTO_DEFAULT
  );
  const [switchError, setSwitchError] = useState("");

  const selectableCameraOptions = buildSelectableCameraOptions(cameraOptions, t);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    translationsRef.current = t;
  }, [t]);

  const loadScannerModule = async () => {
    if (scannerModuleRef.current) return scannerModuleRef.current;

    const scannerModule = await import("html5-qrcode");
    scannerModuleRef.current = scannerModule;
    return scannerModule;
  };

  const listAvailableCameras = async (scannerModule) => {
    if (!isMediaDevicesSupported()) return [];

    try {
      return dedupeCameras(await scannerModule.Html5Qrcode.getCameras());
    } catch (error) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = dedupeCameras(toVideoInputs(devices));
        if (videoInputs.length > 0) {
          return videoInputs;
        }
      } catch {}

      throw error;
    }
  };

  const destroyScanner = async (scannerInstance = scannerRef.current) => {
    const scannerModule = scannerModuleRef.current;
    const scanner = scannerInstance;

    if (!scanner) {
      if (scannerHostRef.current) {
        scannerHostRef.current.innerHTML = "";
      }
      return;
    }

    if (scannerRef.current === scanner) {
      scannerRef.current = null;
    }

    try {
      const state = scanner.getState?.();
      const scanningState = scannerModule?.Html5QrcodeScannerState?.SCANNING;
      const pausedState = scannerModule?.Html5QrcodeScannerState?.PAUSED;

      if (state === scanningState || state === pausedState) {
        await scanner.stop();
      }
    } catch {}

    try {
      scanner.clear();
    } catch {}

    if (scannerHostRef.current && scannerHostRef.current.childElementCount === 0) {
      scannerHostRef.current.innerHTML = "";
    }
  };

  const createScanner = (scannerModule) => {
    if (scannerHostRef.current) {
      scannerHostRef.current.innerHTML = "";
    }

    const scanner = new scannerModule.Html5Qrcode(scannerElementId, {
      verbose: false,
      formatsToSupport: [scannerModule.Html5QrcodeSupportedFormats.QR_CODE],
    });

    scannerRef.current = scanner;
    return scanner;
  };

  const startScannerForSelection = async (nextCameraId) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setSwitchError("");
    scanHandledRef.current = false;

    try {
      if (!isMediaDevicesSupported()) {
        throw new Error("Camera API unavailable");
      }

      const scannerModule = await loadScannerModule();
      const discoveredCameras = await listAvailableCameras(scannerModule);

      if (requestId !== requestIdRef.current) return;

      setCameraOptions(discoveredCameras);

      const startCandidates = buildCameraStartCandidates(
        discoveredCameras,
        nextCameraId
      );

      if (startCandidates.length === 0) {
        throw new Error("Camera not found");
      }

      let lastError = null;

      // Try exact camera ids first; only fall back to generic constraints when needed.
      for (const candidate of startCandidates) {
        const scanner = createScanner(scannerModule);

        try {
          await scanner.start(
            candidate.source,
            CAMERA_SCAN_CONFIG,
            async (decodedText) => {
              if (scanHandledRef.current) return;
              scanHandledRef.current = true;
              await destroyScanner(scanner);
              onScanSuccessRef.current?.(decodedText);
            },
            () => {}
          );

          if (requestId !== requestIdRef.current) {
            await destroyScanner(scanner);
            return;
          }

          const runningDeviceId =
            scanner.getRunningTrackSettings?.()?.deviceId ||
            candidate.resolvedDeviceId ||
            "";

          setActiveCameraId(runningDeviceId);
          setSelectedCameraId(nextCameraId);
          setLoading(false);
          setSwitchError("");

          const labeledCameras = await listAvailableCameras(scannerModule).catch(
            () => discoveredCameras
          );

          if (requestId === requestIdRef.current) {
            setCameraOptions(
              labeledCameras.length > 0 ? labeledCameras : discoveredCameras
            );
          }

          return;
        } catch (error) {
          lastError = error;
          await destroyScanner(scanner);
        }
      }

      setLoading(false);

      if (discoveredCameras.length > 0) {
        setSwitchError(getCameraErrorMessage(lastError, translationsRef.current));
        return;
      }

      onErrorRef.current?.(getCameraErrorMessage(lastError, translationsRef.current));
    } catch (error) {
      setLoading(false);
      onErrorRef.current?.(getCameraErrorMessage(error, translationsRef.current));
    }
  };

  startScannerForSelectionRef.current = startScannerForSelection;
  refreshCameraOptionsRef.current = async () => {
    try {
      const scannerModule = await loadScannerModule();
      const cameras = await listAvailableCameras(scannerModule);
      setCameraOptions(cameras);
    } catch {}
  };

  useEffect(() => {
    if (!isMediaDevicesSupported()) {
      onErrorRef.current?.(translationsRef.current.errors.generic);
      return undefined;
    }

    void startScannerForSelectionRef.current?.(CAMERA_SELECTIONS.AUTO_DEFAULT);

    const handleDeviceChange = () => {
      void refreshCameraOptionsRef.current?.();
    };

    navigator.mediaDevices.addEventListener?.("devicechange", handleDeviceChange);

    return () => {
      requestIdRef.current += 1;
      navigator.mediaDevices.removeEventListener?.(
        "devicechange",
        handleDeviceChange
      );
      void destroyScanner();
    };
  }, []);

  const handleCameraChange = async (nextCameraId) => {
    if (!nextCameraId || loading) return;

    if (
      nextCameraId === selectedCameraId &&
      (!activeCameraId || !isAutomaticSelection(nextCameraId))
    ) {
      return;
    }

    setSelectedCameraId(nextCameraId);
    await destroyScanner();
    await startScannerForSelection(nextCameraId);
  };

  return (
    <Box
      dir={dir}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Tooltip title={t.tooltip.cancel}>
        <IconButton
          onClick={onCancel}
          sx={{
            position: "absolute",
            top: 16,
            [dir === "rtl" ? "left" : "right"]: 16,
            color: "#fff",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <ICONS.close />
        </IconButton>
      </Tooltip>

      <Box
        sx={{
          width: "90vmin",
          height: "90vmin",
          position: "relative",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: 5,
          bgcolor: "#000",
        }}
      >
        <Box
          id={scannerElementId}
          ref={scannerHostRef}
          sx={{
            width: "100%",
            height: "100%",
            "& video, & canvas": {
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            },
            "& > div": {
              width: "100%",
              height: "100%",
            },
          }}
        />

        {loading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.6)",
              flexDirection: "row",
              zIndex: 2,
            }}
          >
            <CircularProgress color="inherit" />
            <Typography ml={2} color="#fff">
              {t.initializing}
            </Typography>
          </Box>
        )}

        {!loading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              border: "2px dashed #00e676",
              pointerEvents: "none",
              boxSizing: "border-box",
              zIndex: 1,
            }}
          />
        )}

        {selectableCameraOptions.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              left: 16,
              right: 16,
              bottom: 16,
              zIndex: 3,
            }}
          >
            {switchError && (
              <Typography
                variant="caption"
                aria-live="polite"
                sx={{
                  display: "block",
                  mb: 1,
                  color: "#ff8a80",
                  textAlign: "center",
                }}
              >
                {switchError}
              </Typography>
            )}

            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 1,
                color: "rgba(255,255,255,0.85)",
                textAlign: "center",
              }}
            >
              {t.cameraSelector}
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                overflowX: "auto",
                pb: 0.5,
                scrollbarWidth: "thin",
              }}
            >
              {selectableCameraOptions.map((camera, index) => {
                const isSelected = selectedCameraId === camera.id;

                return (
                  <Button
                    key={camera.id || `camera-${index}`}
                    type="button"
                    size="small"
                    variant={isSelected ? "contained" : "outlined"}
                    disabled={loading}
                    onClick={() => {
                      void handleCameraChange(camera.id);
                    }}
                    sx={{
                      flexShrink: 0,
                      minWidth: 140,
                      color: isSelected ? "#000" : "#fff",
                      backgroundColor: isSelected ? "#fff" : "rgba(0,0,0,0.65)",
                      borderColor: "rgba(255,255,255,0.35)",
                      "&:hover": {
                        borderColor: "#fff",
                        backgroundColor: isSelected
                          ? "#f2f2f2"
                          : "rgba(255,255,255,0.12)",
                      },
                    }}
                  >
                    {camera.label || `${t.cameraSelector} ${index + 1}`}
                  </Button>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
