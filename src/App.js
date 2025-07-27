import React, { useState, useEffect, useRef, useMemo } from "react";
import "./App.css";
import { IconLoading } from "./components/img/Icons";
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
  searchActive - cheks if search input is focused
  OverlayActive- it handles overlay display when user is searching goals
  goalLoading - it shows loading feature when goal is being loaded after search
  */
function App() {
  const [isAdmin, setIsAdmin] = useState(true);
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
  const [isOverlayActive, setIsOverlayActive] = useState(false);
  const [isGoalLoading, setIsGoalLoading] = useState(false);
  const [displayResults, setDisplayResults] = useState(false);
  const [showAllResultsTxt, setShowAllResultsTxt] = useState(true);
  const [noSearchResults, setNoSerachResults] = useState(false);
  const [showNavBar, setShowNavBar] = useState(false);
  const [showGoalList, setShowGoalList] = useState(false);
  const [isFullListLoading, setIsFullListLoading] = useState(false);
  const [hasOverlay, setHasOverlay] = useState(false);
  const [showBall, setShowBall] = useState(false);
  const [goalVoted, setGoalVoted] = useState(0);
  const ballSpinerTimeOut = [3000, 2000]
  const navbarRef = useRef(null);
  const goalListRef = useRef(null);
  const goalContainerRef = useRef(null);
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
  // Handles navBar display, according to the scroll position of the page
  const handleHeroNavScroll = () => {
    if (hasScrolled) {
      return;
    }
    if (goalContainerRef.current) {
      const goalContainerRect = goalContainerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const offset = 300;

      // Check if the bottom of the viewport has reached the top of goalContainer
      if (goalContainerRect.top < viewportHeight - offset) {

        setShowNavBar(true);
        setShowGoalList(true);
        setIsGoalLoading(true);
        setIsFullListLoading(true);
        setTimeout(() => {
          setIsGoalLoading(false);
          setIsFullListLoading(false);
        }, ballSpinerTimeOut[0]);
        hasScrolled = true;
      } else {
        setShowNavBar(false);
        setShowGoalList(false);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleHeroNavScroll);
    return () => {
      window.removeEventListener('scroll', handleHeroNavScroll);
    };
  }, []);
  // Cheks if goalsearch input is empty in order to show all goals txt,Activates lazyloading everytime user input a text on searchbar with forcecheck
  useEffect(() => {

    searchTerm.length === 0 ? setShowAllResultsTxt(true) : setShowAllResultsTxt(false);
    searchTerm.length > 0 && searchTerm.length < 3 ? setDisplayResults(false) : setDisplayResults(true);
    forceCheck();
  }, [searchTerm]);

  //Hangle search overlay display
  useEffect(() => {
    displayOverlay();
  }, [isSearchActive, searchTerm]);

  //Creates array for filtered goals depending on searchTerm
  const filteredGoals = useMemo(() => {
    if (goals.filter(goal => searchTerm.l))
      return goals.filter(goal =>
        searchTerm.length >= 3 && goal.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [goals, searchTerm]);


  //Handles goal loading feature after search
  useEffect(() => {

    if (isOverlayActive) {
      setHasOverlay(true);
    }
    if (!isOverlayActive && !isFullListLoading && hasOverlay && searchTerm.length > 0) {
      setShowBall(true)
      setIsGoalLoading(true);
      const timer = setTimeout(() => {
        setIsGoalLoading(false)
        filteredGoals.length === 0 ? setNoSerachResults(true) : setNoSerachResults(false);
      }, ballSpinerTimeOut[1]);

      return () => clearTimeout(timer);
    }
  }, [isOverlayActive]);

  useEffect(() => {

  });
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

  // handle search result text
  const renderSearchResultTxt = () => {
    if (noSearchResults) {
      return <div className="goal-list-no-results"> No results found for <span>{searchTerm}</span></div>;
    } else if (showAllResultsTxt) {
      return <div className="goal-list-results"> Showing <span>all</span> goals ({goals.length})</div>;
    } else if (displayResults) {
      return <div className="goal-list-results"> {filteredGoals.length} results for <span>{searchTerm}</span> </div>;
    }
  }

  const displayOverlay = () => {
    setIsOverlayActive(isSearchActive && searchTerm.length < 3);
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
        <div className={isOverlayActive ? "nav-search-overlay active" : "nav-search-overlay"}></div>
        {showNavBar && <NavBar
          ref={navbarRef}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          searchTerm={searchTerm}
          setSearchTerm={scrollSearchInput}
          isVoted={isVoted}
          setSearchActive={setSearchActive}
        />}

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
            <AdminPage />
            <Intro />
            <div ref={goalContainerRef} className="goal-container">
              {isGoalLoading ? (isFullListLoading ? (<div className="goal-searching">

                <div className="goal-searching-container">
                  <div className="goal-searching-txt-container">
                    <p className="goal-searching-txt">FULL LIST LOADING</p>
                  </div>
                  <div className="goal-searching-soccer-ball-container">
                    <img src={soccer_ball} alt="Soccer Ball" className="goal-searching-soccer-ball-spinner-moving" />
                  </div>
                </div>



              </div>) : (
                <div className="goal-searching">
                  <img
                    src={soccer_ball}
                    alt="Soccer Ball"
                    className={`goal-searching-soccer-ball-spinner ${showBall ? 'show' : ''}`}
                  /></div>)

              ) : (
                showGoalList &&
                <div ref={goalListRef} className="goal-list">
                  <span>{renderSearchResultTxt()}</span>

                  <div className="goal-goals">
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

                          setIsVoted={setIsVoted}
                          setGoalVoted={setGoalVoted}
                          setScrollTop={setScrollTop}
                          setIsLoading={setIsLoading}
                          setVoteMessage={setVoteMessage}
                        />
                      ))}</div>
                </div>)
              }

            </div>
          </>
        )}
        <Footer />


      </main>


    </div>
  );
}

export default App;
