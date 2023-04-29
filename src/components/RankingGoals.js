import React, { useState } from "react";

import "../App.css";

function RankingGoals({ id, title, description, url, totalVotes, position }) {
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
      {isVideoVisible && (
        <div className="ranking-goal-video">
          <iframe
            width="877"
            height="658"
            src={url}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      )}
    </div>
  );
}

export default RankingGoals;
