"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Stack,
  IconButton,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Tooltip,
  Chip,
  Drawer,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
} from "@mui/material";
import PollIcon from "@mui/icons-material/Poll";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ShareIcon from "@mui/icons-material/Share";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import { useMessage } from "@/contexts/MessageContext";
import { useAuth } from "@/contexts/AuthContext";

import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import PollFormDrawer from "@/components/PollFormDrawer";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import SharePollModal from "@/components/SharePollModal";

export default function ManagePollsPage() {
  const { user } = useAuth();
  const { showMessage } = useMessage();

  // Dummy data (replace with your actual dummy data as needed)
  const dummyBusinesses = [
    {
      _id: "680dcdce9165d61742703078",
      name: "demo-corpLive",
      slug: "demo-corp",
    },
  ];

  const dummyPolls = [
    {
      _id: "680f438841f048f37e3a3392",
      business: {
        _id: "680dcdce9165d61742703078",
        name: "demo-corpLive",
        slug: "demo-corp",
      },
      question:
        "How well does your organization show healthy habits like taking breaks and vacations?",
      options: [
        {
          text: "Not at all present/inadequate",
          imageUrl:
            "https://res.cloudinary.com/dwva39slo/image/upload/v1745830815/VoteCast/images/wtscbbz4jcfvcz8sychm.png",
          votes: 1,
        },
        {
          text: "Minimally present",
          imageUrl:
            "https://res.cloudinary.com/dwva39slo/image/upload/v1745830815/VoteCast/images/uasc2pxqr43bibdpx5q3.png",
          votes: 4,
        },
        {
          text: "Somewhat present",
          imageUrl:
            "https://res.cloudinary.com/dwva39slo/image/upload/v1745830814/VoteCast/images/yjnwitqrt081mwredtlf.png",
          votes: 15,
        },
        {
          text: "Mostly Present",
          imageUrl:
            "https://res.cloudinary.com/dwva39slo/image/upload/v1745830815/VoteCast/images/h2kaicuzugevaqhzcw2b.png",
          votes: 21,
        },
        {
          text: "Fully present and effective",
          imageUrl:
            "https://res.cloudinary.com/dwva39slo/image/upload/v1745830814/VoteCast/images/lhzlpcag7kolt6uj0mzj.png",
          votes: 18,
        },
      ],
      status: "active",
      type: "slider",
      createdAt: "2025-04-28T08:59:52.553Z",
      updatedAt: "2025-07-03T10:28:27.518Z",
      __v: 1,
    },
    // ... (add all other polls from your provided data here)
  ];

  const [polls, setPolls] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [editPoll, setEditPoll] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePoll, setSharePoll] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  // --- Added for business user: poll status dropdown ---
  const [pollStatus, setPollStatus] = useState("all"); // "all", "active", "archived"
  useEffect(() => {
    setBusinesses(dummyBusinesses);

    if (user?.role === "admin") {
      fetchPolls();
    } else if (user?.role === "business") {
      // Use the user's businessSlug if it matches your dummy data, otherwise fallback to the dummy slug
      const businessSlug =
        user.businessSlug ||
        (dummyBusinesses.length > 0 ? dummyBusinesses[0].slug : "");
      setSelectedBusiness(businessSlug);
      fetchPolls(businessSlug, "");
    }
  }, [user]);

  const fetchPolls = (businessSlug = "", status = "") => {
    let filtered = dummyPolls;
    if (businessSlug) {
      filtered = filtered.filter(
        (poll) =>
          poll.business?.slug === businessSlug ||
          poll.business?.name ===
            dummyBusinesses.find((b) => b.slug === businessSlug)?.name
      );
    }
    if (status === "active") {
      filtered = filtered.filter((poll) => poll.status === "active");
    } else if (status === "archived") {
      filtered = filtered.filter((poll) => poll.status === "archived");
    }
    setPolls(filtered);
  };

  const handleSubmit = (formData, id = null) => {
    if (id) {
      setPolls((prev) =>
        prev.map((poll) => (poll._id === id ? { ...poll, ...formData } : poll))
      );
      showMessage("Poll updated successfully", "success");
    } else {
      const newPoll = {
        _id: `poll${polls.length + 1}`,
        ...formData,
        business:
          businesses.find((b) => b.slug === selectedBusiness) || businesses[0],
      };
      setPolls((prev) => [...prev, newPoll]);
      showMessage("Poll created successfully", "success");
    }
    setOpenDrawer(false);
    setEditPoll(null);
  };

  const handleDelete = () => {
    setPolls((prev) => prev.filter((poll) => poll._id !== confirmDelete.id));
    showMessage("Poll deleted successfully", "success");
    setConfirmDelete({ open: false, id: null });
  };

  const handleBusinessSelect = (businessSlug, status = "") => {
    setSelectedBusiness(businessSlug);
    fetchPolls(businessSlug, status);
    setDrawerOpen(false);
  };

  const handleClone = (pollId) => {
    const pollToClone = polls.find((poll) => poll._id === pollId);
    if (pollToClone) {
      const clonedPoll = {
        ...pollToClone,
        _id: `poll${polls.length + 1}`,
        question: pollToClone.question + " (Clone)",
      };
      setPolls((prev) => [...prev, clonedPoll]);
      showMessage("Poll cloned successfully", "success");
    } else {
      showMessage("Failed to clone poll", "error");
    }
  };
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* --- Sidebar Drawer only for admin --- */}
      {user?.role === "admin" && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: { width: 320, p: 2, bgcolor: "background.default" },
          }}
        >
          <Stack spacing={2} sx={{ height: "100%" }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6" fontWeight="bold">
                Select Business
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Stack>
            <Divider />

            <Box sx={{ flexGrow: 1, overflowY: "auto", mt: 1 }}>
              {businesses.length > 0 ? (
                businesses.map((business) => (
                  <Accordion key={business._id} disableGutters elevation={0}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        px: 2,
                        py: 1,
                      }}
                    >
                      <Typography fontWeight="bold">{business.name}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          onClick={() =>
                            handleBusinessSelect(business.slug, "")
                          }
                        >
                          All Polls
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          color="success"
                          onClick={() =>
                            handleBusinessSelect(business.slug, "active")
                          }
                        >
                          Active Polls
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          color="warning"
                          onClick={() =>
                            handleBusinessSelect(business.slug, "archived")
                          }
                        >
                          Archived Polls
                        </Button>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                ))
              ) : (
                <Typography
                  textAlign="center"
                  mt={4}
                  variant="body2"
                  color="text.secondary"
                >
                  No businesses found.
                </Typography>
              )}
            </Box>
          </Stack>
        </Drawer>
      )}
      {/* Main Content */}
      <Container maxWidth="lg">
        <BreadcrumbsNav />

        {/* Top Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "left" }}
          spacing={2}
          mb={2}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Manage Polls
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Select a business to view and manage its polls.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            {user?.role === "admin" ? (
              // Admin: show Select Business button
              <Button variant="outlined" onClick={() => setDrawerOpen(true)}>
                Select Business
              </Button>
            ) : user?.role === "business" ? (
              // Business: show dropdown for poll status
              <Select
                value={pollStatus}
                onChange={(e) => {
                  const status = e.target.value;
                  setPollStatus(status);
                  fetchPolls(user.businessSlug, status === "all" ? "" : status);
                }}
                size="small"
                sx={{ minWidth: 150 }}
                MenuProps={{
                  disableScrollLock: true,
                }}
              >
                <MenuItem value="all">All Polls</MenuItem>
                <MenuItem value="active">Active Polls</MenuItem>
                <MenuItem value="archived">Archived Polls</MenuItem>
              </Select>
            ) : null}

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditPoll(null);
                setOpenDrawer(true);
              }}
              sx={{
                minWidth: { xs: "100%", sm: "auto" },
                fontWeight: "bold",
                fontSize: "1rem",
                py: 1.5,
              }}
            >
              Create Poll
            </Button>

            <Button
              variant="outlined"
              color="success"
              disabled={!selectedBusiness}
              onClick={async () => {
                if (!selectedBusiness) {
                  showMessage(
                    "Please select a business to export polls.",
                    "warning"
                  );
                  return;
                }
                try {
                  setLoading(true);
                  await exportPollsToExcel(selectedBusiness, selectedStatus);
                } catch (error) {
                  console.error(error);
                  showMessage("Failed to export polls.", "error");
                } finally {
                  setLoading(false);
                }
              }}
              sx={{
                minWidth: { xs: "100%", sm: "auto" },
                fontWeight: "bold",
                fontSize: "1rem",
                py: 1.5,
              }}
            >
              Export Polls
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 4 }} />

        {/* Polls Display */}
        {loading ? (
          <Box
            minHeight="40vh"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <CircularProgress />
          </Box>
        ) : (
          <Grid
            container
            spacing={3}
            justifyContent={{ xs: "center", sm: "flex-start" }}
          >
            {polls.map((poll) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={3}
                key={poll._id}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Card
                  elevation={3}
                  sx={{
                    width: "350px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        <PollIcon />
                      </Avatar>
                    }
                    title={poll.question}
                    subheader={poll.business?.name || "No business"}
                    action={
                      <Chip
                        label={poll.status}
                        color={poll.status === "active" ? "success" : "default"}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    }
                  />
                  <CardContent>
                    <Stack spacing={1}>
                      {poll.options.map((opt, idx) => (
                        <Stack
                          key={idx}
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          {opt.imageUrl && (
                            <Avatar
                              src={opt.imageUrl}
                              alt={`Option ${idx + 1}`}
                              variant="rounded"
                              sx={{ width: 40, height: 40 }}
                            />
                          )}
                          <Typography variant="body2" color="text.secondary">
                            {opt.text}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "flex-end" }}>
                    <Tooltip title="Clone">
                      <IconButton
                        color="secondary"
                        onClick={() => handleClone(poll._id)}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Edit">
                      <IconButton
                        color="primary"
                        onClick={() => {
                          setEditPoll(poll);
                          setOpenDrawer(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        onClick={() =>
                          setConfirmDelete({ open: true, id: poll._id })
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share Poll Link">
                      <IconButton
                        color="info"
                        onClick={() => {
                          setSharePoll(poll);
                          setShareOpen(true);
                        }}
                      >
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create/Edit Poll Drawer */}
        <PollFormDrawer
          open={openDrawer}
          onClose={() => {
            setOpenDrawer(false);
            setEditPoll(null);
          }}
          onSubmit={handleSubmit}
          initialValues={editPoll}
          businesses={businesses}
        />

        {/* Delete Poll Dialog */}
        <ConfirmationDialog
          open={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false, id: null })}
          onConfirm={handleDelete}
          title="Delete Poll"
          message="Are you sure you want to delete this poll? This action cannot be undone."
          confirmButtonText="Delete"
        />

        {/* Share Modal */}
        <SharePollModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          poll={sharePoll}
        />
      </Container>
    </Box>
  );
}
