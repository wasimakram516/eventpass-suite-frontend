"use client";

import { Drawer, List, ListItem, Tooltip, IconButton } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ViewModule, Settings } from "@mui/icons-material";

const navItems = [
  { label: "Home", icon: Home, path: "/cms" },
  { label: "Modules", icon: ViewModule, path: "/cms/modules" },
  { label: "Settings", icon: Settings, path: "/cms/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 64,
        flexShrink: 0,
        top: "64px",
        height: "calc(100% - 64px)",
        position: "fixed",
        [`& .MuiDrawer-paper`]: {
          width: 64,
          boxSizing: "border-box",
          bgcolor: "background.paper",
          display: "flex",
          alignItems: "center",
          pt: 2,
          top: "64px",
          height: "calc(100% - 64px)",
          position: "fixed",
        },
      }}
    >
      <List>
        {navItems.map((item) => {
          const isActive =
            item.path === "/cms"
              ? pathname === "/cms"
              : pathname.startsWith(item.path);

          const Icon = item.icon;

          return (
            <Tooltip title={item.label} placement="right" key={item.label}>
              <ListItem
                disablePadding
                sx={{
                  justifyContent: "center",
                  mb: 2
                }}
              >
                <Link href={item.path} passHref>
                  <IconButton
                    size="large"
                    sx={{
                      color: isActive ? "white" : "text.secondary",
                      backgroundColor: isActive
                        ? "primary.light"
                        : "transparent",
                      ":hover": {
                        backgroundColor: "action.hover",
                        color: "primary.main",
                      },
                    }}
                  >
                    <Icon />
                  </IconButton>
                </Link>
              </ListItem>
            </Tooltip>
          );
        })}
      </List>
    </Drawer>
  );
}
