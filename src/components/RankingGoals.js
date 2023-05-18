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

  const getScrollOffset = () => {
    const navbarHeight = navbarRef.current.offsetHeight;
    const additionalOffset = 10; // You can adjust this value for some additional space between the Nav bar and the video
    return navbarHeight + additionalOffset;
  };

  // Update the scrollToCard function with the new offset calculation
  const scrollToCard = () => {
    if (cardRef.current && navbarRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const navbarRect = navbarRef.current.getBoundingClientRect();
      const additionalOffset = -5; // You can adjust this value for some additional space between the Nav bar and the video

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
