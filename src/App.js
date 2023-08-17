import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import Goal from "./components/Goal";
import Hero from "./components/Hero";
import LoginPopup from "./components/LoginPopup";
import RankingPage from "./components/RankingPage";
import NavBar from "./components/NavBar";
import AdminPage from "./components/AdminPage";
import config from "./config";
import bestgoatlogo from "./components/img/bestGoat.png";
import { gapi } from "gapi-script";
import axios from "axios";
import PrivacyPolicy from "./components/PrivacyPolicy";
import { forceCheck } from "react-lazyload";

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
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVoted, setIsVoted] = useState(false);
  const [scrollTop, setScrollTop] = useState(false);
  const [userToken, setUserToken] = useState("");
  const [userId, setUserId] = useState();
  const [totalVotes, setTotalVotes] = useState(0);

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
  // scrolls to the top of the page when a vote is received
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [scrollTop]);

  // counts the toal number of votes, so percentage of goals voted for each goal can be calculated in the top10
  useEffect(() => {
    setTotalVotes(
      goals.reduce((acc, g) => {
        return acc + g.votes;
      }, 0)
    );
  }, [goals]);

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
      window.scrollTo({
        top: goalListRef.current.offsetTop - goalListOffset,
      });
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setIsLoginPopupOpen(false);
  };

  const openLoginPopup = () => {
    setIsLoginPopupOpen(true);
  };
  const closeLoginPopup = () => {
    setIsLoginPopupOpen(false);
  };
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleVote = () => {
    setIsVoted = false;
  };
  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="container">
      <main>
        <NavBar
          ref={navbarRef}
          isAuthenticated={isAuthenticated}
          openLogin={openLoginPopup}
          onLogout={handleLogout}
          searchTerm={searchTerm}
          setSearchTerm={scrollSearchInput}
          isVoted={isVoted}
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
            <div className="goal-container">
              <Hero />
              <div ref={goalListRef} className="goal-list">
                {goals
                  .filter((goal) =>
                    goal.title
                      .toLocaleLowerCase()
                      .includes(searchTerm.toLocaleLowerCase())
                  )
                  .map((goal) => (
                    <Goal
                      key={goal.id}
                      {...goal}
                      openLoginPopup={openLoginPopup}
                      setIsAuthenticated={setIsAuthenticated}
                      setIsVoded={setIsVoted}
                      token={userToken}
                      userId={userId}
                      onLoginSuccess={handleLoginSuccess}
                      setUserId={setUserId}
                      setIsAdmin={setIsAdmin}
                      setIsVoted={setIsVoted}
                      setGoalVoted={setGoalVoted}
                      setScrollTop={setScrollTop}
                    />
                  ))}
              </div>
            </div>
          </>
        )}
        <LoginPopup
          isOpen={isLoginPopupOpen}
          closeLoginPopup={closeLoginPopup}
          onLoginSuccess={handleLoginSuccess}
          setGoalVoted={setGoalVoted}
          setIsVoted={setIsVoted}
          setIsAdmin={setIsAdmin}
          setUserToken={setUserToken}
          setUserId={setUserId}
        />
      </main>

      <footer className="footer">
        <div className="landing-page-logo">
          <img src={bestgoatlogo} alt="Best Goals Of All Time logo" />
        </div>
        <PrivacyPolicy />
        <p>&copy; 2023 BestGOAT. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
