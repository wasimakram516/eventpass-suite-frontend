"use client";

import { Box, Typography } from "@mui/material";
import ICONS from "@/utils/iconUtil";
import { formatOmr } from "@/utils/paymentBreakdown";

const defaultLabels = {
  ticket: "Ticket",
  discount: "Discount",
  subtotal: "Subtotal",
  vat: "VAT",
  total: "Total",
  amountDue: "Amount due",
  securePayment: "Secure payment via Thawani",
};

/**
 * Shared checkout amount display. Promo-code entry remains a caller concern;
 * this component receives it as a slot so every checkout surface displays the
 * same calculated ticket, discount, fee, VAT and total lines.
 */
export default function PaymentBreakdown({
  breakdown,
  ticketName,
  currency = "OMR",
  labels = {},
  promoCodeControl = null,
  footer = null,
}) {
  if (!breakdown) return null;

  const text = { ...defaultLabels, ...labels };
  const money = (amount) => formatOmr(amount, currency);

  return (
    <Box>
      {promoCodeControl && <Box sx={{ mb: 2 }}>{promoCodeControl}</Box>}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body1" fontWeight={700} noWrap>{ticketName || text.ticket}</Typography>
          <Typography variant="caption" color="text.secondary">{text.ticket}</Typography>
        </Box>
        <Typography variant="body1" fontWeight={700} sx={{ whiteSpace: "nowrap", pl: 1 }}>
          {money(breakdown.base)}
        </Typography>
      </Box>

      {breakdown.discountAmount > 0 && (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.6 }}>
          <Typography variant="body2" color="success.main">
            {text.discount}{breakdown.discountPercentage ? ` · ${breakdown.discountPercentage}%` : ""}
          </Typography>
          <Typography variant="body2" color="success.main" sx={{ whiteSpace: "nowrap", pl: 1 }}>
            -{money(breakdown.discountAmount)}
          </Typography>
        </Box>
      )}

      {breakdown.feeLines.map((fee, index) => (
        <Box key={`${fee.name}-${index}`} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.6 }}>
          <Typography variant="body2" color="text.secondary">{fee.name} · {fee.percentage}%</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap", pl: 1 }}>
            {money(fee.amount)}
          </Typography>
        </Box>
      ))}

      {(breakdown.feeLines.length > 0 || breakdown.vatAmount > 0) && (
        <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.9, mt: 0.5, borderTop: "1px dashed", borderColor: "divider" }}>
          <Typography variant="body2" color="text.secondary">{text.subtotal}</Typography>
          <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: "nowrap", pl: 1 }}>{money(breakdown.subtotal)}</Typography>
        </Box>
      )}

      {breakdown.vatAmount > 0 && (
        <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.6 }}>
          <Typography variant="body2" color="text.secondary">{text.vat} · {breakdown.vatPercentage}%</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap", pl: 1 }}>{money(breakdown.vatAmount)}</Typography>
        </Box>
      )}

      <Box sx={{
        mt: 1.5, px: 2, py: 1.5, borderRadius: 2.5,
        backgroundColor: (theme) => theme.palette.overlay.infoCard,
        border: (theme) => `1px solid ${theme.palette.overlay.infoCardBorder}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>{text.amountDue}</Typography>
          <Typography variant="subtitle1" fontWeight={800}>{text.total}</Typography>
        </Box>
        <Typography variant="h6" fontWeight={800} color="primary.dark" sx={{ whiteSpace: "nowrap", pl: 1 }}>{money(breakdown.total)}</Typography>
      </Box>

      {footer || (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, mt: 2 }}>
          <ICONS.verified sx={{ fontSize: 16, color: "success.main" }} />
          <Typography variant="caption" color="text.secondary">{text.securePayment}</Typography>
        </Box>
      )}
    </Box>
  );
}
