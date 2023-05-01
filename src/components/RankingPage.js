import React from "react";
import "../App.css";
import RankingGoals from "./RankingGoals";

const RankingPage = ({ goals }) => {
  const sortedGoals = [...goals].sort((a, b) => b.votes - a.votes);

  return (
    <div className="ranking-container">
      <main>
        <div className="ranking-goal-container">
          {sortedGoals.map((goal, i) => (
            <RankingGoals key={goal.id} {...goal} position={i + 1} />
          ))}
        </div>
      </main>
    </div>
  );
};
export default RankingPage;
