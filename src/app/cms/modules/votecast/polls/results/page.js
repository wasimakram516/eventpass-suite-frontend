"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Drawer,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  Select,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import ResultsChart from "@/components/ResultsChart";
import BreadcrumbsNav from "@/components/BreadcrumbsNav";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useAuth } from "@/contexts/AuthContext";
export default function ResultsPage() {
  // --- Dummy results data ---
  const dummyResults = [
    {
      _id: "680f438841f048f37e3a3392",
      question:
        "How well does your organization show healthy habits like taking breaks and vacations?",
      totalVotes: 59,
      options: [
        {
          text: "Not at all present/inadequate",
          imageUrl:
            "https://res.cloudinary.com/dwva39slo/image/upload/v1745830815/VoteCast/images/wtscbbz4jcfvcz8sychm.png",
          votes: 1,
          percentage: 1.69,
        },
        {
          text: "Minimally present",
          imageUrl:
            "https://res.cloudinary.com/dwva39slo/image/upload/v1745830815/VoteCast/images/uasc2pxqr43bibdpx5q3.png",
          votes: 4,
          percentage: 6.78,
        },
        {
          text: "Somewhat present",
          imageUrl:
            "https://res.cloudinary.com/dwva39slo/image/upload/v1745830814/VoteCast/images/yjnwitqrt081mwredtlf.png",
          votes: 15,
          percentage: 25.42,
        },
        {
          text: "Mostly Present",
          imageUrl:
            "https://res.cloudinary.com/dwva39slo/image/upload/v1745830815/VoteCast/images/h2kaicuzugevaqhzcw2b.png",
          votes: 21,
          percentage: 35.59,
        },
        {
          text: "Fully present and effective",
          imageUrl:
            "https://res.cloudinary.com/dwva39slo/image/upload/v1745830814/VoteCast/images/lhzlpcag7kolt6uj0mzj.png",
          votes: 18,
          percentage: 30.51,
        },
      ],
    },
    // ... (add all other polls from your provided data here)
  ];

  // --- Dummy businesses data (if needed for admin drawer) ---
  const dummyBusinesses = [
    {
      _id: "680dcdce9165d61742703078",
      name: "OERLive",
      slug: "oer",
    },
  ];

  const { user } = useAuth();

  const [businesses, setBusinesses] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(""); // '', 'active', 'archived'
  const [confirmReset, setConfirmReset] = useState(false);

  // For business user dropdown
  const [pollStatus, setPollStatus] = useState("all");

  // --- Remove all service calls, use dummy data only ---
  useEffect(() => {
    setBusinesses(dummyBusinesses);

    if (user?.role === "admin") {
      setResults(dummyResults);
    } else if (user?.role === "business") {
      setSelectedBusiness(user.businessSlug);
      setPollStatus("all");
      filterResults(user.businessSlug, "all");
    }
  }, [user]);

  // --- Filtering logic for business user ---
  const filterResults = (businessSlug, status = "all") => {
    let filtered = dummyResults;
    // If you have businessSlug in your result, filter by businessSlug here
    // For now, all results are for the business, so we skip this step

    if (status === "active") {
      filtered = filtered.filter((poll) => poll.status === "active");
    } else if (status === "archived") {
      filtered = filtered.filter((poll) => poll.status === "archived");
    }
    setResults(filtered);
  };

  // --- Handler for business user dropdown ---
  const handleStatusChange = (e) => {
    const status = e.target.value;
    setPollStatus(status);
    filterResults(user.businessSlug, status);
    setSelectedStatus(status === "all" ? "" : status);
    setSelectedBusiness(user.businessSlug);
  };

  // --- Handler for admin business selection ---
  const handleBusinessSelect = (businessSlug, status = "") => {
    setSelectedBusiness(businessSlug);
    setSelectedStatus(status);
    setResults(dummyResults);
    setDrawerOpen(false);
  };

  // --- Handler for resetting votes (dummy logic) ---
  const handleResetVotes = () => {
    // Here you would reset votes in your backend or state
    setConfirmReset(false);
  };

  return (
    <>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar Drawer */}
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
              {/* Top Header */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="h6" fontWeight="bold">
                  Select Business
                </Typography>
                <IconButton onClick={() => setDrawerOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Stack>

              <Divider />

              {/* Business Accordions */}
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
                        <Typography fontWeight="bold">
                          {business.name}
                        </Typography>
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
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    mt={4}
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
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "left" }}
            spacing={2}
            mb={3}
          >
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Poll Results Viewer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select a business and poll status from the sidebar to view
                results.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              {user?.role === "admin" ? (
                <Button
                  variant="outlined"
                  onClick={() => setDrawerOpen(true)}
                  sx={{
                    minWidth: { xs: "100%", sm: "auto" },
                    fontWeight: "bold",
                    fontSize: "1rem",
                    py: 1.5,
                  }}
                >
                  Select Business
                </Button>
              ) : user?.role === "business" ? (
                <Select
                  value={pollStatus}
                  onChange={handleStatusChange}
                  size="small"
                  sx={{ minWidth: 150 }}
                  MenuProps={{
                    disableScrollLock: true, // Prevents layout shift when opening
                  }}
                >
                  <MenuItem value="all">All Polls</MenuItem>
                  <MenuItem value="active">Active Polls</MenuItem>
                  <MenuItem value="archived">Archived Polls</MenuItem>
                </Select>
              ) : null}
              {/* End role-based business/status selection UI */}
              {results.length > 0 && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setConfirmReset(true)}
                  sx={{
                    minWidth: { xs: "100%", sm: "auto" },
                    fontWeight: "bold",
                    fontSize: "1rem",
                    py: 1.5,
                  }}
                >
                  Reset Votes
                </Button>
              )}

              {/* View Full Screen CTA */}
              {results.length > 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() =>
                    window.open(
                      `/votecast/polls/${selectedBusiness}/results?status=${selectedStatus}`,
                      "_blank"
                    )
                  }
                  sx={{
                    minWidth: { xs: "100%", sm: "auto" },
                    fontWeight: "bold",
                    fontSize: "1rem",
                    py: 1.5,
                  }}
                >
                  View Full Screen
                </Button>
              )}
            </Stack>
          </Stack>

          <Divider sx={{ mb: 4 }} />

          {/* Results Section */}
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "50vh",
              }}
            >
              <CircularProgress />
            </Box>
          ) : results.length > 0 ? (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 4,
                py: 4,
              }}
            >
              {results.map((poll) => (
                <ResultsChart key={poll._id} poll={poll} />
              ))}
            </Box>
          ) : (
            selectedBusiness && (
              <Typography textAlign="center" mt={4} variant="body1">
                No results available for the selected business and status.
              </Typography>
            )
          )}
        </Container>
      </Box>
      <ConfirmationDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleResetVotes}
        title="Confirm Vote Reset"
        message="Are you sure you want to reset all votes for the selected polls? This action cannot be undone."
        confirmButtonText="Reset"
      />
    </>
  );
}
