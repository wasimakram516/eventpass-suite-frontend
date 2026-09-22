"use client";

import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ICONS from "@/utils/iconUtil";

const emptyFee = { name: "", percentage: "" };

/** Checkout-owned editor for event-level fees and VAT. */
export default function FeesVatEditor({ fees = [], vatPercentage, onChange, t }) {
  const updateFee = (index, changes) => {
    const nextFees = [...fees];
    nextFees[index] = { ...nextFees[index], ...changes };
    onChange({ fees: nextFees });
  };

  const moveFee = (index, direction) => {
    const nextFees = [...fees];
    const nextIndex = index + direction;
    [nextFees[index], nextFees[nextIndex]] = [nextFees[nextIndex], nextFees[index]];
    onChange({ fees: nextFees });
  };

  return (
    <>
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>{t.fees}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          {t.feesDescription}
        </Typography>
        {fees.map((fee, index) => (
          <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Stack direction="row" sx={{ mb: 1.5, justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" fontWeight={600}>#{index + 1}</Typography>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                <Tooltip title={t.moveUp}><span><IconButton size="small" disabled={index === 0} onClick={() => moveFee(index, -1)}><ICONS.up fontSize="small" /></IconButton></span></Tooltip>
                <Tooltip title={t.moveDown}><span><IconButton size="small" disabled={index === fees.length - 1} onClick={() => moveFee(index, 1)}><ICONS.down fontSize="small" /></IconButton></span></Tooltip>
                <Tooltip title={t.removeFee}><IconButton size="small" color="error" onClick={() => onChange({ fees: fees.filter((_, itemIndex) => itemIndex !== index) })}><ICONS.delete fontSize="small" /></IconButton></Tooltip>
              </Stack>
            </Stack>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ flex: "1 1 200px" }}>
                <TextField fullWidth size="small" label={t.feeName} required value={fee.name}
                  onChange={(event) => updateFee(index, { name: event.target.value })} />
              </Box>
              <Box sx={{ flex: "1 1 200px" }}>
                <TextField fullWidth size="small" label={t.feePercentage} required type="number"
                  slotProps={{ htmlInput: { min: 0, step: 0.1 } }} value={fee.percentage}
                  onChange={(event) => updateFee(index, { percentage: event.target.value })} />
              </Box>
            </Box>
          </Paper>
        ))}
        <Button variant="outlined" size="small" onClick={() => onChange({ fees: [...fees, emptyFee] })}>
          + {t.addFee}
        </Button>
      </Box>
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>{t.vat}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          {t.vatDescription}
        </Typography>
        <TextField size="small" label={t.vatPercentage} type="number"
          slotProps={{ htmlInput: { min: 0, max: 100, step: 0.1 } }} value={vatPercentage}
          onChange={(event) => onChange({ vatPercentage: event.target.value })} sx={{ maxWidth: 220 }} />
      </Box>
    </>
  );
}
