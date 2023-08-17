/* page shows the top 10 goals voted by users */

import React, { useState } from "react";
import "../App.css";
import RankingGoals from "./RankingGoals";
import UserPickedGoal from "./UserPickedGoal";

const RankingPage = ({ goals, navbarRef, totalVotes, goalVoted }) => {
  const [activeGoalId, setActiveGoalId] = useState(null);
  const [activeUserPickedGoalId, setActiveUserPickedGoalId] = useState(null);
  const sortedGoals = [...goals].sort((a, b) => b.votes - a.votes);
  const sortedTop10Goals = sortedGoals
    .slice(0, 10)
    .sort((a, b) => a.votes - b.votes);
  return (
    <main>
      <div className="ranking-goal-container">
        <label>TOP 10</label>
        {sortedTop10Goals.map(
          (goal, i) =>
            i < 10 && (
              <RankingGoals
                key={goal.id}
                {...goal}
                position={10 - i}
                isActive={goal.id === activeGoalId}
                setActiveGoalId={setActiveGoalId}
                navbarRef={navbarRef}
                totalVotes={totalVotes}
              />
            )
        )}
        {/* <div className="ranking-goal-user-pick">
          <label>YOUR VOTE</label>
          <UserPickedGoal
            goals={sortedGoals}
            goalVoted={goalVoted}
            // position={
            //   sortedGoals.findIndex((goal) => goal.id === goalVoted) + 1
            // }
            isActive={goalVoted === activeUserPickedGoalId}
            setActiveGoalId={setActiveUserPickedGoalId}
            navbarRef={navbarRef}
            totalVotes={totalVotes}
          />
        </div> */}
      </div>
    </main>
  );
};

export default RankingPage;
