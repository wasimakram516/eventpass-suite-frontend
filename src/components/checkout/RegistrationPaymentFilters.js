"use client";

import { FormControl, InputLabel, MenuItem, Select, Stack } from "@mui/material";

export default function RegistrationPaymentFilters({ filters, ticketTypes = [], onChange, labels = {} }) {
  const t = {
    paymentStatus: "Payment status",
    ticketType: "Ticket type",
    allPaymentStatuses: "All payment statuses",
    allTicketTypes: "All ticket types",
    paid: "Paid",
    pending: "Pending",
    external: "External",
    cancelled: "Cancelled",
    failed: "Failed",
    ...labels,
  };
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>{t.paymentStatus}</InputLabel>
        <Select label={t.paymentStatus} value={filters.paymentStatus || "all"} onChange={(event) => onChange("paymentStatus", event.target.value)}>
          <MenuItem value="all">{t.allPaymentStatuses}</MenuItem>
          <MenuItem value="paid">{t.paid}</MenuItem>
          <MenuItem value="pending">{t.pending}</MenuItem>
          <MenuItem value="external">{t.external}</MenuItem>
          <MenuItem value="cancelled">{t.cancelled}</MenuItem>
          <MenuItem value="failed">{t.failed}</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>{t.ticketType}</InputLabel>
        <Select label={t.ticketType} value={filters.ticketTypeId || "all"} onChange={(event) => onChange("ticketTypeId", event.target.value)}>
          <MenuItem value="all">{t.allTicketTypes}</MenuItem>
          {ticketTypes.map((ticket) => <MenuItem key={ticket._id} value={ticket._id}>{ticket.name}</MenuItem>)}
        </Select>
      </FormControl>
    </Stack>
  );
}
