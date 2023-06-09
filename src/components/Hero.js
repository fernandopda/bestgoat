import React, { useState, useEffect } from "react";
import soccerCrew from "./img/soccerCrew.avif";
function Hero({}) {
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
      <div class="hero-scroll-down">
        <div className="hero-scroll-text">Scroll Down</div>
        <div className="hero-arrows">
          <span class="hero-arrow1">&gt;</span>
          <span class="hero-arrow2">&gt;</span>
        </div>
      </div>
    </div>
  );
}
export default Hero;
