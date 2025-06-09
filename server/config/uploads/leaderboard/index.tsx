import React, {
  CSSProperties,
  useEffect,
  useState,
  useMemo,
  useCallback,
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

const Leaderboard: React.FC<LeaderboardProps> = ({
  title = "Leaderboard",
  settings,
  language,
}) => {
  const [leaderboardEntries, setLeaderboardEntries] = useState<
    LeaderboardEntry[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const containerStyles = useMemo<CSSProperties>(
    () => ({
      ...settings,
      backgroundColor: `rgb(${settings.background})`,
    }),
    [settings]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const initialId = "188";
      const firstResponse = await fetchExternalUrl(initialId);

      if (firstResponse && firstResponse.data?.leaderboards?.length > 0) {
        const externalId = firstResponse.data.leaderboards[0].externalId;
        const secondResponse = await leaderboardData(
          initialId,
          externalId.toString()
        );

        const formattedEntries: LeaderboardEntry[] =
          secondResponse.data.items.map(
            (
              apiEntry: { playerUsername: string; amount: number },
              index: number
            ) => ({
              rank: index + 1,
              name: apiEntry.playerUsername,
              score: apiEntry.amount,
            })
          );

        setLeaderboardEntries(formattedEntries);
      } else {
        setError(language.errorFetchingData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : language.unknownError);
    } finally {
      setLoading(false);
    }
  }, [language.errorFetchingData, language.unknownError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="loading">{language.loading}</div>;
  if (error)
    return (
      <div className="error">
        {language.error}: {error}
      </div>
    );

  return (
    <div className="leaderboard" style={containerStyles}>
      <h3 className="title">{title}</h3>
      <div className="header">
        <div className="rank">{language.rank}</div>
        <div className="player">{language.player}</div>
        <div className="score">{language.score}</div>
      </div>
      {leaderboardEntries.length === 0 ? (
        <div className="wrapper">
          <section className="oa_dashboard__not_found oa_is_visible">
            <img
              src="https://i.postimg.cc/QdqTx81y/Frame-1984078017.png"
              alt={language.noDataAlt}
              className="oa_dashboard__not_found_image"
            />
          </section>
        </div>
      ) : (
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
              {leaderboardEntries.map((entry) => {
                const rowClass =
                  `row ${entry.isCurrentUser ? "current-user" : ""}`.trim();
                const trophyClass = `trophy trophy-${entry.rank}`;
                return (
                  <tr className={rowClass} key={entry.rank}>
                    <td className="data">
                      {entry.rank <= 3 ? (
                        <span className={trophyClass}>
                          {entry.rank === 1
                            ? "🥇"
                            : entry.rank === 2
                              ? "🥈"
                              : "🥉"}
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
      )}
    </div>
  );
};

export default memo(Leaderboard);
