"use client";

import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import useI18nLayout from "@/hooks/useI18nLayout";
import ICONS from "@/utils/iconUtil";
import getStartIconSpacing from "@/utils/getStartIconSpacing";
import { splitTemplateBody } from "@/utils/whatsappMessages";

const translations = {
  en: { more: "Show more", less: "Show less" },
  ar: { more: "عرض المزيد", less: "عرض أقل" },
};

// Bodies longer than this many characters start collapsed.
const COLLAPSE_AFTER_CHARS = 220;

/**
 * A WhatsApp template body with its {{n}} slots highlighted. Long bodies are
 * clamped to a few lines with a Show more toggle.
 *
 * @param {object} props
 * @param {string} props.body
 * @param {number} [props.lines] - Visible lines while collapsed
 * @returns {JSX.Element}
 */
export default function TemplateBody({ body, lines = 5 }) {
  const { t, dir } = useI18nLayout(translations);
  const [expanded, setExpanded] = useState(false);
  const collapsible = String(body || "").length > COLLAPSE_AFTER_CHARS;
  const clamped = collapsible && !expanded;

  return (
    <Box>
      <Typography
        variant="body2"
        component="div"
        sx={{
          whiteSpace: "pre-wrap",
          color: "text.secondary",
          ...(clamped && {
            display: "-webkit-box",
            WebkitLineClamp: lines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }),
        }}
      >
        {splitTemplateBody(body).map((part, index) =>
          part.slot ? (
            <Box
              key={index}
              component="span"
              sx={(theme) => ({
                px: 0.5,
                borderRadius: 1,
                fontFamily: "monospace",
                fontWeight: 600,
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.action.hover,
              })}
            >
              {part.text}
            </Box>
          ) : (
            <span key={index}>{part.text}</span>
          )
        )}
      </Typography>
      {collapsible && (
        <Button
          size="small"
          onClick={() => setExpanded((value) => !value)}
          startIcon={expanded ? <ICONS.expandLess /> : <ICONS.expandMore />}
          sx={{ px: 0.5, mt: 0.5, ...getStartIconSpacing(dir) }}
        >
          {expanded ? t.less : t.more}
        </Button>
      )}
    </Box>
  );
}
