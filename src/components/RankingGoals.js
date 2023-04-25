import React, { useState } from "react";

import "../App.css";

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
    <div className="ranking-goal-card">
      <div className="ranking-goal-title" onClick={toggleVideo}>
        <span className="ranking-position">{position}</span> {title}
      </div>
      <div className="ranking-goal-description">{description}</div>
      {isVideoVisible && <div className="ranking-goal-video">{videoURL}</div>}
    </div>
  );
}

export default RankingGoals;
