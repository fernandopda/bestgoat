import React, { useState } from "react";
import "./App.css";
import Goal from "./Goal";
import LoginPopup from "./LoginPopup";

function App() {
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: "Roberto Carlos Thunderbolt Strike vs Tenerife (1998)",
      description:
        "he passage discusses Roberto Carlos famous free kick goal for Real Madrid against Tenerife and why its considered by some to be the greatest goal of all time.",
      videoURL: (
        <iframe
          width="877"
          height="658"
          src="https://www.youtube.com/embed/WhVDFEW5348"
          title="Roberto Carlos Impossible Goal against Tenerife in HQ"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      ),
      votes: 0,
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
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      ),
      votes: 0,
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
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      ),
      votes: 0,
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
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      ),
      votes: 0,
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
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      ),
      votes: 0,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);

  const openLoginPopup = () => {
    setIsLoginPopupOpen(true);
  };
  const closeLoginPopup = () => {
    setIsLoginPopupOpen(false);
  };
  return (
    <div className="container">
      <header>
        <h1>Best Soccer Goals</h1>
      </header>
      <main>
        <div className="search">
          <input
            type="text"
            placeholder="Search for a goal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div class="goalContainer">
          <div className="goal-list">
            {goals
              .filter((goal) =>
                goal.title
                  .toLocaleLowerCase()
                  .includes(searchTerm.toLocaleLowerCase())
              )
              .map((goal) => (
                <Goal key={goal.id} {...goal} openLoginPopup={openLoginPopup} />
              ))}
          </div>
        </div>
        <LoginPopup
          isOpen={isLoginPopupOpen}
          onRequestClose={closeLoginPopup}
        />
      </main>
      <footer>
        <p>&copy; 2023 Soccer Goals. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
