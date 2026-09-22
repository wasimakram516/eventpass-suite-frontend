"use client";

import { useMemo, useDeferredValue } from "react";

export function useModuleSearch({ groupedByCategory, searchQuery, language }) {
  const deferredSearchQuery = useDeferredValue(searchQuery || "");

  const searchFilteredGroups = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLocaleLowerCase();
    if (!normalizedQuery) return groupedByCategory;

    return groupedByCategory
      .map((group) => ({
        ...group,
        items: group.items.filter((module) => {
          const name = module.labels?.[language] ?? module.labels?.en ?? module.key;
          return name.toLocaleLowerCase().includes(normalizedQuery);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [groupedByCategory, language, deferredSearchQuery]);

  const normalizedQuery = deferredSearchQuery.trim().toLocaleLowerCase();

  return {
    searchFilteredGroups,
    deferredSearchQuery,
    normalizedQuery,
  };
}