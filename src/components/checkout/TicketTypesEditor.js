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

const emptyTicketType = { name: "", description: "", price: "", capacity: "" };

/**
 * Checkout-owned ticket type editor. It preserves the stable-ID/name mapping
 * used by dependent registration fields while allowing EventReg's legacy modal
 * and the future Checkout modal to share one implementation.
 */
export default function TicketTypesEditor({
  ticketTypes = [],
  globalDependentFieldMappings = {},
  onChange,
  t,
  required = false,
}) {
  const updateTicket = (index, changes) => {
    const previousTicket = ticketTypes[index];
    const types = [...ticketTypes];
    types[index] = { ...previousTicket, ...changes };

    const mappings = { ...globalDependentFieldMappings };
    if (
      !previousTicket?._id &&
      Object.hasOwn(changes, "name") &&
      previousTicket?.name &&
      previousTicket.name !== changes.name &&
      mappings[previousTicket.name] !== undefined
    ) {
      mappings[changes.name] = mappings[previousTicket.name];
      delete mappings[previousTicket.name];
    }

    onChange({ ticketTypes: types, globalDependentFieldMappings: mappings });
  };

  const moveTicket = (index, direction) => {
    const types = [...ticketTypes];
    const nextIndex = index + direction;
    [types[index], types[nextIndex]] = [types[nextIndex], types[index]];
    onChange({ ticketTypes: types });
  };

  return (
    <>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        {t.ticketTypes}{required ? " *" : ""}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
        {t.isPaidEventDescription}
      </Typography>

      {ticketTypes.map((ticketType, index) => (
        <Paper key={ticketType._id || index} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Stack direction="row" sx={{ mb: 1.5, justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" fontWeight={600}>#{index + 1}</Typography>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <Tooltip title={t.moveUp}>
                <span>
                  <IconButton size="small" disabled={index === 0} onClick={() => moveTicket(index, -1)}>
                    <ICONS.up fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={t.moveDown}>
                <span>
                  <IconButton
                    size="small"
                    disabled={index === ticketTypes.length - 1}
                    onClick={() => moveTicket(index, 1)}
                  >
                    <ICONS.down fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={t.removeTicket}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onChange({ ticketTypes: ticketTypes.filter((_, itemIndex) => itemIndex !== index) })}
                >
                  <ICONS.delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 200px" }}>
              <TextField fullWidth size="small" label={t.ticketName} required value={ticketType.name}
                onChange={(event) => updateTicket(index, { name: event.target.value })} />
            </Box>
            <Box sx={{ flex: "1 1 200px" }}>
              <TextField fullWidth size="small" label={t.ticketPrice} required type="number"
                slotProps={{ htmlInput: { min: 0, step: 0.1 } }} value={ticketType.price}
                onChange={(event) => updateTicket(index, { price: event.target.value })} />
            </Box>
            <Box sx={{ flex: "1 1 200px" }}>
              <TextField fullWidth size="small" label={t.ticketCapacity} type="number"
                slotProps={{ htmlInput: { min: 1 } }} value={ticketType.capacity}
                onChange={(event) => updateTicket(index, { capacity: event.target.value })} />
            </Box>
            <Box sx={{ flex: "1 1 200px" }}>
              <TextField fullWidth size="small" label={t.ticketDescription} value={ticketType.description}
                onChange={(event) => updateTicket(index, { description: event.target.value })} />
            </Box>
          </Box>
        </Paper>
      ))}

      <Button
        variant="outlined"
        size="small"
        onClick={() => onChange({ ticketTypes: [...ticketTypes, emptyTicketType] })}
      >
        + {t.addTicketType}
      </Button>
    </>
  );
}
