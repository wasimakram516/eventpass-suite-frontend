"use client";

import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  Chip,
  useTheme,
} from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { VOTECAST_CHART_COLORS as COLORS } from "@/styles/theme";

export default function StatCard({ title, subtitle, data = [], centerValue }) {
  const theme = useTheme();

  return (
    <Paper
      elevation={4}
      sx={{
        p: 3,
        borderRadius: 4,
        width: "100%",
        maxWidth: "20rem",
        height: "100%",
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        textAlign: "center",
      }}
    >
      {/* Header */}
      <Box>
        <Typography variant="h6" gutterBottom noWrap sx={{
          fontWeight: "bold"
        }}>
          {title}
        </Typography>
        <Typography variant="body2" noWrap sx={{
          color: "text.secondary"
        }}>
          {subtitle}
        </Typography>
      </Box>
      {/* Pie Chart */}
      <Box sx={{ position: "relative", height: 200, my: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={50}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
              labelLine={false}
            >
              {data?.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        {/* Center value */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: theme.palette.primary.main,
            whiteSpace: "nowrap"
          }}>
          {centerValue}
        </Typography>
      </Box>
      <Divider sx={{ my: 1.5 }} />
      {/* Option breakdown */}
      <Stack spacing={1}>
        {data?.map((item, idx) => (
          <Stack
            key={idx}
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "action.hover",
              borderRadius: 2,
              px: 1.5,
              py: 1,
              transition: "background 0.3s",
              "&:hover": { bgcolor: "action.selected" }
            }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: COLORS[idx % COLORS.length]
              }}>
              {item.name}
            </Typography>
            <Chip
              label={item.value}
              size="small"
              sx={{
                bgcolor: COLORS[idx % COLORS.length],
                color: "common.white",
                fontWeight: "bold",
              }}
            />
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
