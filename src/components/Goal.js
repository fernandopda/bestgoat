import React, { useState } from "react";
import LazyLoad from "react-lazyload";
import "../App.css";
import soccer_ball from "./img/soccer_ball2.svg";
import config from "../config";
function Goal({
  id,
  title,
  description,
  url,
  votes,
  openLoginPopup,
  isAuthenticated,
  setIsVoted,
  setGoalVoted,
  token,
  userId,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);

  const handleVote = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${config.API_URL}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goalId: id, userId }),
      });
      const data = await response.json();
      if (response.status === 200) {
        setGoalVoted(data.goalVoted);
        setIsVoted(true);
      } else if (response.status === 403) {
        const errorData = await response.json();
      } else {
        throw new Error("Error voting", token, response);
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`goal-card ${isMediaLoaded ? "" : "blur"}`}>
      {isLoading && (
        <div className="loading-overlay">
          <div className="ball-container">
            <img
              src={soccer_ball}
              alt="Soccer Ball"
              className="soccer-ball-spinner"
            />
          </div>
        </div>
      )}
      <div className="goal-title">{title}</div>
      <div className="goal-description">{description}</div>
      <div className="goal-video">
        <LazyLoad once placeholder={<div>Loading...</div>}>
          <iframe
            onLoad={() => setIsMediaLoaded(true)}
            src={url}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </LazyLoad>
      </div>
      {isAuthenticated ? (
        <button className="vote-button-red" onClick={handleVote}>
          Vote
        </button>
      ) : (
        <button className="vote-button" onClick={openLoginPopup}>
          Vote
        </button>
      )}
    </div>
  );
}

export default Goal;
