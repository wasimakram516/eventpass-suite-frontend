"use client";

import ThemeRegistry from "@/styles/themeRegistry";
import { MessageProvider } from "@/contexts/MessageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ClientLayout from "@/utils/ClientLayout";
import { GlobalConfigProvider } from "@/contexts/GlobalConfigContext";
import Script from "next/script";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useEffect } from "react";

export default function ClientRoot({ children }) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const userAgent = window.navigator.userAgent || "";
    const isAndroidWebView =
      /Android/i.test(userAgent) &&
      (/\bwv\b/i.test(userAgent) || /; wv\)/i.test(userAgent));

    const root = document.documentElement;
    root.classList.toggle("android-webview", isAndroidWebView);

    return () => {
      root.classList.remove("android-webview");
    };
  }, []);

  return (
    <>
      <LanguageProvider>
        <MessageProvider>
          <GlobalConfigProvider>
            <ThemeRegistry>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <AuthProvider>
                  <ClientLayout>{children}</ClientLayout>
                </AuthProvider>
              </LocalizationProvider>
            </ThemeRegistry>
          </GlobalConfigProvider>
        </MessageProvider>
      </LanguageProvider>

      <Script src="/BrowserPrint-3.1.250.min.js" strategy="afterInteractive" />
      <Script
        src="/BrowserPrint-Zebra-1.1.250.min.js"
        strategy="afterInteractive"
      />
    </>
  );
}
