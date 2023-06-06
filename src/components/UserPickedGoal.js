import React from "react";
import RankingGoals from "./RankingGoals";

const UserPickedGoal = ({ goals, goalVoted, ...props }) => {
  const goal = goals.find((goal) => goal.id === goalVoted);
  return goal ? <RankingGoals key={goal.id} {...goal} {...props} /> : null;
};

export default UserPickedGoal;
