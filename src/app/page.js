"use client";

import {
  Box,
  Button,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import { useRouter } from "next/navigation";
import PollIcon from "@mui/icons-material/Poll";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import QuizIcon from "@mui/icons-material/Quiz";
import ForumIcon from "@mui/icons-material/Forum";
import ImageIcon from "@mui/icons-material/Image";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

export default function HomePage() {
  const router = useRouter();

  const handleCmsClick = () => {
    router.push("/cms");
  };

  return (
    <Box
      sx={{
        height: "calc(100vh -64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 4 },
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 720,
          backgroundColor: "white",
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          boxShadow: 6,
          animation: "fadeInUp 0.6s ease",
        }}
      >
        {/* Small Tagline */}
        <Typography
          variant="overline"
          fontWeight="bold"
          color="primary"
          letterSpacing={3}
          gutterBottom
        >
          Unified Event Engagement Suite
        </Typography>

        {/* Main Heading */}
        <Typography variant="h1" fontWeight="bold" gutterBottom>
          EventPass
        </Typography>

        {/* Description */}
        <Typography variant="body1" color="text.secondary" mb={4}>
          Run interactive quizzes, real-time polls, photo walls, audience Q&A, registration and check-in — all in one place.
        </Typography>

        {/* CMS Access Button */}
        <Stack direction="row" justifyContent="center" mb={4}>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            onClick={handleCmsClick}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: "bold",
              borderRadius: 3,
              ":hover": {
                borderColor: "primary.main",
                backgroundColor: "primary.light",
                color: "white",
              },
            }}
          >
            Go to CMS
          </Button>
        </Stack>

        <Divider sx={{ mb: 4 }} />

        {/* Features Grid */}
        <Stack
          spacing={2}
          direction={{ xs: "column", sm: "row" }}
          flexWrap="wrap"
          justifyContent="center"
          alignItems="center"
          textAlign="center"
          rowGap={3}
        >
          <Feature icon={<QuizIcon color="primary" fontSize="large" />} label="Quiznest" />
          <Feature icon={<SportsEsportsIcon color="secondary" fontSize="large" />} label="Event Duel" />
          <Feature icon={<PollIcon color="success" fontSize="large" />} label="VoteCast" />
          <Feature icon={<ForumIcon color="warning" fontSize="large" />} label="StageQ" />
          <Feature icon={<ImageIcon sx={{ color: "#6d4c41" }} fontSize="large" />} label="MosaicWall" />
          <Feature icon={<AssignmentIcon sx={{ color: "#00838f" }} fontSize="large" />} label="Event Reg" />
          <Feature icon={<HowToRegIcon color="info" fontSize="large" />} label="Check-In" />
          <Feature icon={<EmojiEventsIcon color="error" fontSize="large" />} label="Event Wheel" />
        </Stack>
      </Box>

      {/* Animation Keyframes */}
      <style jsx global>{`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Box>
  );
}

// Sub-component for feature icons + label
function Feature({ icon, label }) {
  return (
    <Stack alignItems="center" spacing={1} width={120}>
      {icon}
      <Typography variant="subtitle2" fontWeight="bold">
        {label}
      </Typography>
    </Stack>
  );
}
