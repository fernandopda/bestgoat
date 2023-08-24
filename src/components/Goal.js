/*
The Goal.js component represents individual goals in the voting system. It includes details about the goal, such as its title, description, and video URL. This component uses states to handle the loading of media and user interactions with the voting system.

*/

import React, { useState } from "react";
import LazyLoad from "react-lazyload";
import "../App.css";

import config from "../config";
import { GoogleLogin } from "react-google-login";
import Cookies from "js-cookie";
import ReCAPTCHA from "react-google-recaptcha";
import { useEffect } from "react";

// The Goal component represents a single goal in the application.
// It shows details about the goal, as well as providing functionality to vote for the goal.
function Goal({
  setVoteMessage,
  id,
  title,
  description,
  url,
  setIsAuthenticated,
  setIsVoted,
  setGoalVoted,
  setScrollTop,
  setIsLoading,
}) {
  // These states are used to controlm loading states and media loading states.

  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [isFormEntriesVisible, setIsFormEntriesVisible] = useState(false);
  const [captchaValue, setCaptchaValue] = useState(null);
  const [offset, setOffset] = useState(800);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const voteMessageTimeOut = 3000;

  //??
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // show form when vote button is clicked
  const showForm = () => {
    setIsFormVisible(true);
  };
  const showEntriesForm = () => {
    setIsFormEntriesVisible(true);
  };
  // messaged displayed when user votges
  const voteSuccess = () => {
    setVoteMessage(
      <>
        <div> Thank you for casting your vote!</div>{" "}
        <div>
          You will now be redirected to the{" "}
          <span className="vote-message-top10">TOP 10 GOALS</span>
        </div>
      </>
    );

    setIsVoted(true);
    setIsAuthenticated(true);
  };
  const alredyVoted = () => {
    setVoteMessage(
      <>
        <div>User has already voted! </div>
        <div>
          You will now be redirected to the{" "}
          <span className="vote-message-top10">TOP 10 GOALS</span>
        </div>
      </>
    );

    setIsVoted(true);
    setIsAuthenticated(true);
  };
  const alredyVotedToday = () => {
    setVoteMessage(
      <>
        <div>User has already voted today! </div>
        <div>
          You will now be redirected to the{" "}
          <span className="vote-message-top10">TOP 10 GOALS</span>
        </div>
      </>
    );

    setIsVoted(true);
    setIsAuthenticated(true);
  };

  /* validates email format after user input*/
  function validateEmail(email) {
    var re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(String(email).toLowerCase())) {
      setFormMessage("Email not valid");
      return false;
    }
    setFormMessage(""); // Clear error if validation passes
    return true;
  }

  /* responsible for handling vote using name and email form*/
  const handleVote = async (e) => {
    e.preventDefault();
    const userName = e.target.elements.userName.value;
    const userEmail = e.target.elements.userEmail.value;
    // stops function when email format is not valid
    if (!validateEmail(userEmail)) {
      return;
    }
    /* utilizes cookies to c heck if the customer has voted in the last 7 days */
    const hasVoted = Cookies.get("hasVoted");
    if (hasVoted) {
      setIsLoading(true);
      alredyVotedToday();
      setTimeout(() => {
        setIsLoading(false);
      }, 5000);
      return;
    }
    if (!captchaValue) {
      setFormMessage("Please complete the captcha.");
      return;
    }
    console.log("this is the captcha:", captchaValue);

    try {
      setIsLoading(true);
      const response = await fetch(`${config.API_URL}/formVote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goalId: id,
          userName,
          userEmail,
          captchaValue,
        }),
      });

      if (response.status === 200) {
        voteSuccess();
        Cookies.set("hasVoted", "true", { expires: 1 });
      } else if (response.status === 403) {
        alredyVoted();
      } else {
        throw new Error("Error voting. Response: " + JSON.stringify(response));
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        window.scrollTo(0, 0);
      }, voteMessageTimeOut);
    }
  };

  /* Function used to cast a vote with google credentials ( no login session required)*/
  async function voteWithGoogle(tokenId, goalId) {
    try {
      const voteResponse = await fetch(`${config.API_URL}/voteWithGoogle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenId, goalId }),
      });

      const data = await voteResponse.json();

      if (voteResponse.status === 200) {
        setGoalVoted(data.goalVoted);
        voteSuccess();
      } else if (voteResponse.status === 403) {
        alredyVoted();
      } else {
        console.error("Error:", data.message);
      }
    } catch (error) {
      console.error("Error voting with Google:", error);
    }
  }

  /* Function to handles failure of Google Login */
  const onGoogleLoginFailure = (error) => {
    console.log("Google login failed:", error);
  };

  /* Function executed when login with google is executed by the user, calling voteWithGoogle function to cast vote in case of succefull authentication  */
  const handleGoogleVote = async (response) => {
    console.log("Google login successful. Response:", response);
    const { tokenId } = response;

    try {
      setIsLoading(true);

      try {
        await voteWithGoogle(tokenId, id);
      } catch (error) {
        console.error("Login with Google failed:", error);
      } finally {
        setTimeout(async () => {
          setIsLoading(false);
          window.scrollTo(0, 0);
          setVoteMessage("");
        }, voteMessageTimeOut); // 2000 milliseconds (2 seconds) delay
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error);

      setIsLoading(false);
    }
  };

  return (
    <div
      className={`goal-card ${
        isMediaLoaded ? "goal-card-loaded" : "goal-card-blur"
      }`}
    >
      <div className="goal-title">{title}</div>
      <div className="goal-description">{description}</div>
      <div className="goal-video">
        <LazyLoad offset={offset} once placeholder={<div>Loading...</div>}>
          <iframe
            onLoad={() => setIsMediaLoaded(true)}
            src={url}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          />
        </LazyLoad>
      </div>
      {isFormVisible && (
        <div className={`goal-vote-form ${isFormVisible ? "visible" : ""}`}>
          <div className="googleLogin">
            {" "}
            {/* Google login button */}
            <GoogleLogin
              className="goal-vote-google-button"
              clientId={process.env.GOOGLE_CLIENT_ID} // Google client ID
              buttonText="Vote with Google" // Text for the button
              onSuccess={handleGoogleVote} // Function to handle successful login
              onFailure={onGoogleLoginFailure} // Function to handle failed login
              cookiePolicy={"single_host_origin"} // Cookie policy
            />
          </div>
          {!isFormEntriesVisible && formMessage && (
            <div className="goal-form-message">{formMessage}</div>
          )}
          <div className="goal-divider">
            <span>OR</span>
          </div>
          {!isFormEntriesVisible && (
            <button onClick={showEntriesForm} className="goal-showForm-button">
              Enter your details
            </button>
          )}

          {isFormEntriesVisible && (
            <form onSubmit={handleVote}>
              <input
                className="goal-input-class"
                name="userName"
                type="text"
                placeholder="Name"
              />
              <input
                className="goal-input-class"
                name="userEmail"
                type="email"
                placeholder="Email"
              />
              <ReCAPTCHA
                className="goal-recaptcha"
                sitekey="6LcGj0AnAAAAACT9G3Qxp8Db0e74nQjqKyxVRLmj"
                onChange={(value) => {
                  setCaptchaValue(value);
                }}
              />

              {formMessage && (
                <div className="goal-form-message">{formMessage}</div>
              )}
              <input
                type="submit"
                value="Submit Vote"
                className="vote-button-red "
              />
            </form>
          )}
        </div>
      )}

      {!isFormVisible && (
        <button className="vote-button" onClick={showForm}>
          Vote
        </button>
      )}
    </div>
  );
}

export default Goal;
