import React, { useState } from "react";

import "./App.css";

function RankingGoals({
  id,
  title,
  description,
  videoURL,
  totalVotes,
  position,
}) {
  const [isVideoVisible, setIsVideoVisible] = useState(false);

  const toggleVideo = () => {
    setIsVideoVisible(!isVideoVisible);
  };
  return (
    <div class="ranking-goal-card">
      <div class="ranking-goal-title" onClick={toggleVideo}>
        <span className="ranking-position">{position}</span> {title}
      </div>
      <div class="ranking-goal-description">{description}</div>
      {isVideoVisible && <div class="ranking-goal-video">{videoURL}</div>}
    </div>
  );
}

export default RankingGoals;
