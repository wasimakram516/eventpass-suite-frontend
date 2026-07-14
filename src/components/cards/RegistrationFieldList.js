"use client";

import { useState } from "react";
import { Box, Button } from "@mui/material";
import RegistrationFieldRow from "./RegistrationFieldRow";
import ICONS from "@/utils/iconUtil";

const VISIBLE_COUNT = 5;

const translations = {
  en: {
    showMore: (count) => `Show ${count} more`,
    showLess: "Show less",
  },
  ar: {
    showMore: (count) => `عرض ${count} المزيد`,
    showLess: "عرض أقل",
  },
};

// Renders a registration's fields as RegistrationFieldRows, collapsing to
// VISIBLE_COUNT with a Show more/less toggle once a card has too many
// fields to stay a reasonable height.
export default function RegistrationFieldList({ fields, dir = "ltr", language = "en" }) {
  const [expanded, setExpanded] = useState(false);
  const t = translations[language] || translations.en;
  const hasMore = fields.length > VISIBLE_COUNT;
  const visibleFields = expanded ? fields : fields.slice(0, VISIBLE_COUNT);

  return (
    <Box>
      {visibleFields.map((f) => (
        <RegistrationFieldRow key={f.key} label={f.label} value={f.value} dir={dir} />
      ))}
      {hasMore && (
        <Button
          size="small"
          onClick={() => setExpanded((e) => !e)}
          endIcon={expanded ? <ICONS.expandLess fontSize="small" /> : <ICONS.expandMore fontSize="small" />}
          sx={{ mt: 1, px: 0, minWidth: 0, textTransform: "none", fontWeight: 600 }}
        >
          {expanded ? t.showLess : t.showMore(fields.length - VISIBLE_COUNT)}
        </Button>
      )}
    </Box>
  );
}
