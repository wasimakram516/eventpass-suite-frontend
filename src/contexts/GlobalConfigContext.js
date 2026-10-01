"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getGlobalConfig } from "@/services/globalConfigService";
import { getSelectableFonts } from "@/utils/fontRegistry";

const GlobalConfigContext = createContext();

export const GlobalConfigProvider = ({ children }) => {
  const [globalConfig, setGlobalConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fonts, setFonts] = useState([]);
  const [fontsLoading, setFontsLoading] = useState(true);

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

  const loadFonts = useCallback(() => {
    setFontsLoading(true);
    setFonts(getSelectableFonts());
    setFontsLoading(false);
  }, []);

  useEffect(() => {
    refetchConfig();
    loadFonts();
  }, [refetchConfig, loadFonts]);

  return (
    <GlobalConfigContext.Provider
      value={{ globalConfig, setGlobalConfig, refetchConfig, loading, fonts, fontsLoading }}
    >
      {children}
    </GlobalConfigContext.Provider>
  );
};

export const useGlobalConfig = () => useContext(GlobalConfigContext);
