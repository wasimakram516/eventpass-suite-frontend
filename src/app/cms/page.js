"use client";

import { Box, Typography, Grid, Container } from "@mui/material";
import DashboardCard from "@/components/DashboardCard";
import { useRouter } from "next/navigation";

// Icons
import QuizIcon from "@mui/icons-material/Quiz";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import PollIcon from "@mui/icons-material/Poll";
import ForumIcon from "@mui/icons-material/Forum";
import ImageIcon from "@mui/icons-material/Image";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

export default function HomePage() {
  const router = useRouter();

  const modules = [
    {
      title: "Quiznest",
      description: "Create and manage single-player quiz games.",
      icon: <QuizIcon />,
      color: "#0d47a1", // dark blue
      route: "/cms/quiznest",
      buttonLabel: "Manage Quizzes",
    },
    {
      title: "Event Duel",
      description: "Run real-time 1v1 quiz competitions.",
      icon: <SportsEsportsIcon />,
      color: "#5e35b1", // muted purple
      route: "/cms/eventduel",
      buttonLabel: "Launch Duels",
    },
    {
      title: "VoteCast",
      description: "Create and track audience polls.",
      icon: <PollIcon />,
      color: "#00695c", // teal green
      route: "/cms/votecast",
      buttonLabel: "View Polls",
    },
    {
      title: "StageQ",
      description: "Display visitor-submitted questions as bubbles.",
      icon: <ForumIcon />,
      color: "#ef6c00", // deep orange
      route: "/cms/stageq",
      buttonLabel: "Open Questions",
    },
    {
      title: "MosaicWall",
      description: "Show photo & text submissions in real time.",
      icon: <ImageIcon />,
      color: "#4e342e", // dark brown
      route: "/cms/mosaicwall",
      buttonLabel: "View Submissions",
    },
    {
      title: "Event Reg",
      description: "Build custom registration forms for events.",
      icon: <AssignmentIcon />,
      color: "#006064", // cyan dark
      route: "/cms/eventreg",
      buttonLabel: "Manage Forms",
    },
    {
      title: "Check-In",
      description: "Track and verify guest entries.",
      icon: <HowToRegIcon />,
      color: "#0277bd", // soft blue
      route: "/cms/checkin",
      buttonLabel: "Start Check-In",
    },
    {
      title: "Event Wheel",
      description: "Spin-to-win prize game for attendees.",
      icon: <EmojiEventsIcon />,
      color: "#c62828", // muted red
      route: "/cms/eventwheel",
      buttonLabel: "Run Spin Wheel",
    },
  ];  

  return (
  <Box
    sx={{
      pb: 8,
      bgcolor: "background.default",
    }}
  >
    <Container maxWidth="lg">
      {/* Heading */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome to EventPass Suite
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all your interactive event tools in one place — quizzes, polls, audience engagement, registration, and more.
        </Typography>
      </Box>

      <Grid container spacing={3} justifyContent="center">
        {modules.map((mod) => (
          <DashboardCard
          key={mod.title}
          title={mod.title}
          description={mod.description}
          icon={mod.icon}
          color={mod.color}
          buttonLabel={mod.buttonLabel}
          route={mod.route}
        />        
        ))}
      </Grid>
    </Container>
  </Box>
);

}
