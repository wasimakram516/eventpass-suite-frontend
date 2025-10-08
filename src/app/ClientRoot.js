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

export default function ClientRoot({ children }) {
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
