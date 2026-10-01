"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getGlobalConfig, getFonts, syncFonts } from "@/services/globalConfigService";
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

  const loadFonts = useCallback(async () => {
    try {
      setFontsLoading(true);
      await getFonts();
      setFonts(getSelectableFonts());
    } catch (error) {
      console.error("Failed to fetch fonts, using local registered fonts:", error);
      setFonts(getSelectableFonts());
    } finally {
      setFontsLoading(false);
    }
  }, []);

  const syncFontsToDB = useCallback(async () => {
    const result = await syncFonts(getSelectableFonts());
    return result;
  }, []);

  useEffect(() => {
    refetchConfig();
    loadFonts();
  }, [refetchConfig, loadFonts]);

  return (
    <GlobalConfigContext.Provider
      value={{ globalConfig, setGlobalConfig, refetchConfig, loading, fonts, fontsLoading, syncFontsToDB }}
    >
      {children}
    </GlobalConfigContext.Provider>
  );
};

export const useGlobalConfig = () => useContext(GlobalConfigContext);
