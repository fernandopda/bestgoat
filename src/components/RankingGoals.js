// In RankingGoals.js

import React, { useRef, useEffect } from "react";
import "../App.css";

function RankingGoals({
  id,
  title,
  description,
  url,
  votes,
  position,
  isActive,
  setActiveGoalId,
  navbarRef,
  totalVotes,
}) {
  useEffect(() => {
    if (isActive) {
      scrollToCard();
    }
  }, [isActive]);

  const cardRef = useRef(null);
  console.log("VOTES!!!", votes);
  console.log("TOTALVOTES", totalVotes);
  const toggleVideo = () => {
    setActiveGoalId(id);
  };

  const scrollToCard = () => {
    if (cardRef.current) {
      console.log(navbarRef);
      const cardRect = cardRef.current.getBoundingClientRect();
      const navbarHeight = navbarRef.current.offsetHeight;
      window.scrollTo({
        top: cardRect.top + window.scrollY - navbarHeight,
        behavior: "smooth",
      });
    }
  };
  const votesPercentage = ((votes * 100) / totalVotes).toFixed(2);

  return (
    <div
      className={`ranking-goal-card${isActive ? " isActive" : ""}`}
      ref={cardRef}
      onClick={toggleVideo}
    >
      {isActive && (
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
      {isActive && (
        <div className="ranking-goal-description">{description}</div>
      )}
      <div className="ranking-position">
        <span> {position} </span>
      </div>
      <div className="ranking-goal-title">
        <span className="title">{title}</span>
        <div className="percentage-container">
          <div
            className="percentage-filled"
            style={{ width: `${votesPercentage}%` }}
          ></div>
          <span className="votesPercent">{votesPercentage} %</span>
        </div>
      </div>
    </div>
  );
}

export default RankingGoals;
