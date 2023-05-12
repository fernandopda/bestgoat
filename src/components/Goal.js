import React from "react";
import axios from "axios";

import "../App.css";

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
  const handleVote = async () => {
    try {
      const response = await fetch(
        "https://zcw74z8g88.execute-api.ap-southeast-2.amazonaws.com/test/vote",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id, userId }),
        }
      );
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
    }
  };

  return (
    <div className="goal-card">
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
