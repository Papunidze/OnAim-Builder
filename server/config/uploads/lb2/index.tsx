import React from "react";
import "./leaderboard.css";
import Button from "./button";
import type { Settings } from "./settings";

interface Leader {
  name: string;
  score: number;
}

const Leaderboard: React.FC<Settings> = (props) => {
  const leaders: Leader[] = [
    { name: "Giga", score: 1200 },
    { name: "Gela", score: 950 },
    { name: "Eve", score: 780 },
    { name: "Mallory", score: 630 },
  ];
  const leaderboardSettings = props.leaderboard || {};
  const title = leaderboardSettings.test || "Leaderboard";

  return (
    <div className="leaderboard">
      <Button />
      <h2 className="leaderboard-title">{title}</h2>
      <ul className="leaderboard-list">
        {leaders.map((leader, idx) => (
          <li key={leader.name} className="leaderboard-item">
            <span className="leaderboard-rank">#{idx + 1}</span>
            <span className="leaderboard-name">{leader.name}</span>
            <span className="leaderboard-score">{leader.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
