import "../styles/globals.css";
import ClientRoot from "./ClientRoot";

export const metadata = {
  title: "EventPass – WhiteWall",
  description:
    "EventPass by WhiteWall is a unified platform for live event engagement, including interactive quizzes, polls, audience questions, photo walls, registration, and check-in tools.",
  keywords:
    "EventPass, Quiznest, VoteCast, EventDuel, StageQ, MemoryWall, EventReg, Check-In, Event Wheel, Live Engagement, WhiteWall Digital Solutions",
  openGraph: {
    title: "EventPass – WhiteWall",
    description:
      "Engage your audience with quizzes, polls, questions, photo walls, registration, and check-in tools – all in one platform.",
    url: "https://eventpass.whitewall.solutions",
    siteName: "EventPass",
    images: [
      {
        url: "/WW.png",
        width: 512,
        height: 512,
        alt: "EventPass by WhiteWall",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EventPass – WhiteWall",
    description:
      "Engage your audience with quizzes, polls, questions, photo walls, registration, and check-in tools.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
