/* Component handless hero section of the page */

import React, { useState, useEffect } from "react";
import soccerCrew from "./img/soccerCrew.avif";
function Hero({ }) {
  return (
    <div className="hero-container">
      <img src={soccerCrew} alt="SoccerCreW" className="hero-image"></img>
      <div className="hero-text-over-image">
        <div className="hero-text-over-image-text1">VOTE</div>
        <div className="hero-text-over-image-text2">
          In The Best <span className="hero-text-over-image-text3"> GOAL </span>
          Of All Time
        </div>
      </div>
      <div className="hero-scroll-down">
        <div className="hero-scroll-text">Scroll Down</div>
        <div className="hero-arrows">
          <span className="hero-arrow1">&gt;</span>
          <span className="hero-arrow2">&gt;</span>
        </div>
      </div>
    </div>
  );
}
export default Hero;
