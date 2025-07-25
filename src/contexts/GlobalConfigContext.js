"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getGlobalConfig } from "@/services/globalConfigService";

const GlobalConfigContext = createContext();

export const GlobalConfigProvider = ({ children }) => {
  const [globalConfig, setGlobalConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getGlobalConfig();
      setGlobalConfig(data);
    } catch (error) {
      console.error("Failed to load global config", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchConfig();
  }, [refetchConfig]);

  return (
    <GlobalConfigContext.Provider
      value={{ globalConfig, setGlobalConfig, refetchConfig, loading }}
    >
      {children}
    </GlobalConfigContext.Provider>
  );
};

export const useGlobalConfig = () => useContext(GlobalConfigContext);
