export const OTHER_MODULE_CATEGORY = Object.freeze({
  id: "other",
  labels: { en: "Other", ar: "أخرى" },
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
