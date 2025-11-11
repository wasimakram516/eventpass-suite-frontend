"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Slider,
  IconButton,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";
import ResultsChart from "@/components/cards/ResultsChart";

export default function DemoPoll() {
  const [currentPollIndex, setCurrentPollIndex] = useState(0);
  const [highlightedOption, setHighlightedOption] = useState(null);
  const [sliderValue, setSliderValue] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const demoPolls = [
    {
      type: "options",
      question: "Which type of vacation do you prefer?",
      options: [
        {
          text: "Countryside",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/861/861060.png",
          votes: 14,
        },
        {
          text: "Mountains",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/1146/1146869.png",
          votes: 10,
        },
        {
          text: "City Break",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          votes: 12,
        },
        {
          text: "Adventure Travel",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/2360/2360201.png",
          votes: 8,
        },
      ],
    },
    {
      type: "slider",
      question: "How do you usually start your morning?",
      options: [
        {
          text: "Coffee",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/590/590836.png",
          votes: 15,
        },
        {
          text: "Exercise",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/727/727399.png",
          votes: 9,
        },
        {
          text: "Checking Phone",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/597/597177.png",
          votes: 11,
        },
        {
          text: "Meditation",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/2907/2907300.png",
          votes: 5,
        },
      ],
    },
    {
      type: "options",
      question: "Which streaming platform do you use the most?",
      options: [
        {
          text: "Netflix",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/732/732228.png",
          votes: 18,
        },
        {
          text: "YouTube",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/174/174883.png",
          votes: 16,
        },
        {
          text: "Disney+",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/5968/5968705.png",
          votes: 6,
        },
        {
          text: "Prime Video",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/5977/5977572.png",
          votes: 7,
        },
      ],
    },
    {
      type: "slider",
      question: "What's your favorite way to relax after a long day?",
      options: [
        {
          text: "Watching TV",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/819/819814.png",
          votes: 17,
        },
        {
          text: "Reading a Book",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/1829/1829590.png",
          votes: 10,
        },
        {
          text: "Gaming",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/103/103512.png",
          votes: 12,
        },
        {
          text: "Going for a Walk",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/135/135620.png",
          votes: 8,
        },
      ],
    },
  ];

  const handleRestart = () => {
    setCurrentPollIndex(0);
    setHighlightedOption(null);
    setSliderValue(0);
    setShowResults(false);
  };

  const handleNext = () => {
    if (currentPollIndex < demoPolls.length - 1) {
      setCurrentPollIndex((prev) => prev + 1);
      setHighlightedOption(null);
      setSliderValue(0);
    } else {
      setShowResults(true);
    }
  };

  const handleOptionSelect = (idx) => {
    if (highlightedOption === null) {
      setHighlightedOption(idx);
      setTimeout(() => handleNext(), 800); // auto move after slight delay
    }
  };

  const handleSliderConfirm = () => {
    if (highlightedOption !== null) {
      handleNext();
    }
  };

  const calculateResults = () => {
    return demoPolls.map((poll, idx) => {
      const selected = highlightedOption;
      const options = poll.options.map((option, optIdx) => {
        const totalVotes =
          poll.options.reduce((acc, opt) => acc + opt.votes, 0) + 1;
        const votes = optIdx === selected ? option.votes + 1 : option.votes;
        const percentage = Math.round((votes / totalVotes) * 100);
        return { ...option, votes, percentage };
      });
      return { ...poll, options };
    });
  };

  if (showResults) {
    const results = calculateResults();
    return (
      <Box sx={{ minHeight: "calc(100vh - 80px)", p: 4, mt: 2 }}>
        <Stack
          direction= "row" 
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
          mb={2}
        >
          <Typography variant="h4" fontWeight="bold">
            Results for Demo Poll
          </Typography>
          {/* Restart Icon */}
          <IconButton onClick={handleRestart} color="primary">
            <ReplayIcon fontSize="large" />
          </IconButton>
        </Stack>
        <Divider sx={{ mb: 4 }} />
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
      </Box>
    );
  }

  const currentPoll = demoPolls[currentPollIndex];
  const optionCount = currentPoll.options.length;

  return (
    <Box sx={{ minHeight: "calc(100vh - 80px)", p: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        mt={2}
        mb={2}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Vote Now
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Choose the option that best fits you.
          </Typography>
        </Box>

        {/* Restart Icon */}
        <IconButton onClick={handleRestart} color="primary">
          <ReplayIcon fontSize="large" />
        </IconButton>
      </Stack>
      <Divider sx={{ width: "100%", my: 2 }} />

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <Card
          elevation={6}
          sx={{
            width: "100%",
            maxWidth: 600,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <CardHeader
            title={currentPoll.question}
            titleTypographyProps={{
              fontWeight: "bold",
              fontSize: "1.4rem",
              textAlign: "center",
            }}
            sx={{ bgcolor: "primary.main", color: "white", py: 3 }}
          />
          <CardContent>
            {currentPoll.type === "options" ? (
              <Stack spacing={2}>
                {currentPoll.options.map((option, idx) => (
                  <Box
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    sx={{
                      p: 2,
                      border: "2px solid",
                      borderColor:
                        highlightedOption === idx ? "primary.main" : "grey.300",
                      borderRadius: 3,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.3s",
                      "&:hover": { bgcolor: "grey.100" },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      {option.imageUrl && (
                        <Avatar
                          src={option.imageUrl}
                          variant="rounded"
                          sx={{ width: 48, height: 48 }}
                        />
                      )}
                      <Typography fontWeight="bold">{option.text}</Typography>
                    </Stack>
                    {highlightedOption === idx && (
                      <CheckCircleIcon color="primary" />
                    )}
                  </Box>
                ))}
              </Stack>
            ) : (
              <>
                <Stack
                  direction="row"
                  spacing={2}
                  justifyContent="center"
                  mb={4}
                  flexWrap="wrap"
                >
                  {currentPoll.options.map((option, idx) => (
                    <Box
                      key={idx}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      width={90}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        transition: "all 0.3s ease",
                        border:
                          highlightedOption === idx
                            ? "2px solid"
                            : "2px dashed",
                        borderColor:
                          highlightedOption === idx
                            ? "primary.main"
                            : "grey.300",
                        cursor: "pointer",
                      }}
                    >
                      {/* Number */}
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        color={
                          highlightedOption === idx
                            ? "primary.main"
                            : "text.secondary"
                        }
                        mb={0.5}
                      >
                        {idx + 1}
                      </Typography>

                      {/* Image */}
                      {option.imageUrl && (
                        <Avatar
                          src={option.imageUrl}
                          variant="rounded"
                          sx={{
                            width: 64,
                            height: 64,
                            mb: 1,
                            filter:
                              highlightedOption === idx
                                ? "none"
                                : "grayscale(100%)",
                            transition: "filter 0.3s",
                          }}
                        />
                      )}

                      {/* Text */}
                      <Typography
                        variant="caption"
                        textAlign="center"
                        fontWeight="bold"
                        color={
                          highlightedOption === idx
                            ? "primary.main"
                            : "text.secondary"
                        }
                        sx={{ wordBreak: "break-word" }}
                      >
                        {option.text}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Box width="100%" px={4}>
                  <Slider
                    value={sliderValue}
                    onChange={(e, val) => {
                      setSliderValue(val);
                      const closest = Math.round(val);
                      if (closest !== highlightedOption) {
                        setHighlightedOption(closest);
                      }
                    }}
                    step={0.01}
                    min={0}
                    max={optionCount - 1}
                    sx={{
                      mt: 4,
                      "& .MuiSlider-thumb": {
                        width: 24,
                        height: 24,
                        bgcolor: "white",
                        border: "2px solid",
                        borderColor: "primary.main",
                      },
                      "& .MuiSlider-track": { height: 8 },
                      "& .MuiSlider-rail": { height: 8, bgcolor: "grey.300" },
                    }}
                  />
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSliderConfirm}
                  disabled={highlightedOption === null}
                  sx={{ mt: 4 }}
                >
                  {currentPollIndex < demoPolls.length - 1
                    ? "Next Poll"
                    : "Finish Poll"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
