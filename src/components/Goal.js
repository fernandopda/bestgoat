import React from "react";
import "../App.css";

function Goal({ id, title, description, videoURL, votes, openLoginPopup }) {
  return (
    <div className="goal-card">
      <div className="goal-title">{title}</div>
      <div className="goal-description">{description}</div>
      <div className="goal-video">{videoURL}</div>
      <button className="vote-button" onClick={openLoginPopup}>
        Vote
      </button>
    </div>
  );
}

export default Goal;
