import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import Goal from "./components/Goal";
import LoginPopup from "./components/LoginPopup";
import RankingPage from "./components/RankingPage";
import NavBar from "./components/NavBar";
import AdminPage from "./components/AdminPage";
import config from "./config";

import { gapi } from "gapi-script";
import axios from "axios";

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
  const navbarRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
      gapi.load("auth2", () => {
        gapi.auth2.init({
          client_id:
            "247163941989-2gj6cem762ausmk5dghv3uu739t2b5dt.apps.googleusercontent.com",
        });
      });
    };
    document.body.appendChild(script);

    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      console.log("this is the config", config.API_URL);
      const response = await axios.get(`${config.API_URL}/goals`);
      console.log("this is the config", config.API_URL);
      const data = response.data; // Access data with response.data
      setGoals(data);
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  };

  useEffect(() => {
    setTotalVotes(
      goals.reduce((acc, g) => {
        return acc + g.votes;
      }, 0)
    );
  }, [goals]);
  console.log("TOTAL", totalVotes);

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
              />
            )}
          </>
        ) : (
          <>
            <div className="goal-container">
              <div className="goal-list">
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
                    />
                  ))}
              </div>
            </div>
          </>
        )}
        <LoginPopup
          isOpen={isLoginPopupOpen}
          onRequestClose={closeLoginPopup}
          onLoginSuccess={handleLoginSuccess}
          setIsVoted={setIsVoted}
          setIsAdmin={setIsAdmin}
          setUserToken={setUserToken}
          setUserId={setUserId}
        />
      </main>
      <footer>
        <p>&copy; 2023 Soccer Goals. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
