import React, { useState } from "react";
import axios from "axios";
import config from "../config";
import "../App.css";
import soccer_ball from "./img/soccer_ball2.svg";

function Goal({
  id,
  title,
  description,
  url,
  votes,
  openLoginPopup,
  isAuthenticated,
  setIsVoted,
  token,
  userId,
}) {
  const [isLoading, setIsLoading] = useState(false);
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
      if (response.status === 200) {
        console.log("Vote submitted successfully");
        setIsVoted(true);
      } else if (response.status === 403) {
        const errorData = await response.json();
        console.log("Error:", errorData);
        console.log(response);
        console.log(response.status);
        console.log("User has already voted");
        console.log(token);
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
    <div className="goal-card">
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
      {isAuthenticated ? (
        <button className="vote-button" onClick={handleVote}>
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
