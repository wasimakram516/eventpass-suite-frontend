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

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1"];

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
        <Typography variant="h6" fontWeight="bold" gutterBottom noWrap>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
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
          fontWeight="bold"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: theme.palette.primary.main,
            whiteSpace: "nowrap",
          }}
        >
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
            justifyContent="space-between"
            alignItems="center"
            sx={{
              bgcolor: "grey.100",
              borderRadius: 2,
              px: 1.5,
              py: 1,
              transition: "background 0.3s",
              "&:hover": { bgcolor: "grey.200" },
            }}
          >
            <Typography
              variant="body2"
              fontWeight={500}
              sx={{ color: COLORS[idx % COLORS.length] }}
            >
              {item.name}
            </Typography>
            <Chip
              label={item.value}
              size="small"
              sx={{
                bgcolor: COLORS[idx % COLORS.length],
                color: "#fff",
                fontWeight: "bold",
              }}
            />
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
