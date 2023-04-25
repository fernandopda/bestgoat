import React, { useState } from "react";
import "./App.css";
import Goal from "./components/Goal";
import LoginPopup from "./components/LoginPopup";
import RankingPage from "./components/RankingPage";
import NavBar from "./components/NavBar";
import { useEffect } from "react";
import { gapi } from "gapi-script";
function App() {
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
  }, []);

  const [goals, setGoals] = useState([
    {
      id: 1,
      title: "Roberto Carlos Thunderbolt Strike vs Tenerife (1998)",
      description:
        "Roberto Carlos famous free kick goal for Real Madrid against Tenerife and why its considered by some to be the greatest goal of all time.",
      videoURL: (
        <iframe
          width="877"
          height="658"
          src="https://www.youtube.com/embed/WhVDFEW5348"
          title="Roberto Carlos Impossible Goal against Tenerife in HQ"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      ),
      votes: 5,
    },
    {
      id: 2,
      title: "Zlatan Ibrahimovic Solo Goal at Ajax",
      description:
        "Ibrahimovic showcases his immense talent with an impressive solo goal at Ajax, even with untied shoelaces.",
      videoURL: (
        <iframe
          width="877"
          height="658"
          src="https://www.youtube.com/embed/ZgqsaDnsEq8"
          title="Zlatan Ibrahimovic Goal for Ajax"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      ),
      votes: 10,
    },
    {
      id: 3,
      title: "Diego Maradona vs England (1986)",
      description:
        "Maradona's legendary goal sees him dribble past five England players, earning the title of best World Cup goal ever by FIFA.",
      videoURL: (
        <iframe
          width="1170"
          height="658"
          src="https://www.youtube.com/embed/Oaxnk-Si61Y"
          title="Maradona wonder goal v England Mexico 86 - Víctor Hugo Morales commentary - HD"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      ),
      votes: 55,
    },
    {
      id: 4,
      title: "Zlatan Ibrahimovic vs England (2012)",
      description:
        "Ibrahimovic's incredible 30-yard bicycle kick stuns England during the 2014 World Cup qualifiers, securing a 4-2 win for Sweden.",
      videoURL: (
        <iframe
          width="1170"
          height="658"
          src="https://www.youtube.com/embed/RM_5tJncHww"
          title="Zlatan Ibrahimovic&#39;s famous 30-yard bicycle kick vs England"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      ),
      votes: 3,
    },
    {
      id: 5,
      title: "Neymar vs Flamengo (Puskas Award 2011 Candidate)",
      description:
        "Neymar's remarkable solo goal against Flamengo, showcasing his exceptional skills, earns him a nomination for the 2011 Puskas Award.",
      videoURL: (
        <iframe
          width="1170"
          height="658"
          src="https://www.youtube.com/embed/1wvwSER_w-M"
          title="Goal Neymar vs Flamengo  Puskas Award 2011 Candidate"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      ),
      votes: 33,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const isRankingPage = false;
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="container">
      <main>
        {isAuthenticated ? (
          <>
            <NavBar onLogout={handleLogout} /> {/* Add the NavBar component */}
            <RankingPage goals={goals} goBack={goBack} />
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
                      // onVote={handleVote}
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
        />
      </main>
      <footer>
        <p>&copy; 2023 Soccer Goals. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
