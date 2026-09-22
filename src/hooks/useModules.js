"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getModules } from "@/services/moduleService";
import { hasModuleAccess } from "@/hooks/usePermission";

export function useModules(user, options = {}) {
  const {
    fetchFullCatalog = true,
    filterByRole = true,
  } = options;

  const [modules, setModules] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moduleLabelsById, setModuleLabelsById] = useState({});

  const loadModules = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const role = user?.role || "staff";
      
      if (fetchFullCatalog) {
        const allPayload = await getModules();
        const allList = Array.isArray(allPayload) ? allPayload : [];
        setAllModules(allList);
        const labelsById = {};
        allList.forEach((m) => { labelsById[m.key] = m.labels || {}; });
        setModuleLabelsById(labelsById);
      }
      
      const payload = await getModules(role);
      const list = Array.isArray(payload) ? payload : [];
      
      let permitted = list;
      if (filterByRole) {
        const needsBusinessSetup =
          user?.role === "business" &&
          !user?.business?._id &&
          !user?.businessId;
          
        permitted = user?.role === "superadmin"
          ? list
          : user?.role === "admin"
            ? list.filter((m) => hasModuleAccess(user, m.key))
            : needsBusinessSetup
              ? []
              : list.filter((m) => hasModuleAccess(user, m.key));
      }
      
      setModules(permitted);
    } catch (err) {
      setError(err);
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [user, fetchFullCatalog, filterByRole]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  return {
    modules,
    allModules,
    moduleLabelsById,
    loading,
    error,
    refetch: loadModules,
  };
}

export function useModuleCategories(modules, groupByModuleCategory) {
  return useMemo(() => {
    const core = modules.filter((m) => m.isCore);
    const rest = modules.filter((m) => !m.isCore);
    return { coreModules: core, groupedByCategory: groupByModuleCategory(rest) };
  }, [modules, groupByModuleCategory]);
}