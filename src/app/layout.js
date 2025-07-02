import "../styles/globals.css";
import ThemeRegistry from "@/styles/themeRegistry";
import { MessageProvider } from "@/contexts/MessageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ClientLayout from "@/utils/ClientLayout";

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
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#033649" />
        <link rel="icon" href="/favicon.ico" type="image/png" />
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords} />
        <meta name="author" content={metadata.author} />
      </head>
      <body>
        <LanguageProvider>
          <ThemeRegistry>
            <AuthProvider>
              <MessageProvider>
                <ClientLayout>{children}</ClientLayout>
              </MessageProvider>
            </AuthProvider>
          </ThemeRegistry>
        </LanguageProvider>
      </body>
    </html>
  );
}
