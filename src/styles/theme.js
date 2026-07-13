import { createTheme } from "@mui/material/styles";

export const getTheme = (mode = "light", direction = "ltr") => {
  const isDark = mode === "dark";
  const primaryMain = isDark ? "#2DD4BF" : "#0F766E";
  const secondaryMain = isDark ? "#FFE14D" : "#F5C518";

  const successMain = "#2e7d32";
  const warningMain = "#ED6C02";
  const errorMain = "#d32f2f";

  return createTheme({
    direction,
    palette: {
      mode,
      primary: {
        main: primaryMain,
        // dark-mode primary is a light mint tint (for contrast against the
        // dark background), so it needs dark text; light-mode primary stays
        // dark enough for white text.
        contrastText: isDark ? "#0f1417" : "#ffffff",
      },
      common: {
        white: "#ffffff",
        black: "#000000",
      },

      signature: {
        pen: "#111111",
      },

      canvas: {
        light: "#f5f5f5",
      },
      trophy: {
        gold: "#FFD700"
      },
      badge: {
        primary: "#128199",
        primaryDark: "#0a5e71",
        primaryDeep: "#083b4f",
        ink: "#073642",
        inkSoft: "#58707a",
        line: "#dbe8ec",
        surface: "#f7fbfc",
        titleGray: "#444444",
      },
      badgePreview: {
        clipBg: isDark ? "#0f1417" : "#f8fafc",
        clipBarBg: "#cbd5e0",
        clipBumpBg: "#64748b",
        clipBumpDot: "#475569",
        shadowClipBump: "0 4px 6px rgba(0,0,0,0.1)",
        shadowPaper: "0 25px 50px -12px rgba(0,0,0,0.15)",
        shadowCategoryTag: "0 4px 6px -1px rgba(0,0,0,0.1)",
        watermarkGlowDark: "0 0 2px rgba(255,255,255,0.35)",
      },
      wall: {


        swatchShadow: isDark
          ? "0 2px 4px rgba(0,0,0,0.3)"
          : "0 2px 4px rgba(0,0,0,0.1)",
        swatchHoverBorder: isDark ? "#71717a" : "#a1a1aa",
        cardBackground: isDark ? "#1a2226" : "#ffffff",
        text: isDark ? "#ffffff" : "#000000",
        signature: isDark ? "#ffffff" : "#000000",
        whiteText: "#ffffff",
        bubbleShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        bubbleBg: "rgba(255, 255, 255, 0.95)",
        bubbleGlassOverlay:
          "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%)",
        bubbleVignette:
          "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.05) 100%)",
        stampShadow: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
        cardFallbackBg: "rgba(255,255,255,0.95)",
        cardShadow: "0 10px 30px rgba(0,0,0,0.15)",
        cardBorderLight: "rgba(255,255,255,0.5)",
        cardBorderDark: "rgba(0,0,0,0.15)",
        circleBorderDarkMode: "rgba(255,255,255,0.2)",
        circleBorderBold: "#ddd",
        circleBorderThin: "#ccc",
        circleShadow: "0 4px 12px rgba(0,0,0,0.1)",
        signatureShadow: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
        fullOverlayGradient: `linear-gradient(to top,
    rgba(0,0,0,0.76) 0%,
    rgba(0,0,0,0.71) 8%,
    rgba(0,0,0,0.63) 17%,
    rgba(0,0,0,0.52) 27%,
    rgba(0,0,0,0.40) 38%,
    rgba(0,0,0,0.28) 50%,
    rgba(0,0,0,0.17) 63%,
    rgba(0,0,0,0.08) 76%,
    rgba(0,0,0,0.02) 88%,
    transparent 100%
  )`,
        textOnLightCard: "rgba(0,0,0,0.85)",
        cellBorder: "#222222",
        signatureBgSubtle: "rgba(255,255,255,0.9)",
        stampShadowSoft: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",

      },
      ambient: {
        staticBackground: {
          dark: `
      radial-gradient(800px 600px at 8% 12%, rgba(99,102,241,0.16) 0%, transparent 60%),
      radial-gradient(720px 540px at 92% 16%, rgba(236,72,153,0.14) 0%, transparent 60%),
      radial-gradient(700px 520px at 18% 86%, rgba(34,197,94,0.12) 0%, transparent 60%),
      radial-gradient(680px 520px at 84% 84%, rgba(59,130,246,0.12) 0%, transparent 60%),
      linear-gradient(180deg, #0f1417 0%, #0a0d0f 100%)
    `,

          light: `
      radial-gradient(800px 600px at 8% 12%, rgba(99,102,241,0.28) 0%, transparent 60%),
      radial-gradient(720px 540px at 92% 16%, rgba(236,72,153,0.24) 0%, transparent 60%),
      radial-gradient(700px 520px at 18% 86%, rgba(34,197,94,0.20) 0%, transparent 60%),
      radial-gradient(680px 520px at 84% 84%, rgba(59,130,246,0.20) 0%, transparent 60%),
      linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)
    `,
        },

        saturate: "saturate(1.05)",
      },
      carousel: {
        fadeMask:
          "linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, rgba(0,0,0,0))",
      },
      mediaUpload: {
        status: {
          uploading: {
            bg: isDark ? "rgba(18,129,153,0.15)" : "#e3f2fd",
            border: isDark ? "rgba(18,129,153,0.4)" : "#e3f2fd",
          },
          success: {
            bg: isDark ? "rgba(46,125,50,0.15)" : "#e8f5e9",
            border: isDark ? "rgba(46,125,50,0.4)" : "#e8f5e9",
          },
          error: {
            bg: isDark ? "rgba(211,47,47,0.15)" : "#ffebee",
            border: isDark ? "rgba(211,47,47,0.4)" : "#ffebee",
          },
        },
        cardShadow: isDark
          ? "0px 2px 8px rgba(0,0,0,0.3)"
          : "0px 2px 8px rgba(0,0,0,0.06)",
        cardHoverShadow: isDark
          ? "0px 4px 12px rgba(0,0,0,0.4)"
          : "0px 4px 12px rgba(0,0,0,0.1)",
        alertShadow: isDark
          ? "0px 2px 8px rgba(211,47,47,0.3)"
          : "0px 2px 8px rgba(211,47,47,0.15)",
        progressBarShadow: {
          success: "0px 2px 8px rgba(46,125,50,0.3)",
          default: "0px 2px 4px rgba(18,129,153,0.2)",
        },
        iconCircleBg: "rgba(255,255,255,0.2)",
      },
      secondary: {
        main: secondaryMain,
        // Gold is a light-ish color in both modes (unlike primary, which
        // flips dark<->light), so it always needs dark text - white would
        // fail contrast badly against a lemon yellow (1.63:1 light, 1.30:1
        // dark). Near-black passes comfortably instead (10.92:1 / 13.67:1).
        contrastText: "#14181f",
      },
      customBackground: {
        background: isDark ? "#0f1417" : "#ffffff",
        foreground: isDark ? "#ffffff" : "#000000",
      },
      background: {
        default: isDark ? "#0f1417" : "#f9f9f9",
        paper: isDark ? "#1a2226" : "#ffffff",
        white: "#ffffff",
        black: "#000000",
      },
      qr: {
        background: "#ffffff",
        foreground: "#000000",
      },
      input: {
        background: isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(255,255,255,0.9)",
      },
      infoBox: {
        background: isDark ? "rgba(25,118,210,0.12)" : "#e3f2fd",
        border: "#1976d2",
      },

      text: {
        primary: isDark ? "#e6edf0" : "#033649",
        secondary: isDark ? "#a0acb2" : "#555",
        white: "#ffffff",
        black: "#000000",
      },

      neutral: {
        50: "#fafafa",
        100: "#f4f4f5",
        200: "#e4e4e7",
        300: "#d4d4d8",
        400: "#a1a1aa",
        500: "#71717a",
        600: "#52525b",
        700: "#3f3f46",
        800: "#27272a",
        900: "#18181b",
        950: "#09090b",
        text: isDark ? "#d4d4d8" : "#52525b",
        textStrong: isDark ? "#f4f4f5" : "#27272a",
        border: isDark ? "#3f3f46" : "#e4e4e7",
        surface: isDark ? "#27272a" : "#f4f4f5",
      },

      success: {
        main: successMain,
        dark: "#00c853",
        contrastText: "#fff",
        icon: "#558b2f",
        text: "#33691e",
        border: "#2e7d32",
        hover: "#1b5e20",
        light: "#f1f8e9"


      },

      warning: {
        main: warningMain,
        dark: "#ff8f00",
        contrastText: "#000000",
      },
      info: {
        main: "#1976d2",
        contrastText: "#ffffff",
      },
      error: {
        main: errorMain,
        contrastText: "#ffffff",
      },
      custom: {
        shadow: {
          neumorphicLight1: `
      2px 2px 6px rgba(0, 0, 0, 0.15),
      -2px -2px 6px rgba(255, 255, 255, 0.5),
      inset 2px 2px 5px rgba(0, 0, 0, 0.2),
      inset -2px -2px 5px rgba(255, 255, 255, 0.7)
    `,
          neumorphicDark1: `
      2px 2px 6px rgba(0, 0, 0, 0.5),
      -2px -2px 6px rgba(255, 255, 255, 0.08),
      inset 2px 2px 5px rgba(0, 0, 0, 0.3),
      inset -2px -2px 5px rgba(255, 255, 255, 0.1)
    `,
          neumorphicLight: `
      2px 2px 6px rgba(0, 0, 0, 0.15),
      -2px -2px 6px rgba(255, 255, 255, 0.5),
      inset 2px 2px 5px rgba(0, 0, 0, 0.2),
      inset -2px -2px 5px rgba(255, 255, 255, 0.7)
    `,
          neumorphicDark: `
      2px 2px 6px rgba(0, 0, 0, 0.5),
      -2px -2px 6px rgba(255, 255, 255, 0.08),
      inset 2px 2px 5px rgba(0, 0, 0, 0.6),
      inset -2px -2px 5px rgba(255, 255, 255, 0.03)
    `,
        },
      },

      loader: {
        overlay: isDark
          ? "rgba(15,20,23,0.90)"
          : "rgba(240,245,255,0.6)",

        card: isDark
          ? "#1a2226"
          : "rgba(255,255,255,0.92)",

        title: isDark
          ? "#ffffff"
          : "rgba(10,20,50,0.9)",

        subtitle: isDark
          ? "rgba(255,255,255,0.65)"
          : "rgba(10,20,50,0.45)",

        skeleton: isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.07)",
      },
      divider: isDark
        ? "rgba(255,255,255,0.12)"
        : "rgba(0,0,0,0.12)",
      overlay: {
        cardImageOverlayGradient: isDark
          ? "linear-gradient(to top, rgba(10,10,10,0.78) 20%, rgba(0,0,0,0) 90%)"
          : "linear-gradient(to top, rgba(20,20,20,0.72) 20%, rgba(0,0,0,0) 90%)",

        fullscreenPreviewGradient:
          "linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.6), transparent)",
        imageGradient:
          "linear-gradient(to top, rgba(0,0,0,0.75) 20%, rgba(0,0,0,0) 90%)",
        black60: "rgba(0,0,0,0.6)",
        black80: "rgba(0,0,0,0.8)",
        black90: "rgba(0,0,0,0.9)",
        pageContent: isDark
          ? "rgba(0,0,0,0.55)"
          : "rgba(255,255,255,0.15)",
        backgroundColor: isDark
          ? "rgba(0, 0, 0, 0.55)"
          : "rgba(255, 255, 255, 0.15)",
        cardExtraHeavy: isDark
          ? "rgba(26,34,38,0.96)"
          : "rgba(255,255,255,0.96)",
        whiteGlass: isDark
          ? "rgba(255,255,255,0.18)"
          : "rgba(255,255,255,0.18)",

        whiteGlassBorder: isDark
          ? "rgba(255,255,255,0.40)"
          : "rgba(255,255,255,0.40)",
        cardOpaque: isDark
          ? "rgba(26,34,38,0.97)"
          : "rgba(255,255,255,0.97)",

        warningCardBorder: isDark
          ? "rgba(255,179,0,0.30)"
          : "rgba(255,179,0,0.30)",
        warningCard: isDark
          ? "rgba(255,179,0,0.15)"
          : "rgba(255,179,0,0.10)",

        infoCard: isDark
          ? "rgba(20,112,138,0.18)"
          : "rgba(20,112,138,0.08)",

        infoCardBorder: isDark
          ? "rgba(20,112,138,0.35)"
          : "rgba(20,112,138,0.2)",
        glassLight: isDark
          ? "rgba(255,255,255,0.16)"
          : "rgba(255,255,255,0.16)",
        modalOverlay: isDark
          ? "rgba(0,0,0,0.65)"
          : "rgba(0,0,0,0.65)",
        pageOverlay: isDark
          ? "rgba(0,0,0,0.72)"
          : "rgba(0,0,0,0.72)",
        card: isDark
          ? "rgba(26,34,38,0.85)"
          : "rgba(255,255,255,0.85)",
        cardTransparent: isDark
          ? "rgba(26,34,38,0.9)"
          : "rgba(255,255,255,0.9)",
        // Added because DigiPassRegistration uses this
        cardHeavy: isDark
          ? "rgba(26,34,38,0.95)"
          : "rgba(255,255,255,0.95)",

        scrim: "rgba(0,0,0,0.5)",

        scrimHover: "rgba(0,0,0,0.7)",

        chip: "rgba(255,255,255,0.8)",

        chipHover: "#ffffff",

        chipIcon: "#000000",
        darkGlass: "rgba(0,0,0,0.35)",
        whiteGlassLight: "rgba(255,255,255,0.15)",
        whiteGlassBorderLight: "rgba(255,255,255,0.3)",

        uploadPreview: isDark
          ? "rgba(255,255,255,0.08)"
          : "#ffffff",
      },

      shadow: {
        infoCard1: isDark
          ? "0 8px 20px rgba(20,112,138,0.3)"
          : "0 8px 20px rgba(20,112,138,0.22)",
        shadow3: isDark
          ? "0 4px 8px rgba(0, 0, 0, 0.5)"
          : "0 4px 8px rgba(0, 0, 0, 0.3)",
        shadow1: isDark
          ? "0 4px 20px rgba(0,0,0,0.35)"
          : "0 4px 20px rgba(0,0,0,0.15)",
        shadow2: isDark
          ? "0 16px 36px rgba(0,0,0,0.45)"
          : "0 16px 36px rgba(0,0,0,0.16)",

        toggleKnob: isDark
          ? "0 4px 8px rgba(0,0,0,0.5)"
          : "0 4px 8px rgba(0,0,0,0.3)",

        neumorphicToggle: isDark
          ? "2px 2px 6px rgba(0,0,0,0.5), -2px -2px 6px rgba(255,255,255,0.05), inset 2px 2px 5px rgba(0,0,0,0.3), inset -2px -2px 5px rgba(255,255,255,0.08)"
          : "2px 2px 6px rgba(0,0,0,0.15), -2px -2px 6px rgba(255,255,255,0.5), inset 2px 2px 5px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(255,255,255,0.7)",
        cardSubtle: isDark
          ? "0 4px 6px -1px rgba(0,0,0,0.4)"
          : "0 4px 6px -1px rgba(0,0,0,0.1)",
        wheelCard: isDark
          ? "0 2px 10px rgba(0,0,0,0.3)"
          : "0 2px 10px rgba(0,0,0,0.06)",
        preview: "0px 4px 8px rgba(0,0,0,0.2)",

        input: isDark
          ? "0px 4px 8px rgba(0,0,0,0.5)"
          : "0px 4px 8px rgba(0,0,0,0.2)",

        textHeavy: "0px 6px 12px rgba(0, 0, 0, 0.6)",
        trophy: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
        wheel: "0px 6px 15px rgba(0,0,0,0.6)",
        wheelPointer: "0px 6px 15px rgba(0,0,0,0.9)",
        successIcon: "0 8px 24px rgba(46,125,50,0.35)",
        insetSm: isDark
          ? "inset 0 0 6px rgba(0,0,0,0.20)"
          : "inset 0 0 6px rgba(0,0,0,0.08)",
        infoCard: isDark
          ? "0 8px 20px rgba(20,112,138,0.3)"
          : "0 8px 20px rgba(20,112,138,0.3)",
        dialogLarge: isDark
          ? "0 24px 60px rgba(0,0,0,0.55)"
          : "0 24px 60px rgba(0,0,0,0.22)",
        textGlowSm: isDark
          ? "0 0 10px rgba(255,255,255,0.6)"
          : "0 0 10px rgba(0,0,0,0.2)",

        textGlowMd: isDark
          ? "0 0 15px rgba(255,255,255,0.6)"
          : "0 0 15px rgba(0,0,0,0.2)",

        textGlowLg: isDark
          ? "0 0 20px rgba(255,255,255,0.6)"
          : "0 0 20px rgba(0,0,0,0.2)",
        goldTextGlow: isDark
          ? "0 0 20px rgba(255,215,0,0.9)"
          : "0 0 12px rgba(255,215,0,0.5)",
        neonTextGlow: isDark
          ? "0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(0,255,255,0.6)"
          : "0 0 8px rgba(0,0,0,0.15), 0 0 12px rgba(0,119,182,0.25)",
        lightTextGlow: isDark
          ? "0 0 15px rgba(255,255,255,0.8)"
          : "0 0 15px rgba(0,0,0,0.25)",

        card: isDark
          ? "0 8px 32px rgba(0,0,0,0.5)"
          : "0 8px 32px rgba(0,0,0,0.15)",
        dialog: isDark
          ? "0px 4px 12px rgba(0,0,0,0.5)"
          : "0px 4px 10px rgba(0,0,0,0.1)",

        elevated: isDark
          ? "0 20px 60px rgba(0,0,0,0.55)"
          : "0 20px 60px rgba(0,0,0,0.18)",

        paper: isDark
          ? "0 10px 34px rgba(0,0,0,0.45)"
          : "0 10px 34px rgba(0,0,0,0.18)",

        floatingButton: isDark
          ? "0 6px 16px rgba(0,0,0,0.35)"
          : "0 6px 16px rgba(0,0,0,0.15)",
        button: isDark
          ? "0 4px 20px rgba(0,0,0,0.35)"
          : "0 4px 20px rgba(0,0,0,0.18)",
        glow: isDark
          ? "0 0 30px rgba(0,0,0,0.6)"
          : "0 0 30px rgba(0,0,0,0.2)",
        bottomSheet: isDark
          ? "0 -4px 24px rgba(0,0,0,0.5)"
          : "0 -4px 24px rgba(0,0,0,0.18)",
        textGlow: "0 1px 6px rgba(0,0,0,0.7)",
      },
      gradients: {
        badge: isDark
          ? "linear-gradient(135deg, #0b4b57 0%, #4fc3d9 58%, #7be7f5 100%)"
          : "linear-gradient(135deg, #005b8c 0%, #0077b6 58%, #40c0d5 100%)",
        wheelEmpty: "conic-gradient(#666 0deg 360deg)",
        winnerDialog: isDark
          ? "linear-gradient(135deg,#667eea 0%,#764ba2 100%)"
          : "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
        errorHeader:
          "linear-gradient(135deg,#b71c1c 0%,#c62828 55%,#d32f2f 100%)",
        successHeader:
          "linear-gradient(135deg, #2e7d32 0%, #43a047 100%)",
        warningHeader:
          "linear-gradient(135deg, #e65100 0%, #ef6c00 55%, #f57c00 100%)",
        infoCard: isDark
          ? "linear-gradient(135deg, #0a2c40 0%, #0f5266 100%)"
          : "linear-gradient(135deg, #0f3d57 0%, #14708a 100%)",
      },
      votecast: {
        cardBgDark: "rgba(26,34,38,0.65)",
        cardBgLight: "rgba(255,255,255,0.65)",
        cardBorderDark: "rgba(255,255,255,0.12)",
        cardBorderLight: "rgba(255,255,255,0.35)",
      },
      landing: {
        subtitleText: isDark
          ? "rgba(255,255,255,0.75)"
          : "rgba(255,255,255,0.62)",

        dashboardButton: {
          background:
            "linear-gradient(180deg, rgba(27,77,126,0.98) 0%, rgba(18,49,89,0.98) 100%)",
          hoverBackground:
            "linear-gradient(180deg, rgba(35,91,145,1) 0%, rgba(24,63,111,1) 100%)",
          border: isDark ? "rgba(84,195,255,1)" : "rgba(63,169,255,0.95)",
          hoverBorder: isDark ? "rgba(120,220,255,1)" : "rgba(84,195,255,1)",
          boxShadow: isDark
            ? "0 0 0 1px rgba(255,255,255,0.08), 0 10px 26px rgba(0,120,255,0.35)"
            : "0 0 0 1px rgba(0,0,0,0.35), 0 10px 26px rgba(0,120,255,0.22)",
        },

        badgeButton: {
          background:
            "linear-gradient(180deg, rgba(36,133,90,0.98) 0%, rgba(28,104,72,0.98) 100%)",
          hoverBackground:
            "linear-gradient(180deg, rgba(42,155,105,1) 0%, rgba(33,124,85,1) 100%)",
          border: isDark ? "rgba(112,255,182,1)" : "rgba(86,224,160,0.85)",
          hoverBorder: isDark ? "rgba(140,255,200,1)" : "rgba(112,255,182,1)",
          boxShadow: isDark
            ? "0 0 0 1px rgba(255,255,255,0.08), 0 10px 26px rgba(23,190,114,0.35)"
            : "0 0 0 1px rgba(0,0,0,0.35), 0 10px 26px rgba(23,190,114,0.22)",
        },

        learnMoreButton: {
          background:
            "linear-gradient(180deg, rgba(33,33,38,0.98) 0%, rgba(27,27,31,0.98) 100%)",
          hoverBackground:
            "linear-gradient(180deg, rgba(42,42,48,1) 0%, rgba(34,34,39,1) 100%)",
          border: isDark ? "rgba(255,255,255,1)" : "rgba(232,232,232,0.88)",
          hoverBorder: isDark ? "rgba(255,255,255,1)" : "rgba(232,232,232,1)",
          boxShadow: isDark
            ? "0 0 0 1px rgba(255,255,255,0.08), 0 10px 26px rgba(0,0,0,0.55)"
            : "0 0 0 1px rgba(0,0,0,0.35), 0 10px 26px rgba(0,0,0,0.38)",
        },
      },
      tapmatch: {
        goldTextGlow: "0 0 20px rgba(255,215,0,0.9), 0 0 40px rgba(255,215,0,0.7)",
        winGradient: "linear-gradient(135deg, #4CAF50CC, #388E3CCC)",
        loseGradient: "linear-gradient(135deg, #F44336CC, #E53935CC)",
        cardFrontGradient: "linear-gradient(145deg, #1976d2, #42a5f5)",
        cardShadow: "0 2px 8px rgba(0,0,0,0.3)",
        matchedOverlay: "rgba(0,255,0,0.3)",
        checkIconColor: "rgba(255,255,255,0.9)",
        matchedCheckGlow: "0 0 10px rgba(0,128,0,0.8)",
      },
      quiznest: {
        glassBg: "rgba(10,10,20,0.85)",
        dialogShadow: "0 8px 40px rgba(0,0,0,0.6)",
        labelText: "rgba(255,255,255,0.6)",
        inputBg: "rgba(255,255,255,0.1)",
        inputBorder: "rgba(255,255,255,0.25)",
        accent: "#00e5ff",
        accentBg: "rgba(0,229,255,0.08)",
        accentBorder: "rgba(0,229,255,0.2)",
        countdownOverlay: "rgba(0,0,0,0.65)",
        countdownGlow: "0 0 15px rgba(255,215,0,0.8), 0 0 30px rgba(255,165,0,0.6)",
        successGradient: "linear-gradient(135deg, rgba(76,175,80,0.9), rgba(56,142,60,0.9))",
        answerDefaultBg: "rgba(255,255,255,0.08)",
        answerDefaultBorder: "rgba(255,255,255,0.18)",
        lightGlassBg: "rgba(255,255,255,0.6)",
      },
      stageq: {
        voteBadgeBg: "#d32f2f",
        voteBadgeShadow: "0 0 8px rgba(0,0,0,0.3)",
      },
      surveyguru: {
        // Success/thank-you screen
        successCardShadow: "0 10px 30px rgba(2,6,23,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
        ambientBlobIndigo: "radial-gradient(closest-side, rgba(99,102,241,.35), transparent)",
        ambientBlobGreen: "radial-gradient(closest-side, rgba(16,185,129,.35), transparent)",
        successBadgeGradient: "linear-gradient(135deg, #34d399 0%, #10b981 60%, #059669 100%)",
        successBadgeShadow: "0 12px 28px rgba(16,185,129,.35), inset 0 0 0 6px rgba(255,255,255,.35)",
        successBadgeRing: "conic-gradient(from 180deg at 50% 50%, rgba(16,185,129,.18), transparent 40% 60%, rgba(16,185,129,.18))",
        titleGradient: "linear-gradient(90deg, #0f172a 0%, #2563eb 45%, #0ea5e9 100%)",

        // Anonymous-mode banner/notice
        anonymousBorder: "rgba(245, 158, 11, 0.35)",
        anonymousBgDark: "linear-gradient(180deg, rgba(69,56,10,0.4) 0%, rgba(26,34,38,0.6) 100%)",
        anonymousBgLight: "linear-gradient(180deg, rgba(255,251,235,0.92) 0%, rgba(255,255,255,0.96) 100%)",
        anonymousNoticeBg: "rgba(245, 158, 11, 0.08)",
        anonymousNoticeBorder: "rgba(245, 158, 11, 0.28)",
        anonymousAccent: "#b45309",
        anonymousIconColor: "#92400e",
        anonymousTitleColor: "#78350f",

        // Desktop sidebar (question list)
        sidebarActiveColor: "#2563eb",
        sidebarActiveBg: "rgba(37,99,235,0.07)",
        sidebarProgressTrack: "rgba(37,99,235,0.12)",

        // Right-panel gradient overlay (mobile + desktop use same value)
        panelOverlay: "radial-gradient(800px 600px at 90% 10%, rgba(255,255,255,0.18) 0%, transparent 60%)",
      },

      crosszero: {
        oButtonHoverBorder: "#e53935",
        oButtonHoverBg: "rgba(255,107,107,0.06)",
        xButtonHoverBorder: "#00b8d4",
        xButtonHoverBg: "rgba(0,229,255,0.06)",
        markXGlowShadow: "0 0 24px #00e5ff",
        markOGlowShadow: "0 0 24px #ff6b6b",
        markXFallbackGlow: "0 0 16px rgba(0,229,255,0.75)",
        markOFallbackGlow: "0 0 16px rgba(255,107,107,0.75)",
        answerCorrectBg: "rgba(76,175,80,0.35)",
        answerCorrectBorder: "#81c784",

        answerWrongBg: "rgba(244,67,54,0.35)",
        answerWrongBorder: "#e57373",
        resultCard: isDark
          ? "rgba(255,255,255,0.67)"
          : "rgba(255,255,255,0.92)",
        answerDefaultBg: isDark
          ? "rgba(0,0,0,0.04)"
          : "rgba(255,255,255,0.08)",

        answerDefaultBorder: isDark
          ? "rgba(255,255,255,0.18)"
          : "rgba(0,0,0,0.18)",
        infoCard: isDark
          ? "rgba(0,229,255,0.08)"
          : "rgba(0,119,182,0.08)",

        infoCardBorder: isDark
          ? "rgba(0,229,255,0.2)"
          : "rgba(0,119,182,0.2)",
        // Player colors
        x: isDark ? "#4fc3d9" : "#0077b6",
        o: "#ffcc00",
        completed: "#FF6B35",

        // Glows
        xGlow: "rgba(0,229,255,0.5)",
        oGlow: "rgba(255,107,107,0.5)",

        // Game result colors
        win: "#4CAF50",
        lose: "#F44336",
        draw: "#FFC107",

        // Cell styles
        cellIdle: "rgba(255,255,255,0.03)",
        cellHover: "rgba(255,255,255,0.08)",
        cellBorder: "rgba(255,255,255,0.10)",

        // Instructions / waiting
        waitingText: isDark
          ? "rgba(255,255,255,0.45)"
          : "rgba(0,0,0,0.45)",

        stepDot: isDark
          ? "rgba(255,255,255,0.15)"
          : "rgba(0,0,0,0.15)",
        instructionText: isDark
          ? "rgba(255,255,255,0.75)"
          : "rgba(0,0,0,0.75)",
        instructionBorder: isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.08)",
        resultText: "#000000",
        xTextGlow: "0 0 20px #00e5ff",
        oTextGlow: "0 0 20px #ff6b6b",
        timerHigh: primaryMain,
        timerMedium: warningMain,
        timerLow: errorMain,

        // Result gradients
        waitingPulseGlow: "rgba(255, 255, 255, 0.25)",

        winGradient: `linear-gradient(135deg, rgba(76,175,80,0.8), rgba(56,142,60,0.8))`,
        loseGradient: `linear-gradient(135deg, rgba(244,67,54,0.8), rgba(211,47,47,0.8))`,
        drawGradient: `linear-gradient(135deg, rgba(255,193,7,0.8), rgba(255,160,0,0.8))`,

        difficulty: {
          easy: {
            color: "#00e676",
            glow: "rgba(0,230,118,0.4)",
          },
          medium: {
            color: "#ED6C02",
            glow: "rgba(255,179,0,0.4)",
          },
          hard: {
            color: "#ff4444",
            glow: "rgba(255,68,68,0.4)",
          },
        },
        // === Host/Session/Results screens ===
        markX: "#00e5ff",
        markO: "#ff6b6b",
        markXGlowShadow: "0 0 24px #00e5ff",
        markOGlowShadow: "0 0 24px #ff6b6b",

        boardCellBg: "rgba(255,255,255,0.04)",
        boardCellBgWinning: "rgba(255,255,255,0.1)",
        boardCellBorder: "1.5px solid rgba(255,255,255,0.12)",

        hostCardGradient: "linear-gradient(135deg, #0f172a, #1e293b)",
        hostCardShadow: "0 16px 48px rgba(0,0,0,0.35)",
        liveChipShadow: "0 0 10px 2px rgba(76,175,80,0.5)",

        pendingCardGradient: "linear-gradient(135deg, #1e3c72, #2a5298)",
        playerSlotFilled: "#4CAF50",
        playerSlotEmpty: "#ffffff11",
        playerSlotBorderFilled: "#4caf50",
        playerSlotBorderEmpty: "#ffffff44",

        previousSessionGradient: "linear-gradient(to bottom, #f7f7f7, #ffffff)",
        previousSessionShadow: "0px 6px 20px rgba(0,0,0,0.1)",
        winnerBannerGradient: "linear-gradient(to right, #4CAF50, #81C784)",
        tieBannerGradient: "linear-gradient(to right, #9E9E9E, #BDBDBD)",
        winnerCellGradient: "linear-gradient(135deg, #A5D6A7, #C8E6C9)",
        loserCellBg: "#f5f5f5",
        vsBadgeBg: "#fff",
        vsBadgeBorder: "2px solid #ccc",

        resultCardO: { color: "#c0392b", bg: "rgba(255,107,107,0.1)", symbolColor: "#ff6b6b" },
        resultCardX: { color: "#0096c7", bg: "rgba(0,180,216,0.1)", symbolColor: "#00e5ff" },
        resultCardDraw: { color: "#777", bg: "rgba(0,0,0,0.05)" },

        pvpResultMapX: { symbolColor: "#00e5ff", bg: "linear-gradient(to right, #00b4d8, #0077b6)" },
        pvpResultMapO: { symbolColor: "#ff6b6b", bg: "linear-gradient(to right, #ff6b6b, #c0392b)" },
        pvpResultMapDraw: { bg: "linear-gradient(to right, #9E9E9E, #BDBDBD)" },
        pvpWinnerBgO: "rgba(255,107,107,0.08)",
        pvpWinnerBgX: "rgba(0,180,216,0.08)",
        pvpVsBadgeBorder: "2px solid #eee",
        pvpStatsBorderTop: "1px solid #f0f0f0",

        sessionTextPrimary: "rgba(255,255,255,0.65)",
        sessionTextSecondary: "rgba(255,255,255,0.55)",
        sessionTextTertiary: "rgba(255,255,255,0.45)",
        playerCardBg: "rgba(255,255,255,0.06)",
        pendingTextShadow: "0 0 10px rgba(255,255,255,0.3)",
        pendingSecondaryText: "#e0f2f1",

        gameCardBorder: "1px solid #eee",

        // === Host Dashboard: active session card ===
        activeSessionGradient: "linear-gradient(135deg, #e1f5fe, #ffffff)",
        activeSessionShadow: "0 12px 35px rgba(0,0,0,0.15)",
        teamBoxBorder: "2px solid #90caf9",
        teamBoxBg: "#e3f2fd",

        // === Team-mode player row card (session lists) ===
        teamPlayerCardBg: "#ffffff",
        teamPlayerCardShadow: "0 1px 3px rgba(0,0,0,0.05)",
        teamCardBg: "#fafafa",

        // === VS badge (team-mode variant, session lists) ===
        vsBadgeShadow: "0 2px 6px rgba(0,0,0,0.1)",

        modeChipPvpSingle: { bg: "rgba(0,200,150,0.1)", color: "#00a878" },
        modeChipPvpDual: { bg: "rgba(123,47,247,0.1)", color: "#7b2ff7" },
        modeChipSolo: { bg: "rgba(0,180,216,0.1)", color: "#0077b6" },

      },
      sharedUI: {
        cardShadow: "0 6px 18px rgba(15,23,42,0.05)",
        cardHoverShadow: "0 10px 24px rgba(15,23,42,0.1)",
        scrollbarThumb: isDark ? "#666" : "#bbb",
        scrollbarThumbHover: isDark ? "#888" : "#999",
        sectionDivider: isDark ? "rgba(255,255,255,0.12)" : "#eee",

      },
      // Shared HUD-style overlay pill for transient mode-switch feedback
      // (theme toggle, language toggle) — macOS-style frosted glass, swaps
      // light/dark for real rather than staying dark in both modes.
      switchOverlay: {
        backdropBg: isDark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.15)",
        chipBg: isDark ? "rgba(28,33,41,0.72)" : "rgba(255,255,255,0.72)",
        chipBorder: isDark ? "rgba(255,255,255,0.14)" : "rgba(20,24,31,0.08)",
        chipColor: isDark ? "#f2f5f7" : "#14181f",
        chipShadow: isDark
          ? "0 8px 30px rgba(0,0,0,0.6)"
          : "0 8px 30px rgba(20,24,31,0.18)",
        iconLight: "#ED6C02",
        iconDark: "#4fc3d9",
        iconAccent: primaryMain,
      },
      chip: {
        inactiveText: isDark ? "#d1d5db" : "#374151",
        inactiveBorder: isDark ? "rgba(255,255,255,0.16)" : "#e5e7eb",
        fadedSlice: isDark ? "#555555" : "#9e9e9e",
      },

      logs: {
        hardDeleteBg: "#4a0404",
        hardDeleteColor: "#ffffff",
      },

      home: {
        heroGradient:
          "linear-gradient(135deg, #1b3a7a 0%, #3843b2 45%, #6a2ea0 100%)",
        heroShadow: "0 18px 40px rgba(27,58,122,0.25)",
        heroOverlayBefore:
          "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 45%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.14), transparent 40%)",
        heroOverlayAfter:
          "radial-gradient(circle, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%)",
        heroTextShadow: "0 2px 12px rgba(0,0,0,0.28)",
        heroTextSecondary: "rgba(255,255,255,0.9)",
        heroTextTertiary: "rgba(255,255,255,0.85)",
        donutColors: ["#1f77b4", "#ff7f0e", "#2ca02c", "#9467bd", "#8c564b"],
        donutEmpty: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
        moduleCardShadow: isDark
          ? "0 6px 12px rgba(0,0,0,0.4)"
          : "0 6px 12px rgba(0,0,0,0.1)",
      },

      users: {
        staffDeskBg: isDark ? "#01579b" : "#4fc3f7",
        staffDoorBg: isDark ? "#4a148c" : "#e1bee7",
        accordionShadow: isDark
          ? "0 6px 18px rgba(0,0,0,0.4)"
          : "0 6px 18px rgba(0,0,0,0.06)",
        accordionShadowExpanded: isDark
          ? "0 10px 26px rgba(0,0,0,0.5)"
          : "0 10px 26px rgba(0,0,0,0.10)",
        accordionSummaryBg: isDark
          ? "rgba(0, 119, 182, 0.18)"
          : "rgba(0, 119, 182, 0.06)",

      },

      trash: {
        filterBadgeBg: "rgba(255,255,255,0.2)",
        moduleChipAvatarBg: isDark
          ? "rgba(0, 119, 182, 0.25)"
          : "rgba(0, 119, 182, 0.12)",
        moduleChipIconColor: isDark ? "#d4d4d8" : "#52525b",
      },
      navbar: {
        appBarBg: isDark ? "rgba(26,34,38,0.6)" : "rgba(255,255,255,0.3)",
        avatarButtonHoverShadow: isDark
          ? "3px 3px 8px rgba(0,0,0,0.6), -3px -3px 8px rgba(255,255,255,0.1), inset 2px 2px 5px rgba(0,0,0,0.3), inset -2px -2px 5px rgba(255,255,255,0.1)"
          : "3px 3px 8px rgba(0,0,0,0.2), -3px -3px 8px rgba(255,255,255,0.6), inset 2px 2px 5px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(255,255,255,0.7)",
        menuPaperShadow: isDark
          ? "2px 2px 6px rgba(0,0,0,0.4), -2px -2px 6px rgba(255,255,255,0.05)"
          : "2px 2px 6px rgba(0,0,0,0.1), -2px -2px 6px rgba(255,255,255,0.4)",
      },
      payments: {
        cardShadow: "0 4px 14px rgba(15,23,42,0.05)",
        dialogPaperShadow: "0 28px 80px rgba(15,23,42,0.22)",
        sectionCardShadow: "0 12px 32px rgba(15,23,42,0.06)",
        heroCircleOverlay: "rgba(255,255,255,0.32)",

        statusTone: {
          paid: {
            bg: "linear-gradient(135deg, rgba(56,142,60,0.16), rgba(76,175,80,0.08))",
            border: "rgba(56,142,60,0.22)",
          },
          pending: {
            bg: "linear-gradient(135deg, rgba(237,108,2,0.16), rgba(255,183,77,0.08))",
            border: "rgba(237,108,2,0.22)",
          },
          failed: {
            bg: "linear-gradient(135deg, rgba(211,47,47,0.16), rgba(239,83,80,0.08))",
            border: "rgba(211,47,47,0.22)",
          },
          default: {
            bg: "linear-gradient(135deg, rgba(100,116,139,0.16), rgba(148,163,184,0.08))",
            border: "rgba(100,116,139,0.22)",
          },
        },
      },
      insights: {
        summaryCard2: "#0284c7",
        summaryCard3: "#06b6d4",
        summaryCard4: "#7c3aed",
        summaryCard5: "#0ea5e9",
        badgeNoPrint: "#ef4444",
        badgeOnePrint: "#f59e0b",
        badgeMultiPrint: "#10b981",
        heatmapEmptyCell: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6",
        digipassSummaryParticipants: "#0077b6",        // reuse via reference, or leave using theme.palette.primary.main directly in code
        digipassSummaryCompletions: "#f59e0b",
        digipassSummaryAvgActivities: "#8b5cf6",
        digipassSummaryScanRate: "#10b981",
        topQuestionAccent: "#6366f1",
        topQuestionAccentBg: isDark ? "rgba(99,102,241,0.08)" : "#f8faff",
      },

      registrations: {
        whatsappGreen: "#25D366",
        cardShadow: isDark
          ? "0 6px 18px rgba(0,0,0,0.6)"
          : "0 6px 18px rgba(0,0,0,0.12)",
        cardHoverShadow: isDark
          ? "0 12px 28px rgba(0,0,0,0.75)"
          : "0 12px 28px rgba(0,0,0,0.25)",
        cardHeaderBgDark: "rgba(255,255,255,0.03)",
        regCardShadow: isDark
          ? "0 6px 18px rgba(0,0,0,0.5)"
          : "0 6px 18px rgba(0,0,0,0.12)",
        regCardHoverShadow: isDark
          ? "0 12px 28px rgba(0,0,0,0.6)"
          : "0 12px 28px rgba(0,0,0,0.25)",
        regCardHeaderGradientDark: "linear-gradient(to right, rgba(255,255,255,0.04), rgba(255,255,255,0.08))",
        regCardHeaderGradientLight: "linear-gradient(to right, #f5f5f5, #fafafa)",
        regTokenBadgeBgDark: "rgba(255,255,255,0.06)",
        regTokenBadgeBgLight: "rgba(0,0,0,0.04)",
        regCardActionsBgLight: "rgba(0,0,0,0.02)",
      },

      whatsappDashboard: {
        logsCardColor: isDark ? "#f4f4f5" : primaryMain,
      },
    },



    typography: {
      fontFamily: "'Poppins', sans-serif",
      h1: {
        fontFamily: "'Comfortaa', cursive",
        fontSize: "3rem",
        fontWeight: "700",
      },
      h2: {
        fontFamily: "'Comfortaa', cursive",
        fontSize: "2rem",
        fontWeight: "700",
      },
      h3: {
        fontFamily: "'Comfortaa', cursive",
        fontSize: "1.75rem",
        fontWeight: "700",
      },
      h4: {
        fontFamily: "'Comfortaa', cursive",
        fontSize: "1.5rem",
        fontWeight: "700",
      },
      h5: {
        fontFamily: "'Comfortaa', cursive",
        fontSize: "1.3rem",
        fontWeight: "700",
      },
      h6: { fontFamily: "'Comfortaa', cursive", fontSize: "1.25rem" },
      body1: { fontSize: "1.075rem", fontFamily: "'Poppins', sans-serif" },
      body2: { fontSize: "0.95rem", fontFamily: "'Poppins', sans-serif" },
      subtitle1: { fontSize: "0.9rem", fontWeight: "600" },
      subtitle2: { fontSize: "0.8rem", fontWeight: "500" },
      button: { textTransform: "uppercase", fontWeight: "bold" },
    },

    shape: { borderRadius: 8 },

    components: {
      // === CssBaseline body background ===
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? "#0f1417" : "#f9f9f9",
            transition: "background-color 0.3s ease, color 0.3s ease",
          },
        },
      },

      // === Buttons ===
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "999px",
            fontSize: "1rem",
            padding: "10px 20px",
            fontWeight: 600,
            textTransform: "none",
            transition: "all 0.3s ease",
          },

          containedPrimary: ({ theme }) => ({
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            boxShadow: isDark
              ? "0px 10px 32px rgba(0,0,0,0.5)"
              : "0px 10px 32px rgba(0,0,0,0.1)",
            "&:hover": {
              transform: "scale(1.02)",
              boxShadow: isDark
                ? "0 6px 24px rgba(0,0,0,0.6)"
                : "0 6px 24px rgba(0,0,0,0.3)",
            },
          }),
          containedSecondary: ({ theme }) => ({
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
            boxShadow: isDark
              ? "0px 10px 32px rgba(0,0,0,0.5)"
              : "0px 10px 32px rgba(0,0,0,0.1)",
            "&:hover": {
              transform: "scale(1.02)",
              boxShadow: isDark
                ? "0 6px 24px rgba(0,0,0,0.6)"
                : "0 6px 24px rgba(0,0,0,0.3)",
            },
          }),
          // containedError / containedInfo removed —
          // MUI's built-in error/info palette already themes correctly per mode,
          // these hardcoded overrides just duplicated the defaults.

          outlinedPrimary: ({ theme }) => ({
            color: theme.palette.primary.main,
            borderColor: theme.palette.primary.main,
            "&:hover": {
              backgroundColor: isDark
                ? "rgba(45, 212, 191, 0.14)"
                : "rgba(15, 118, 110, 0.08)",
              transform: "scale(1.03)",
            },
          }),
          outlinedSecondary: ({ theme }) => ({
            color: theme.palette.secondary.main,
            borderColor: theme.palette.secondary.main,
            "&:hover": {
              backgroundColor: isDark
                ? "rgba(255, 225, 77, 0.14)"
                : "rgba(245, 197, 24, 0.08)",
              transform: "scale(1.03)",
            },
          }),
          // outlinedError / outlinedInfo removed — same reason as above.
        },
      },

      // === Paper Variants ===
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
          }),
        },
        variants: [
          {
            props: { variant: "frosted" },
            style: ({ theme }) => ({
              p: { xs: 3, sm: 4 },
              padding: "2rem",
              maxWidth: 800,
              width: "100%",
              textAlign: "center",
              backdropFilter: "blur(10px)",
              backgroundColor: isDark
                ? "rgba(26,34,38,0.6)"
                : "rgba(255,255,255,0.6)",
              borderRadius: 16,
              mt: { xs: 10, sm: "15vh" },
              mx: "auto",
              boxShadow: isDark
                ? "0 8px 32px rgba(0,0,0,0.5)"
                : "0 8px 32px rgba(0,0,0,0.2)",
            }),
          },
        ],
      },

      // === Inputs Direction & Alignment ===
      MuiInputBase: {
        styleOverrides: {
          input: {
            userSelect: "text",
            WebkitUserSelect: "text",
            unicodeBidi: "plaintext",
            "&[dir='rtl']": {
              direction: "rtl !important",
              textAlign: "right !important",
            },
            "&[dir='ltr']": {
              direction: "ltr !important",
              textAlign: "left !important",
            },
            "&[dir='auto']": {
              textAlign: "start !important",
            },
          },
        },
      },

      // === Floating Label ===
      MuiInputLabel: {
        styleOverrides: {
          root: {
            "&[dir='rtl'], [dir='rtl'] &": {
              right: 30,
              left: "auto",
              textAlign: "right",
              transformOrigin: "top right",
            },
            "&[dir='ltr'], [dir='ltr'] &": {
              right: "auto",
              textAlign: "left",
              transformOrigin: "top left",
            },
          },
        },
      },

      // === Outlined Input ===
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.input.background,
            borderRadius: "30px",
            overflow: "hidden",

            "&&.MuiOutlinedInput-multiline": {
              borderRadius: "16px",
            },

            "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active": {
              WebkitBoxShadow: `0 0 0 100px ${theme.palette.input.background} inset`,
              WebkitTextFillColor: theme.palette.text.primary,
              caretColor: theme.palette.text.primary,
              transition: "background-color 5000s ease-in-out 0s",
            },

            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.primary.main,
              borderRadius: "inherit",
            },

            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "#5eead4" : "#0b5c56",
            },

            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "#5eead4" : "#0b5c56",
            },
          }),
        },
      },

      // === Select Fields ===
      MuiSelect: {
        styleOverrides: {
          root: {
            backgroundColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(255,255,255,0.8)",
            borderRadius: "30px",
            overflow: "hidden",
            "&:focus": {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.9)",
            },
          },
          icon: ({ theme }) => ({ color: theme.palette.primary.main, right: 16 }),
        },
      },
    },
  });
};
export const resolveModuleColor = (color, mode) => {
  if (!color) return undefined;
  if (typeof color === "string") return color; // backward-compat fallback
  return color[mode] || color.light;
};

