"use client";

import { Box, Typography, Paper, Stack, Divider, Chip } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1"];

export default function StatCard({ title, subtitle, data, centerValue }) {
  return (
    <Paper
      elevation={4}
      sx={{
        p: 3,
        borderRadius: 3,
        height: 400,
        width: {
          xs: "100%",
          sm: 300,
        },
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>

      <Box sx={{ height: 200, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={50}
              labelLine={false}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {data.map((_, i) => (
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
            color: "primary.main",
          }}
        >
          {centerValue}
        </Typography>
      </Box>

      <Divider />

      <Stack spacing={1} mt={2}>
        {data.map((item, idx) => (
          <Stack
            key={idx}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="body2"
              sx={{ color: COLORS[idx % COLORS.length] }}
            >
              {item.name}
            </Typography>
            <Chip
              label={`${item.value}`}
              size="small"
              sx={{
                bgcolor: COLORS[idx % COLORS.length],
                color: "#fff",
              }}
            />
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
