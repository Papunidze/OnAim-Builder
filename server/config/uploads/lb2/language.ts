import { SetLanguage } from "language-management-lib";

const lngObject = {
  en: {
    title: "Leaderboard",
    button: "Click Me",
    rank: "Rank",
    player: "Player",
    score: "Score",
    loading: "Loading...",
    error: "Error",
    noDataAlt: "No data found",
  },
  ka: {
    title: "ლიდერბორდი",
    button: "დააჭირე",
    rank: "რანგი",
    player: "მოთამაშე",
    score: "ქულა",
    loading: "იტვირთება...",
    error: "შეცდომა",
    noDataAlt: "მონაცემები არ მოიძებნა",
  },
};

export type LngProps = typeof lngObject.en;
export const lng = new SetLanguage(lngObject, "en");
