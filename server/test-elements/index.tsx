import React from "react";
import "./leaderboard.css";
import Button from "./button";
import { leaders } from "./action";

const Leaderboard: React.FC = () => {
  return (
    <div className="leaderboard">
      <Button />
      <h2 className="leaderboard-title">Leaderboard</h2>
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
