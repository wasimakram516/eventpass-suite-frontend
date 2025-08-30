import "../styles/globals.css";
import ThemeRegistry from "@/styles/themeRegistry";
import { MessageProvider } from "@/contexts/MessageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ClientLayout from "@/utils/ClientLayout";
import { GlobalConfigProvider } from "@/contexts/GlobalConfigContext";
import Script from "next/script"; 

export const metadata = {
  title: "EventPass – WhiteWall",
  description:
    "EventPass by WhiteWall is a unified platform for live event engagement, including interactive quizzes, polls, audience questions, photo walls, registration, and check-in tools.",
  keywords:
    "EventPass, Quiznest, VoteCast, EventDuel, StageQ, MosaicWall, EventReg, Check-In, Event Wheel, Live Engagement, WhiteWall Digital Solutions",
  author: "WhiteWall Digital Solutions",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#033649" />
        <link rel="icon" href="/favicon.ico" type="image/png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords} />
        <meta name="author" content={metadata.author} />
      </head>
      <body>
        <LanguageProvider>
          <MessageProvider>
            <GlobalConfigProvider>
              <ThemeRegistry>
                <AuthProvider>
                  <ClientLayout>{children}</ClientLayout>
                </AuthProvider>
              </ThemeRegistry>
            </GlobalConfigProvider>
          </MessageProvider>
        </LanguageProvider>

        {/* Browser Print Files*/}
        <Script src="/BrowserPrint-3.1.250.min.js" strategy="afterInteractive" />
        <Script src="/BrowserPrint-Zebra-1.1.250.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
