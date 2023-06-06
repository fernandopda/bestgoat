import React, { useState, useEffect } from "react";
import { animated, useTransition } from "react-spring";

const LandingPage = ({ onProceed }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const words = [
    "BEST",
    "GOALS",
    <span style={{ color: "red" }}>OF ALL TIME</span>,
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 1200); // Change word every 2 seconds

    return () => {
      clearInterval(timer);
    };
  }, []);

  const transitions = useTransition(currentWordIndex, {
    from: {
      position: "absolute",
      opacity: 0,
      transform: "translate3d(0,100px,0)",
    },
    enter: { opacity: 1, transform: "translate3d(0,0px,0)" },
    leave: { opacity: 0, transform: "translate3d(0,-100px,0)" },
  });

  return (
    <div className="landing-page">
      <div className="landing-page-main-text">
        <h1>
          {transitions((style, i) => (
            <animated.span style={style}>{words[i]}</animated.span>
          ))}
        </h1>
      </div>
      <div className="landing-page-text1">
        You will be presented with a list of the best goals ever scored.
      </div>
      <div className="landing-page-text2">
        Vote for your favorite and see if it makes our Top 10 list of the{" "}
        <span style={{ color: "red" }}>Best Goals Of All Time.</span>
      </div>

      <button className="landing-page-btn" onClick={onProceed}>
        Watch Goals!
      </button>
    </div>
  );
};

export default LandingPage;
