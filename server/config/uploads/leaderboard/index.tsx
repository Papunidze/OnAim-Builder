import React from "react";
import { LngProps } from "./language";
import settings, { Settings } from "./settings";
import "./styles.scss";

interface LeaderboardProps {
  settings: Settings;
  language: LngProps;
}

const Leaderboard: React.FC<LeaderboardProps> = (props) => {
  return (
    <div
      className="leaderboard"
      style={{
        backgroundColor: `rgb(${props.settings.background})`,
        width: `${props.settings.width}px`,
      }}
    >
      <h2>{props.language.title}</h2>
      {Array(9).fill("-").length > 0 ? (
        <ol>
          {Array(9)
            .fill("-")
            .map((_, index) => (
              <li key={index}>
                <span className="rank">#{index + 1}</span>
                <span className="player">{props.settings.players}</span>
              </li>
            ))}
        </ol>
      ) : (
        <p className="no-players">{props.language.noPlayers}</p>
      )}
    </div>
  );
};

export default Leaderboard;