// For decorative tile/icon accents that don't carry module identity or data
// meaning: in light mode falls back to theme.palette.primary.main (no "light"
// key here — DashboardCard's resolveModuleColor(...) || primary.main fallback
// picks it up), since saturated color isn't the problem there. In dark mode
// it resolves to a calm neutral (palette.neutral.textStrong) to avoid the
// halation/glow saturated accents get against a near-black background.
export const NEUTRAL_ACCENT = { dark: "#f4f4f5" };

export const REPORT_COLORS = {
  brandGray: "#8c8c8c",
  primary: "#0077b6",
  white: "#ffffff",
  textMain: "#1f2937",
  textSecondary: "#6b7280",
  border: "#e6e6e6",
  bgLight: "#f7faff",
  highlightIndigo: "#6366f2",
  cardBorder: "#e0e0e0",
  labelGray: "#757575",
  progressTrack: "#ebebeb",
  registeredVoters: "#049dcd",
  badgeNoPrint: "#ef4444",
  badgeOnePrint: "#f59e0b",
  badgeMultiPrint: "#10b981",
  digipassAvgActivities: "#8b5cf6",
  summaryCard2: "#0284c7",
  summaryCard3: "#06b6d4",
  summaryCard4: "#7c3aed",
  summaryCard5: "#0ea5e9",
};
export const SURVEY_PALETTES = [
  {
    base: "#a7d8f0",
    action: "#1e3a8a",
    gradient: "linear-gradient(135deg, #a7d8f0 0%, #7dd3fc 50%, #38bdf8 100%)",
  },
  {
    base: "#c7f9cc",
    action: "#166534",
    gradient: "linear-gradient(135deg, #c7f9cc 0%, #86efac 50%, #4ade80 100%)",
  },
  {
    base: "#fde68a",
    action: "#b45309",
    gradient: "linear-gradient(135deg, #fde68a 0%, #fcd34d 50%, #f59e0b 100%)",
  },
  {
    base: "#e9d5ff",
    action: "#6b21a8",
    gradient: "linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 50%, #c084fc 100%)",
  },
  {
    base: "#c8e6e0",
    action: "#0f766e",
    gradient: "linear-gradient(135deg, #c8e6e0 0%, #7dd3fc 50%, #06b6d4 100%)",
  },
];
export const VOTECAST_CHART_COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1",
  "#a4de6c", "#d0ed57", "#9e9e9e", "#ba68c8", "#4dd0e1", "#f06292",
];
export const CARD_COLOR_SWATCHES = [
  "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5",
  "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50",
];

export const TEXT_COLOR_SWATCHES = [
  "#000000", "#ffffff", "#f44336", "#e91e63", "#9c27b0", "#673ab7",
  "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50",
  "#ffeb3b", "#ff9800",
];
export const WALL_CONFIG_DEFAULTS = {
  cardBackgroundColor: "#ffffff",
  mediaType2TextColor: "#000000",
  mediaType2SignatureColor: "#000000",
};


export const VOTECAST_NPS_GROUP_COLORS = {
  detractors: "#ef5350",
  passives: "#ffc107",
  promoters: "#66bb6a",
};
export default getTheme("light", "ltr");