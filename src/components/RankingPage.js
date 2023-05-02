import React, { useState } from "react";
import "../App.css";
import RankingGoals from "./RankingGoals";

const RankingPage = ({ goals, navbarRef, totalVotes }) => {
  const [activeGoalId, setActiveGoalId] = useState(null);
  const sortedGoals = [...goals].sort((a, b) => b.votes - a.votes);

  return (
    <div className="ranking-container">
      <main>
        <div className="top10">
          <span className="top">TOP</span> <span className="ten">10</span>
        </div>
        <div className="ranking-goal-container">
          {sortedGoals.map((goal, i) => (
            <RankingGoals
              key={goal.id}
              {...goal}
              position={i + 1}
              isActive={goal.id === activeGoalId}
              setActiveGoalId={setActiveGoalId}
              navbarRef={navbarRef}
              totalVotes={totalVotes}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default RankingPage;
