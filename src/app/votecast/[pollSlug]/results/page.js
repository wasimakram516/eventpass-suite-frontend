"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import LanguageSelector from "@/components/LanguageSelector";
import {
  Box,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getPublicPollBySlug, getPollResults } from "@/services/votecast/pollService";
import useI18nLayout from "@/hooks/useI18nLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import AppCard from "@/components/cards/AppCard";
import NoDataAvailable from "@/components/NoDataAvailable";
import { toArabicDigits } from "@/utils/arabicDigits";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57",
  "#9e9e9e",
  "#ba68c8",
  "#4dd0e1",
  "#f06292",
];

const NPS_GROUP_COLORS = {
  detractors: "#ef5350",
  passives: "#ffc107",
  promoters: "#66bb6a",
};

const translations = {
  en: {
    pollNotFound: "Poll not found",
    noResults: "No results available.",
    totalVotes: "votes",
    average: "Average",
    npsScore: "NPS Score",
    detractors: "Detractors (0-6)",
    passives: "Passives (7-8)",
    promoters: "Promoters (9-10)",
  },
  ar: {
    pollNotFound: "الاستطلاع غير موجود",
    noResults: "لا توجد نتائج متاحة.",
    totalVotes: "أصوات",
    average: "المتوسط",
    npsScore: "نتيجة NPS",
    detractors: "المُنافقون (0-6)",
    passives: "السلبيون (7-8)",
    promoters: "المروجون (9-10)",
  },
};

function LegendDot({ color, label, count, total, language }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
      }}
    >
      <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
      <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
        {toArabicDigits(count, language)} ({toArabicDigits(pct, language)}%)
      </Typography>
    </Box>
  );
}

function RatingCard({ question, dir, t, language }) {
  const { distribution, totalVotes, average, scale } = question;
  const data = distribution.filter((d) => d.count > 0);
  if (data.length === 0) return null;

  return (
    <AppCard sx={{ width: "100%", display: "flex", flexDirection: "column", height: "100%" }} dir={dir}>
      <Box sx={{ p: 2, pb: 0, flexShrink: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: "center", mb: 0.5 }}>
          {question.question}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", display: "block", direction: "ltr" }}>
          {t.average}: {toArabicDigits(average, language)} / {toArabicDigits(scale?.max || 5, language)}
        </Typography>
      </Box>

      <Box sx={{ width: "100%", height: 200, flexShrink: 0, "& svg:focus": { outline: "none" } }} dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="value"
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={40}
              labelLine={false}
              label={({ percent }) => toArabicDigits(`${(percent * 100).toFixed(0)}%`, language)}
              style={{ fontSize: "14px", fontWeight: 600 }}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${toArabicDigits(value, language)} votes`, `Rating ${toArabicDigits(name, language)}`]} />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      <Divider sx={{ mx: 2 }} />

      <Box sx={{ px: 2, py: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
        {data.map((d, i) => (
          <LegendDot
            key={d.value}
            color={COLORS[i % COLORS.length]}
            label={`${toArabicDigits(d.value, language)} / ${toArabicDigits(scale?.max || 5, language)}`}
            count={d.count}
            total={totalVotes}
            language={language}
          />
        ))}
      </Box>

      <Divider sx={{ mx: 2 }} />

      <Box sx={{ px: 2, py: 1, display: "flex", justifyContent: "center", mt: "auto" }}>
        <Typography variant="body2" sx={{ color: "text.secondary", direction: "ltr", textAlign: "center" }}>
          {toArabicDigits(totalVotes, language)} {t.totalVotes}
        </Typography>
      </Box>
    </AppCard>
  );
}

function NpsCard({ question, dir, t, language }) {
  const { distribution, totalVotes, npsScore } = question;

  const groupData = useMemo(() => {
    if (!distribution || totalVotes === 0) return [];
    const detractors = distribution.filter((d) => d.value >= 0 && d.value <= 6).reduce((s, d) => s + d.count, 0);
    const passives = distribution.filter((d) => d.value >= 7 && d.value <= 8).reduce((s, d) => s + d.count, 0);
    const promoters = distribution.filter((d) => d.value >= 9 && d.value <= 10).reduce((s, d) => s + d.count, 0);
    const result = [];
    if (detractors > 0) result.push({ name: t.detractors, value: detractors, color: NPS_GROUP_COLORS.detractors });
    if (passives > 0) result.push({ name: t.passives, value: passives, color: NPS_GROUP_COLORS.passives });
    if (promoters > 0) result.push({ name: t.promoters, value: promoters, color: NPS_GROUP_COLORS.promoters });
    return result;
  }, [distribution, totalVotes, t]);

  if (groupData.length === 0) return null;

  const scoreColor = npsScore >= 0 ? "success.main" : "error.main";

  return (
    <AppCard sx={{ width: "100%", display: "flex", flexDirection: "column", height: "100%" }} dir={dir}>
      <Box sx={{ p: 2, pb: 0, flexShrink: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: "center", mb: 0.5 }}>
          {question.question}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, textAlign: "center", color: scoreColor, direction: "ltr" }}>
          {npsScore > 0 ? "+" : ""}{toArabicDigits(npsScore, language)}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", display: "block", fontWeight: 600 }}>
          {t.npsScore}
        </Typography>
      </Box>

      <Box sx={{ width: "100%", height: 200, flexShrink: 0, "& svg:focus": { outline: "none" } }} dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={groupData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={40}
              labelLine={false}
              label={({ percent }) => toArabicDigits(`${(percent * 100).toFixed(0)}%`, language)}
              style={{ fontSize: "14px", fontWeight: 600 }}
            >
              {groupData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${toArabicDigits(value, language)} votes`, name]} />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      <Divider sx={{ mx: 2 }} />

      <Box sx={{ px: 2, py: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
        {groupData.map((d) => (
          <LegendDot
            key={d.name}
            color={d.color}
            label={d.name}
            count={d.value}
            total={totalVotes}
            language={language}
          />
        ))}
      </Box>

      <Divider sx={{ mx: 2 }} />

      <Box sx={{ px: 2, py: 1, display: "flex", justifyContent: "center", mt: "auto" }}>
        <Typography variant="body2" sx={{ color: "text.secondary", direction: "ltr", textAlign: "center" }}>
          {toArabicDigits(totalVotes, language)} {t.totalVotes}
        </Typography>
      </Box>
    </AppCard>
  );
}

