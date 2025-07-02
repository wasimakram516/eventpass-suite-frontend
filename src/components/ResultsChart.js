"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Box, Stack, Typography, Divider, Chip } from "@mui/material";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57",
];

export default function ResultsChart({ poll }) {
  if (!poll) return null;

  const totalVotes = poll.options.reduce(
    (acc, option) => acc + option.votes,
    0
  );

  return (
    <Box
      width="20rem"
      minHeight="550px"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      alignItems="center"
      textAlign="center"
      sx={{
        p: 3,
        bgcolor: "background.paper",
        borderRadius: 4,
        boxShadow: 3,
      }}
    >
      {/* Question (Fixed Height + Scroll inside if too big) */}
      <Box
        sx={{
          width: "100%",
          height: "100px",
          mb: 1,
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          color="primary.main"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordBreak: "break-word",
          }}
        >
          {poll.question}
        </Typography>
      </Box>

      {/* Divider */}
      <Divider sx={{ width: "100%", my: 2 }} />

      {/* Pie Chart */}
      <Box
        sx={{
          width: "100%",
          height: 250,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={poll.options}
              dataKey="percentage"
              nameKey="text"
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={40}
              labelLine={false}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              {poll.options.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Divider */}
      <Divider sx={{ width: "100%", my: 2 }} />

      {/* Options List */}
      <Stack spacing={1.5} sx={{ width: "100%" }}>
        {poll.options.map((option, idx) => (
          <Stack
            key={idx}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: "grey.100",
              transition: "all 0.3s",
              "&:hover": { bgcolor: "grey.200" },
            }}
          >
            {/* Left-aligned text */}
            <Box sx={{ flexGrow: 1, textAlign: "left" }}>
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{
                  color: COLORS[idx % COLORS.length],
                  wordBreak: "break-word",
                }}
              >
                {option.text}
              </Typography>
            </Box>

            {/* Right side percentage */}
            <Chip
              label={`${option.percentage}%`}
              size="small"
              sx={{
                bgcolor: COLORS[idx % COLORS.length],
                color: "white",
                fontWeight: "bold",
              }}
            />
          </Stack>
        ))}
      </Stack>

      {/* Total Votes */}
      <Typography
        variant="subtitle2"
        color="text.secondary"
        fontStyle="italic"
        mt={3}
      >
        Total Votes Casted: <strong>{totalVotes}</strong>
      </Typography>
    </Box>
  );
}
