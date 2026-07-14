"use client";

import { IconButton, Tooltip } from "@mui/material";
import { useColorMode } from "@/contexts/ThemeContext";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

export default function FloatingColorModeToggle() {
    const { mode, toggleColorMode } = useColorMode();

    return (
        <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton
                onClick={toggleColorMode}
                sx={{
                    position: "fixed",
                    top: { xs: 16, sm: 20 },
                    // On mobile, public-page LanguageSelectors tend to float
                    // at the same top-right corner - sit on the opposite
                    // side there instead of overlapping it.
                    left: { xs: 16, sm: "auto" },
                    right: { xs: "auto", sm: 100 },
                    zIndex: 9999,
                    bgcolor: "background.paper",
                    color: "text.primary",
                    boxShadow: 3,
                    "&:hover": { bgcolor: "action.hover" },
                }}
            >
                {mode === "dark" ? (
                    <LightModeIcon fontSize="small" sx={{ color: "secondary.main" }} />
                ) : (
                    <DarkModeIcon fontSize="small" sx={{ color: "primary.main" }} />
                )}
            </IconButton>
        </Tooltip>
    );
}