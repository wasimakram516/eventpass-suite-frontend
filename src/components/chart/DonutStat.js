"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts";

export const DONUT_SERIES_ID = "donut";

const DonutStat = React.memo(function DonutStat({
  data,
  centerLabel,
  height = 180,
  width,
  animateCharts = false,
  innerRadius = 50,
  outerRadius = 70,
  minWidth = 180,
  margin,
  centerLabelSx,
  highlightedItem,
  onHighlightChange,
}) {
  const isEmpty = data.length === 1 && data[0]?.isEmpty;
  const controlledHighlight = onHighlightChange
    ? { highlightedItem: highlightedItem ?? null, onHighlightChange }
    : {};

  return (
    <Box
      sx={{
        position: "relative",
        width: width ?? "100%",
        height,
        minWidth,
        flexShrink: 0,
      }}
    >
      <PieChart
        width={width}
        height={height}
        margin={margin}
        skipAnimation={!animateCharts}
        {...controlledHighlight}
        series={[
          {
            id: DONUT_SERIES_ID,
            data,
            innerRadius,
            outerRadius,
            paddingAngle: isEmpty ? 0 : 2,
            cornerRadius: 3,
            arcLabel: () => "",
            highlightScope: isEmpty ? undefined : { highlight: "item", fade: "global" },
            highlighted: { additionalRadius: 4 },
            faded: { additionalRadius: -2 },
          },
        ]}
        slotProps={{
          legend: { hidden: true, sx: { display: "none !important" } },
          tooltip: { trigger: isEmpty ? "none" : "item" },
        }}
      />
      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          ...centerLabelSx,
        }}
      >
        {centerLabel}
      </Typography>
    </Box>
  );
});

export default DonutStat;