"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Box, Stack, Typography, Divider, Chip } from "@mui/material";
import useI18nLayout from "@/hooks/useI18nLayout";
import { VOTECAST_CHART_COLORS as COLORS } from "@/styles/theme";
const translations = {
  en: {
    totalVotesCasted: "Total Votes Casted:",
  },
  ar: {
    totalVotesCasted: "إجمالي الأصوات المدلى بها:",
  },
};

export default function ResultsChart({ poll }) {
  const { t, dir } = useI18nLayout(translations);

  if (!poll) return null;

  const totalVotes = poll.options.reduce(
    (acc, option) => acc + option.votes,
    0
  );

  return (
    <Box
      sx={{
        width: { xs: "100%", sm: "20rem" },
        minHeight: "550px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        textAlign: "center",
        p: 3,
        bgcolor: "background.paper",
        borderRadius: 4,
        boxShadow: 3
      }}>
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
          sx={{
            fontWeight: "bold",
            color: "primary.main",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordBreak: "break-word"
          }}>
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
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              p: 1.5,
              borderRadius: 2,
              bgcolor: "action.hover",
              transition: "all 0.3s",
              "&:hover": { bgcolor: "action.selected" },
              gap: 1.5
            }}>
            {/* Image + Text */}
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "center",
                minWidth: 0
              }}>
              {option.imageUrl && (
                <Box
                  component="img"
                  src={option.imageUrl}
                  alt={option.text}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              )}

              {option.text && (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: "bold",
                    color: COLORS[idx % COLORS.length],
                    wordBreak: "break-word"
                  }}>
                  {option.text}
                </Typography>
              )}
            </Stack>

            {/* Percentage */}
            <Chip
              label={`${option.percentage}%`}
              size="small"
              sx={{
                bgcolor: COLORS[idx % COLORS.length],
                color: "common.white",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            />
          </Stack>

        ))}
      </Stack>
      {/* Total Votes */}
      <Typography
        variant="subtitle2"
        sx={{
          color: "text.secondary",
          fontStyle: "italic",
          mt: 3
        }}>
        {t.totalVotesCasted} <strong>{totalVotes}</strong>
      </Typography>
    </Box>
  );
}
