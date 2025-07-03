"use client";

import {
  Box,
  Typography,
  Grid,
  Card,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Switch,
  Button,
  Tooltip,
  Container,
  Divider
} from "@mui/material";
import { useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";

const dummyBusinesses = [
  {
    id: "whitewall",
    name: "WhiteWall",
    email: "info@whitewall.om",
    logo: "/WW.png",
  },
  {
    id: "takaful",
    name: "Takaful Oman",
    email: "hello@takaful.om",
    logo: null,
  },
];

const allModules = [
  "Quiznest",
  "Event Duel",
  "VoteCast",
  "StageQ",
  "MosaicWall",
  "Event Reg",
  "Check-In",
  "Event Wheel",
];

export default function ModuleAccessPage() {
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [enabled, setEnabled] = useState({});
  const [moduleAccess, setModuleAccess] = useState(
    dummyBusinesses.reduce((acc, biz) => {
      acc[biz.id] = {
        Quiznest: true,
        "Event Duel": false,
        VoteCast: true,
        StageQ: true,
        MosaicWall: false,
        "Event Reg": true,
        "Check-In": true,
        "Event Wheel": false,
      };
      return acc;
    }, {})
  );

  const handleOpen = (biz) => {
    setSelectedBiz(biz);
    setEnabled({ ...moduleAccess[biz.id] });
  };

  const handleClose = () => {
    setSelectedBiz(null);
  };

  const handleToggle = (module) => {
    setEnabled((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  const handleSave = () => {
    setModuleAccess((prev) => ({
      ...prev,
      [selectedBiz.id]: { ...enabled },
    }));
    setSelectedBiz(null);
  };

  return (
    <Container>
      <BreadcrumbsNav />
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Manage Module Access
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Enable or disable modules for each business.
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {dummyBusinesses.map((biz) => (
          <Grid item xs={12} sm={6} md={4} key={biz.id}>
            <Card elevation={3} sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={biz.logo}
                  alt={biz.name}
                  sx={{ width: 56, height: 56, bgcolor: "primary.light" }}
                >
                  {biz.logo ? null : biz.name[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6">{biz.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {biz.email}
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ mt: 2, textAlign: "right" }}>
                <Tooltip title="Manage Module Access" placement="top">
                  <IconButton color="primary" onClick={() => handleOpen(biz)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Module Access Dialog */}
      <Dialog open={Boolean(selectedBiz)} onClose={handleClose} fullWidth>
        <DialogTitle>
          Manage Access for <strong>{selectedBiz?.name}</strong>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {allModules.map((mod) => (
              <Box
                key={mod}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 1,
                  borderBottom: "1px solid #eee",
                }}
              >
                <Typography variant="body1">{mod}</Typography>
                <Switch
                  checked={enabled[mod] || false}
                  onChange={() => handleToggle(mod)}
                />
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
