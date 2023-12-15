import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import Goal from "./components/Goal";
import Hero from "./components/Hero";
import RankingPage from "./components/RankingPage";
import NavBar from "./components/NavBar";
import AdminPage from "./components/AdminPage";
import Footer from "./components/Footer";
import Intro from "./components/Intro"
import config from "./config";
import { gapi } from "gapi-script";
import axios from "axios";
import { forceCheck } from "react-lazyload";
import soccer_ball from "./components/img/soccer_ball2.svg";

/* States
  isAdmin - handles admin status
  Goals - State array containing the goal cards info
  searchTerm - Holds content input on the search bar
  isAuthenticated - Golds authentication state of the user
  isVoted - checks if user already voted
  scrollTop - is set to true if conditions are met and the page scrolls to its top
  userToken - Hols google token
  userId - Hols user ID
  totalVotes - holds the number of total votes
  goalVoted - holds ID of the goal currently voted
  navBarRef - holds nav bar reference
  goalListRef - holds goal list Ref

  */
function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [goals, setGoals] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVoted, setIsVoted] = useState(false);
  const [scrollTop, setScrollTop] = useState(false);
  const [userToken, setUserToken] = useState("");
  const [userId, setUserId] = useState();
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [voteMessage, setVoteMessage] = useState("");
  const [displayMessage, setDisplayMessage] = useState("");
  const [isSearchActive, setSearchActive] = useState(false);

  const [goalVoted, setGoalVoted] = useState(0);
  const navbarRef = useRef(null);
  const goalListRef = useRef(null);
  let hasScrolled = false;
  const goalListOffset = 180;

  // loads google API

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
      gapi.load("auth2", () => {
        gapi.auth2.init({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        });
      });
    };
    document.body.appendChild(script);

    fetchGoals();
  }, []);

  // counts the toal number of votes, so percentage of goals voted for each goal can be calculated in the top10
  useEffect(() => {
    setTotalVotes(
      goals.reduce((acc, g) => {
        return acc + g.votes;
      }, 0)
    );
  }, [goals]);

  // Update voting mesage
  useEffect(() => {
    setDisplayMessage(voteMessage);
  }, [voteMessage]);
  // manages navBar display, according to the scroll position of the page
  useEffect(() => {
    let initialHeight = window.innerHeight;
    const handleResize = () => {
      initialHeight = window.innerHeight;
    };

    const handleHeroNavScroll = () => {
      if (hasScrolled) {
        return;
      }

      const goalListPos = goalListRef.current.offsetTop;
      const scrollPos = window.scrollY;

      if (scrollPos + goalListOffset >= goalListPos) {
        navbarRef.current.style.display = "flex";
        hasScrolled = true;
      } else {
        navbarRef.current.style.display = "none";
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleHeroNavScroll);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleHeroNavScroll);
    };
  }, []);

  // Activates lazyloading everytime user input a text on searchbar
  useEffect(() => {
    forceCheck();
  }, [searchTerm]);
  // fetch list of goals from database
  const fetchGoals = async () => {
    try {
      const response = await axios.get(`${config.API_URL}/goals`);
      const data = response.data; // Access data with response.data
      setGoals(data);
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  };
  // Scrolls the view when a input is added on serachBar
  const scrollSearchInput = (newSerchTerm) => {
    setSearchTerm(newSerchTerm);

    if (goalListRef.current) {
      const defaulViewPortHeight = window.innerHeight;

      const keyboardThreshold = defaulViewPortHeight * 0.4;

      if (window.innerHeight < defaulViewPortHeight - keyboardThreshold) {
        const adjustedOffset =
          goalListRef.current.offsetTop -
          goalListOffset -
          0.3 * window.innerHeight;
        window.scrollTo({
          top: adjustedOffset,
        });
      } else {
        window.scrollTo({
          top: goalListRef.current.offsetTop - goalListOffset,
        });
      }
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="wrap-container">

      {isLoading && (
        <div className="loading-overlay">
          <div className="ball-container">
            <img
              src={soccer_ball}
              alt="Soccer Ball"
              className="soccer-ball-spinner"
            />
          </div>
          <div>
            {voteMessage && <div className="vote-message">{voteMessage}</div>}
          </div>
        </div>
      )}

      <main>
        <div className={isSearchActive ? "nav-search-overlay active" : "nav-search-overlay"}></div>
        <NavBar
          ref={navbarRef}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          searchTerm={searchTerm}
          setSearchTerm={scrollSearchInput}
          isVoted={isVoted}
          setSearchActive={setSearchActive}
        />
        {isAuthenticated && isVoted ? (
          <>
            {isAdmin ? (
              <AdminPage />
            ) : (
              <RankingPage
                goals={goals}
                goBack={goBack}
                navbarRef={navbarRef}
                totalVotes={totalVotes}
                goalVoted={goalVoted}
              />
            )}
          </>
        ) : (
          <>
            <Hero />
            <Intro />
            <div className="goal-container">

              <div ref={goalListRef} className="goal-list">
                {goals
                  .filter((goal) =>
                    searchTerm.length < 3 || goal.title.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase())
                  )
                  .map((goal) => (
                    <Goal
                      key={goal.id}
                      {...goal}
                      setIsAuthenticated={setIsAuthenticated}
                      setIsVoded={setIsVoted}
                      userId={userId}
                      onLoginSuccess={handleLoginSuccess}
                      setUserId={setUserId}
                      setIsAdmin={setIsAdmin}
                      setIsVoted={setIsVoted}
                      setGoalVoted={setGoalVoted}
                      setScrollTop={setScrollTop}
                      setIsLoading={setIsLoading}
                      setVoteMessage={setVoteMessage}
                    />
                  ))}
              </div>
            </div>
          </>
        )}
        <Footer />


      </main>


    </div>
  );
}

export default App;
