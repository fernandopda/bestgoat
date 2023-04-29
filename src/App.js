import React, { useState } from "react";
import "./App.css";
import Goal from "./components/Goal";
import LoginPopup from "./components/LoginPopup";
import RankingPage from "./components/RankingPage";
import NavBar from "./components/NavBar";
import AdminPage from "./components/AdminPage";
import { useEffect } from "react";
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
      const response = await axios.get(
        "http://localhost:5000/api/auth/getGoals"
      );
      const data = response.data; // Access data with response.data
      setGoals(data);
      console.log(data);
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
        {isAuthenticated && isVoted ? (
          <>
            <NavBar onLogout={handleLogout} />
            {isAdmin ? (
              <AdminPage />
            ) : (
              <RankingPage goals={goals} goBack={goBack} />
            )}
          </>
        ) : (
          <>
            <header>
              <h1>Best Soccer Goals</h1>
            </header>
            <div className="search">
              <input
                type="text"
                placeholder="Search for a goal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
                      isVoded={isVoted}
                      token={userToken}
                      userId={userId}
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
