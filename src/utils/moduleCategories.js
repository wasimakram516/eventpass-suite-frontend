// Modules that consume EventReg's attendee data, listed on the Core Module
// banner. Keys only — labels are resolved from the module payload, so they
// can't drift from the backend catalog.
export const ATTENDEE_DATA_CONSUMER_KEYS = [
  "checkin",
  "digipass",
  "surveyguru",
  "quiznest",
  "eventduel",
  "crosszero",
  "tapmatch",
  "eventwheel",
];

export const OTHER_MODULE_CATEGORY = Object.freeze({
  id: "other",
  labels: Object.freeze({ en: "Other", ar: "أخرى" }),
  sort: 99,
});

export function groupByModuleCategory(items, getCategory = (item) => item?.category) {
  const groups = new Map();

  items.forEach((item) => {
    const category = getCategory(item) || OTHER_MODULE_CATEGORY;
    const id = category.id || OTHER_MODULE_CATEGORY.id;
    if (!groups.has(id)) groups.set(id, { category, items: [] });
    groups.get(id).items.push(item);
  });

  return [...groups.values()].sort(
    (a, b) => (a.category.sort ?? OTHER_MODULE_CATEGORY.sort) - (b.category.sort ?? OTHER_MODULE_CATEGORY.sort),
  );
}

export function getCategoryLabel(category, language) {
  const resolved = category || OTHER_MODULE_CATEGORY;
  return resolved.labels?.[language] ?? resolved.labels?.en ?? resolved.id;
}

// Category presentation metadata (icon name + description) — the server payload
// only carries { id, labels, sort }, so visuals live here. Falls back to a
// generic tile for unknown/other categories.
// Icon names map to @mui/icons-material exports.
const CATEGORY_META = {
  "event-ops": {
    iconName: "EventAvailableOutlined",
    descriptions: {
      en: "Core event operations: registration, check-in, and digital passes.",
      ar: "عمليات الفعالية الأساسية: التسجيل، تسجيل الدخول، والتذاكر الرقمية.",
    },
  },
  engagement: {
    iconName: "CampaignOutlined",
    descriptions: {
      en: "Live audience tools: polls, questions, and interactive walls.",
      ar: "أدوات جمهور مباشرة: استطلاعات، أسئلة، وجدران تفاعلية.",
    },
  },
  games: {
    iconName: "SportsEsportsOutlined",
    descriptions: {
      en: "Gamified experiences: quizzes, duels, and prize wheels.",
      ar: "تجارب ألعاب تفاعلية: اختبارات، مبارزات، وعجلات الجوائز.",
    },
  },
  "post-event": {
    iconName: "MarkEmailReadOutlined",
    descriptions: {
      en: "Follow-up after the event: surveys and thank-you emails.",
      ar: "المتابعة بعد الفعالية: الاستبيانات ورسائل الشكر.",
    },
  },
};

const FALLBACK_CATEGORY_META = {
  iconName: "CategoryOutlined",
  descriptions: {
    en: "Additional modules and tools.",
    ar: "وحدات وأدوات إضافية.",
  },
};

export function getCategoryMeta(categoryId) {
  return CATEGORY_META[categoryId] || FALLBACK_CATEGORY_META;
}
