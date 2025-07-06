"use client";

import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import LanguageSelector from "./LanguageSelector";
import { useGlobalConfig } from "@/contexts/GlobalConfigContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { globalConfig } = useGlobalConfig(); 
  const [anchorEl, setAnchorEl] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const openLogoutConfirm = () => {
    handleClose();
    setConfirmLogout(true);
  };

  return (
    <Box sx={{ position: "relative" }}>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          boxShadow: "none",
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          height: "64px",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ cursor: "pointer", width: { xs: 180, sm: "auto" } }}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
                color="text.primary"
                noWrap
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                {globalConfig?.appName || "EventPass Suite"} 
              </Typography>
            </Stack>
          </Link>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {!user ? (
              <Link href="/auth/login">
                <Button
                  color="primary"
                  startIcon={<LoginRoundedIcon />}
                  sx={{ textTransform: "none" }}
                >
                  Sign In
                </Button>
              </Link>
            ) : (
              <>
                <IconButton onClick={handleOpen} sx={{ p: 0 }}>
                  <Avatar sx={{ bgcolor: "white", color: "#033649" }}>
                    {user.name
                      ?.split(" ")
                      .map((n) => n[0]?.toUpperCase())
                      .slice(0, 2)
                      .join("")}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  PaperProps={{ elevation: 2 }}
                >
                  <MenuItem disabled>
                    Signed in as <strong>&nbsp;{user.name}</strong>
                  </MenuItem>
                  <MenuItem onClick={openLogoutConfirm}>Logout</MenuItem>
                </Menu>
              </>
            )}
            <LanguageSelector />
          </Box>
        </Toolbar>
      </AppBar>
      
      <ConfirmationDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={logout}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmButtonText="Logout"
      />
    </Box>
  );
}
