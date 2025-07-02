"use client";

import {
  Drawer,
  List,
  ListItem,
  Tooltip,
  IconButton,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Quiz,
  SportsEsports,
  BarChart,
  Forum,
  Image,
  Assignment,
  HowToReg,
  Group,
  EmojiEvents,
} from "@mui/icons-material";

const navItems = [
  { label: "Dashboard", icon: Home, path: "/cms" },
  { label: "Quiznest", icon: Quiz, path: "/cms/quiznest" },
  { label: "Event Duel", icon: SportsEsports, path: "/cms/eventduel" },
  { label: "VoteCast", icon: BarChart, path: "/cms/votecast" },
  { label: "StageQ", icon: Forum, path: "/cms/stageq" },
  { label: "MosaicWall", icon: Image, path: "/cms/mosaicwall" },
  { label: "Event Reg", icon: Assignment, path: "/cms/eventreg" },
  { label: "Check-In", icon: HowToReg, path: "/cms/checkin" },
  { label: "Event Wheel", icon: EmojiEvents, path: "/cms/eventwheel" },
  { label: "Users", icon: Group, path: "/cms/users" },
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
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Tooltip title={item.label} placement="right" key={item.label}>
              <ListItem disablePadding sx={{ justifyContent: "center" }}>
                <Link href={item.path} passHref>
                  <IconButton
                    size="large"
                    sx={{
                      color: isActive ? "white" : "text.secondary",
                      backgroundColor: isActive ? "primary.light" : "transparent",
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
