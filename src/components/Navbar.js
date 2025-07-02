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
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import Image from "next/image";
import ConfirmationDialog from "@/components/ConfirmationDialog";

export default function Navbar() {
  const { user, logout } = useAuth();

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
              spacing={0.5}
              sx={{
                cursor: "pointer",
                width: { xs: 180, sm: "auto" },
              }}
            >
              <Box
                sx={{
                  width: { xs: 35, sm: 40 },
                  height: "auto",
                }}
              >
                <Image
                  src="/WW.png"
                  alt="WhiteWall Logo"
                  width={100}
                  height={30}
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                  }}
                />
              </Box>
            </Stack>
          </Link>

          <Box>
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
          </Box>
        </Toolbar>
      </AppBar>

      {/* Confirmation Modal */}
      <ConfirmationDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={logout}
        title="Confirm Logout"
        message="Are you sure you want to log out of your VoteCast account?"
        confirmButtonText="Logout"
      />
    </Box>
  );
}
