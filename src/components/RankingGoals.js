/* component handles the goals card on the top 10 ranking section of the app */

import React, { useRef, useEffect } from "react";
import "../App.css";

function RankingGoals({
  id,
  title,
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
  const toggleVideo = () => {
    setActiveGoalId(id);
  };

  /* Uses card and nav bar reference position to scroll the page to a point where the card selected moves under navBar position */

  const scrollToCard = () => {
    if (cardRef.current && navbarRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const navbarRect = navbarRef.current.getBoundingClientRect();
      const additionalOffset = -5;

      window.scrollTo({
        top:
          cardRect.top + window.scrollY - navbarRect.height - additionalOffset,
        behavior: "smooth",
      });
    }
  };
  const votesPercentage = ((votes * 100) / totalVotes).toFixed(2);

  const getPositionColor = (position) => {
    switch (position) {
      case 1:
        return "#FFD700";
      case 2:
        return "#C0C0C0";
      case 3:
        return "#CD7F32";
    }
  };

  return (
    <div
      className={`ranking-goal-card${isActive ? " isActive" : ""}`}
      ref={cardRef}
      onClick={toggleVideo}
    >
      {isActive && (
        <div className="ranking-goal-video">
          <iframe
            className="ranking-video-iframe"
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
      {/* {isActive && (
        <div className="ranking-goal-description">{description}</div>
      )} */}
      <div className="ranking-position">
        <span
          className="ranking-number-position"
          style={{ color: getPositionColor(position) }}
        >
          {" "}
          {position}{" "}
        </span>
      </div>
      <div className="ranking-goal-title" style={isActive ? {} : {}}>
        <span
          className="ranking-title-position"
          style={
            isActive
              ? {
                  opacity: 100,
                  color: getPositionColor(position),
                }
              : { opacity: 0 }
          }
        >
          {position}
        </span>
        <span className="ranking-title">{title}</span>
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
