import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import Goal from "./components/Goal";
import Hero from "./components/Hero";
import LoginPopup from "./components/LoginPopup";
import RankingPage from "./components/RankingPage";
import NavBar from "./components/NavBar";
import AdminPage from "./components/AdminPage";
import LandingPage from "./components/LandingPage";
import config from "./config";
import bestgoatlogo from "./components/img/bestGoat.png";
import { gapi } from "gapi-script";
import axios from "axios";
import PrivacyPolicy from "./components/PrivacyPolicy";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [goals, setGoals] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const isRankingPage = false;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVoted, setIsVoted] = useState(false);
  const [userToken, setUserToken] = useState("");
  const [userId, setUserId] = useState();
  const [totalVotes, setTotalVotes] = useState(0);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [goalVoted, setGoalVoted] = useState(0);
  const navbarRef = useRef(null);
  const goalListRef = useRef(null);
  let hasScrolled = false;

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
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [isVoted, isAdmin]);

  useEffect(() => {
    setTotalVotes(
      goals.reduce((acc, g) => {
        return acc + g.votes;
      }, 0)
    );
  }, [goals]);

  useEffect(() => {
    const handleHeroNavScroll = () => {
      if (hasScrolled) {
        return;
      }

      const goalListPos = goalListRef.current.offsetTop;
      const scrollPos = window.scrollY;
      const additionalOffset = 180;

      if (scrollPos + additionalOffset >= goalListPos) {
        navbarRef.current.style.display = "flex";
      } else {
        navbarRef.current.style.display = "none";
      }
    };
    window.addEventListener("scroll", handleHeroNavScroll);

    return () => window.removeEventListener("scroll", handleHeroNavScroll);
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await axios.get(`${config.API_URL}/goals`);
      const data = response.data; // Access data with response.data
      setGoals(data);
    } catch (error) {
      console.error("Error fetching goals:", error);
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
          setSearchTerm={setSearchTerm}
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
                      isAuthenticated={isAuthenticated}
                      setIsVoded={setIsVoted}
                      token={userToken}
                      userId={userId}
                      setIsVoted={setIsVoted}
                      setGoalVoted={setGoalVoted}
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