function OptionCard({ question, dir, t, language }) {
  const { options, totalVotes } = question;
  const data = (options || []).filter((o) => o.votes > 0);
  if (data.length === 0) return null;

  return (
    <AppCard sx={{ width: "100%", display: "flex", flexDirection: "column", height: "100%" }} dir={dir}>
      <Box sx={{ p: 2, pb: 0, flexShrink: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: "center" }}>
          {question.question}
        </Typography>
      </Box>

      <Box sx={{ width: "100%", height: 200, flexShrink: 0, "& svg:focus": { outline: "none" } }} dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="votes"
              nameKey="text"
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={40}
              labelLine={false}
              label={({ percent }) => toArabicDigits(`${(percent * 100).toFixed(0)}%`, language)}
              style={{ fontSize: "14px", fontWeight: 600 }}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${toArabicDigits(value, language)} votes`, name]} />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      <Divider sx={{ mx: 2 }} />

      <Box sx={{ px: 2, py: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
        {data.map((o, i) => (
          <LegendDot
            key={i}
            color={COLORS[i % COLORS.length]}
            label={o.text || `Option ${toArabicDigits(i + 1, language)}`}
            count={o.votes}
            total={totalVotes}
            language={language}
          />
        ))}
      </Box>

      <Divider sx={{ mx: 2 }} />

      <Box sx={{ px: 2, py: 1, display: "flex", justifyContent: "center", mt: "auto" }}>
        <Typography variant="body2" sx={{ color: "text.secondary", direction: "ltr", textAlign: "center" }}>
          {toArabicDigits(totalVotes, language)} {t.totalVotes}
        </Typography>
      </Box>
    </AppCard>
  );
}

export default function FullScreenResultsPage() {
  const { pollSlug } = useParams();
  const { t, dir } = useI18nLayout(translations);
  const { language } = useLanguage();
  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pollSlug) return;
    const init = async () => {
      setLoading(true);
      const pollData = await getPublicPollBySlug(pollSlug);
      if (!pollData || pollData.error) {
        setLoading(false);
        return;
      }
      setPoll(pollData);
      const resData = await getPollResults(pollData._id);
      setResults(Array.isArray(resData) ? resData : []);
      setLoading(false);
    };
    init();
  }, [pollSlug]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!poll) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Typography variant="h6" color="error">{t.pollNotFound}</Typography>
      </Box>
    );
  }

  const displayQuestions = results.filter(
    (q) => q.type === "rating" || q.type === "nps" || q.type === "options" || q.type === "option" || q.type === "slider"
  );

  return (
    <>
      <Box
        dir={dir}
        sx={{
          minHeight: "100vh",
          backgroundColor: "#f9f9f9",
          pt: { xs: 3, md: 4 },
          px: { xs: 1.5, md: 4 },
          pb: 4,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            px: 0.5,
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
              }}
            >
              {poll.title}
            </Typography>
            {poll.description && (
              <Typography
                variant="body2"
                component="div"
                sx={{
                  color: "text.secondary",
                }}
                dangerouslySetInnerHTML={{ __html: poll.description }}
              />
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
            {poll.logoUrl && (
              <Box
                component="img"
                src={poll.logoUrl}
                alt={poll.title}
                sx={{
                  width: { xs: 56, md: 80 },
                  height: { xs: 56, md: 80 },
                  objectFit: "contain",
                }}
              />
            )}
            <LanguageSelector />
          </Box>
        </Box>

        {/* Cards Grid */}
        {displayQuestions.length === 0 ? (
          <NoDataAvailable />
        ) : (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 2,
            }}
          >
            {displayQuestions.map((q) => (
              <Box key={q._id} sx={{ width: { xs: "100%", sm: 300 }, display: "flex" }}>
                {q.type === "rating" ? (
                  <RatingCard question={q} dir={dir} t={t} language={language} />
                ) : q.type === "nps" ? (
                  <NpsCard question={q} dir={dir} t={t} language={language} />
                ) : (
                  <OptionCard question={q} dir={dir} t={t} language={language} />
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </>
  );
}
