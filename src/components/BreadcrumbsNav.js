"use client";

import { Breadcrumbs, Link, Box } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

import ICONS from "@/utils/iconUtil";
import { capitalize } from "@/utils/stringUtil";

const segmentMap = {
  dashboard: {
    label: "Dashboard",
    icon: <ICONS.home fontSize="small" sx={{ mr: 0.5 }} />,
  },
  businesses: {
    label: "Businesses",
    icon: <ICONS.business fontSize="small" sx={{ mr: 0.5 }} />,
  },
  polls: {
    label: "Polls",
    icon: <ICONS.poll fontSize="small" sx={{ mr: 0.5 }} />,
  },
  manage: {
    label: "Manage Polls",
    icon: <ICONS.poll fontSize="small" sx={{ mr: 0.5 }} />,
  },
  results: {
    label: "Poll Results",
    icon: <ICONS.results fontSize="small" sx={{ mr: 0.5 }} />,
  },
  users: {
    label: "Users",
    icon: <ICONS.peopleAlt fontSize="small" sx={{ mr: 0.5 }} />,
  },
  games: {
    label: "Games",
    icon: <ICONS.games fontSize="small" sx={{ mr: 0.5 }} />,
  },
  questions: {
    label: "All Questions",
    icon: <ICONS.forum fontSize="small" sx={{ mr: 0.5 }} />,
  },
  queries: {
    label: "Queries",
    icon: <ICONS.info fontSize="small" sx={{ mr: 0.5 }} />,
  },
  "share-link": {
    label: "Share Link",
    icon: <ICONS.share fontSize="small" sx={{ mr: 0.5 }} />,
  },
  visitors: {
    label: "Visitors",
    icon: <ICONS.people fontSize="small" sx={{ mr: 0.5 }} />,
  },

  // CMS Modules
  modules: {
    label: "Modules",
    icon: <ICONS.module fontSize="small" sx={{ mr: 0.5 }} />,
  },

  quiznest: {
    label: "QuizNest",
    icon: <ICONS.quiz fontSize="small" sx={{ mr: 0.5 }} />,
  },
  eventduel: {
    label: "Event Duel",
    icon: <ICONS.games fontSize="small" sx={{ mr: 0.5 }} />,
  },
  votecast: {
    label: "VoteCast",
    icon: <ICONS.poll fontSize="small" sx={{ mr: 0.5 }} />,
  },
  stageq: {
    label: "StageQ",
    icon: <ICONS.forum fontSize="small" sx={{ mr: 0.5 }} />,
  },
  mosaicwall: {
    label: "MosaicWall",
    icon: <ICONS.image fontSize="small" sx={{ mr: 0.5 }} />,
  },
  eventreg: {
    label: "Event Reg",
    icon: <ICONS.assignment fontSize="small" sx={{ mr: 0.5 }} />,
  },
  checkin: {
    label: "Check-In",
    icon: <ICONS.checkin fontSize="small" sx={{ mr: 0.5 }} />,
  },
  eventwheel: {
    label: "Event Wheel",
    icon: <ICONS.trophy fontSize="small" sx={{ mr: 0.5 }} />,
  },
  
  // Sub pages
  events: {
    label: "Events",
    icon: <ICONS.event fontSize="small" sx={{ mr: 0.5 }} />,
  },
  registrations: {
  label: "Registrations",
  icon: <ICONS.appRegister fontSize="small" sx={{ mr: 0.5 }} />,
},
walls: {
  label: "Media Walls",
  icon: <ICONS.cast fontSize="small" sx={{ mr: 0.5 }} />,
},
 uploads: {
  label: "Media Uploads",
  icon: <ICONS.upload fontSize="small" sx={{ mr: 0.5 }} />,
},

};

const formatSegment = (seg) => {
  if (segmentMap[seg]) {
    const { icon, label } = segmentMap[seg];
    return (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {icon}
        <span>{label}</span>
      </Box>
    );
  }
  return capitalize(seg.replace(/-/g, " "));
};

export default function BreadcrumbsNav() {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split("/").filter((seg) => seg && seg !== "cms");

  const paths = segments.map((seg, i) => ({
    segment: seg,
    href: "/cms/" + segments.slice(0, i + 1).join("/"),
  }));

  return (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs separator="›" aria-label="breadcrumb">
        <Link
          underline="hover"
          color="inherit"
          href="/cms"
          onClick={(e) => {
            e.preventDefault();
            router.push("/cms");
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ICONS.home fontSize="small" sx={{ mr: 0.5 }} />
            Dashboard
          </Box>
        </Link>

        {paths.map((p, i) => {
          const segment = formatSegment(p.segment);
          const isLast = i === paths.length - 1;

          return isLast ? (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "center",
                color: "text.primary",
                fontWeight: "bold",
              }}
            >
              {segment}
            </Box>
          ) : (
            <Link
              key={i}
              underline="hover"
              color="inherit"
              href={p.href}
              onClick={(e) => {
                e.preventDefault();
                router.push(p.href);
              }}
              sx={{ display: "flex", alignItems: "center" }}
            >
              {segment}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
