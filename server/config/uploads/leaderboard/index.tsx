import React, {
  CSSProperties,
  useEffect,
  useState,
  useMemo,
  useRef,
  memo,
} from "react";
import "./styles.scss";
import { fetchExternalUrl, leaderboardData } from "./action";
import type { Settings } from "./settings";
import type { LngProps } from "./language";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  avatar?: string;
  isCurrentUser?: boolean;
}

export interface LeaderboardProps {
  title?: string;
  settings: Settings;
  language: LngProps;
}

const globalDataCache = {
  data: null as LeaderboardEntry[] | null,
  timestamp: 0,
  loading: false,
  error: null as string | null,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const fetchLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
  const initialId = "188";
  const firstResponse = await fetchExternalUrl(initialId);

  if (!firstResponse || !firstResponse.data?.leaderboards?.length) {
    throw new Error("No leaderboard data available");
  }

  const externalId = firstResponse.data.leaderboards[0].externalId;
  const secondResponse = await leaderboardData(
    initialId,
    externalId.toString()
  );

  const formattedEntries: LeaderboardEntry[] = secondResponse.data.items.map(
    (apiEntry: { playerUsername: string; amount: number }, index: number) => ({
      rank: index + 1,
      name: apiEntry.playerUsername,
      score: apiEntry.amount,
    })
  );

  return formattedEntries;
};

const LoadingComponent = memo(({ message }: { message: string }) => (
  <div className="loading">{message}</div>
));
LoadingComponent.displayName = "LoadingComponent";

const ErrorComponent = memo(
  ({ error, language }: { error: string; language: LngProps }) => (
    <div className="error">
      {language.error}: {error}
    </div>
  )
);
ErrorComponent.displayName = "ErrorComponent";

const EmptyState = memo(({ language }: { language: LngProps }) => (
  <div className="wrapper">
    <section className="oa_dashboard__not_found oa_is_visible">
      <img
        src="https://i.postimg.cc/QdqTx81y/Frame-1984078017.png"
        alt={language.noDataAlt}
        className="oa_dashboard__not_found_image"
      />
    </section>
  </div>
));
EmptyState.displayName = "EmptyState";

const LeaderboardTable = memo(
  ({
    entries,
    language,
  }: {
    entries: LeaderboardEntry[];
    language: LngProps;
  }) => (
    <section className="main">
      <table className="table">
        <thead className="oa_leaderboard__header">
          <tr>
            <th>#</th>
            <th>{language.player}</th>
            <th>{language.score}</th>
            <th>{language.prize}</th>
          </tr>
        </thead>
        <tbody className="body clearable">
          {entries.map((entry) => {
            const rowClass =
              `row ${entry.isCurrentUser ? "current-user" : ""}`.trim();
            const trophyClass = `trophy trophy-${entry.rank}`;
            return (
              <tr className={rowClass} key={entry.rank}>
                <td className="data">
                  {entry.rank <= 3 ? (
                    <span className={trophyClass}>
                      {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                    </span>
                  ) : (
                    entry.rank
                  )}
                </td>
                <td className="data">
                  <div className="player_cell_content">
                    {entry.avatar && (
                      <img
                        src={entry.avatar}
                        alt={`${entry.name}'s avatar`}
                        className="avatar"
                      />
                    )}
                    <span className="name">{entry.name || "--"}</span>
                  </div>
                </td>
                <td className="data">{entry.score.toLocaleString()}</td>
                <td className="data">--</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  )
);
LeaderboardTable.displayName = "LeaderboardTable";

const Leaderboard: React.FC<LeaderboardProps> = ({
  title = "Leaderboard",
  settings,
  language,
}) => {
  const [localError, setLocalError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [, forceRerender] = useState({});
  const isMountedRef = useRef(true);

  const containerStyles = useMemo<CSSProperties>(
    () => ({
      ...settings,
      backgroundColor: `rgb(${settings.background})`,
    }),
    [settings]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return (): void => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const now = Date.now();
    const isDataFresh =
      globalDataCache.data && now - globalDataCache.timestamp < CACHE_DURATION;

    // Always set initial load to false after first useEffect run
    setIsInitialLoad(false);

    if (isDataFresh || globalDataCache.loading) {
      setLocalError(globalDataCache.error);
      return;
    }

    if (
      !globalDataCache.data ||
      now - globalDataCache.timestamp >= CACHE_DURATION
    ) {
      globalDataCache.loading = true;
      setLocalError(null);

      fetchLeaderboardData()
        .then((data) => {
          if (isMountedRef.current) {
            globalDataCache.data = data;
            globalDataCache.timestamp = now;
            globalDataCache.error = null;
            globalDataCache.loading = false;
            setLocalError(null);
            forceRerender({}); // Force re-render after cache update
          }
        })
        .catch((error) => {
          if (isMountedRef.current) {
            const errorMessage =
              error instanceof Error ? error.message : language.unknownError;
            globalDataCache.error = errorMessage;
            globalDataCache.loading = false;
            setLocalError(errorMessage);
            forceRerender({}); // Force re-render after error
          }
        });
    }
  }, [language.unknownError]);

  if (isInitialLoad || (globalDataCache.loading && !globalDataCache.data)) {
    return <LoadingComponent message={language.loading} />;
  }

  if (localError || globalDataCache.error) {
    return (
      <ErrorComponent
        error={localError || globalDataCache.error || language.unknownError}
        language={language}
      />
    );
  }

  const leaderboardEntries = globalDataCache.data || [];

  return (
    <div className="leaderboard" style={containerStyles}>
      <h3 className="title">{title}</h3>
      <div className="header">
        <div className="rank">{language.rank}</div>
        <div className="player">{language.player}</div>
        <div className="score">{language.score}</div>
      </div>
      {leaderboardEntries.length === 0 ? (
        <EmptyState language={language} />
      ) : (
        <LeaderboardTable entries={leaderboardEntries} language={language} />
      )}
    </div>
  );
};

export default memo(Leaderboard);
