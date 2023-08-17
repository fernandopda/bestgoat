/*
The Goal.js component represents individual goals in the voting system. It includes details about the goal, such as its title, description, and video URL. This component uses states to handle the loading of media and user interactions with the voting system.

*/

import React, { useState } from "react";
import LazyLoad from "react-lazyload";
import "../App.css";
import soccer_ball from "./img/soccer_ball2.svg";
import config from "../config";
import { GoogleLogin } from "react-google-login";
import Cookies from "js-cookie";
import ReCAPTCHA from "react-google-recaptcha";
import { useEffect } from "react";

// The Goal component represents a single goal in the application.
// It shows details about the goal, as well as providing functionality to vote for the goal.
function Goal({
  id,
  title,
  description,
  url,
  votes,
  openLoginPopup,
  setIsAuthenticated,
  setIsVoted,
  setGoalVoted,
  token,
  userId,
  setIsAdmin,
  onLoginSuccess,
  setUserId,
  setUserToken,
  setScrollTop,
}) {
  // These states are used to control loading states and media loading states.
  const [isLoading, setIsLoading] = useState(false);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isFormEntriesVisible, setIsFormEntriesVisible] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [captchaValue, setCaptchaValue] = useState(null);
  const [offset, setOffset] = useState(800);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showForm = () => {
    setIsFormVisible(true);
  };
  const showEntriesForm = () => {
    setIsFormEntriesVisible(true);
  };

  const voteSuccess = () => {
    setFormMessage(
      "Thank you for voting! You will now be redirected for the top 10 goals.."
    );
    setTimeout(() => {
      setIsVoted(true);
      setIsAuthenticated(true);
      setScrollTop(true);
    }, 3500);
  };
  const alredyVoted = () => {
    setFormMessage(
      "This user has already voted! You will now be redirected for the top 10 goals.. "
    );
    setTimeout(() => {
      setIsVoted(true);
      setIsAuthenticated(true);
      setScrollTop(true);
    }, 3500);
  };

  /* validades when user enter an email on the form */
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

  /* handleVote function is responsible for voting functionality.
  it sends a POST request to the /vote endpoint to vote for a particular goal.*/
  const handleVote = async (e) => {
    e.preventDefault();
    const userName = e.target.elements.userName.value;
    const userEmail = e.target.elements.userEmail.value;
    // stops function when email format is not valid
    if (!validateEmail(userEmail)) {
      return;
    }
    //check if user has already voted in the last 7 days
    const hasVoted = Cookies.get("hasVoted");
    // if (hasVoted) {
    //   setError(
    //     "You have already voted today, I will redirected to our top 10..."
    //   );
    //   setTimeout(() => {
    //     setIsAuthenticated(true);
    //     setIsVoted(true);
    //   }, 2000);
    //   return;
    // }
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
        body: JSON.stringify({ goalId: id, userName, userEmail, captchaValue }),
      });
      const data = await response.json();
      if (response.status === 200) {
        voteSuccess();
        // Cookies.set("hasVoted", "true", { expires: 1 });
      } else if (response.status === 403) {
        alredyVoted();
      } else {
        throw new Error("Error voting. Response: " + JSON.stringify(response));
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsLoading(false);
    }
  };
  /* Login With Google */

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

  /* Function to handles google vote */
  const handleGoogleVote = async (response) => {
    console.log("Google login successful. Response:", response);
    const { tokenId } = response;

    try {
      setIsLoading(true);
      await voteWithGoogle(tokenId, id); // passing the goal's id here
    } catch (error) {
      console.error("Login with Google failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`goal-card ${
        isMediaLoaded ? "goal-card-loaded" : "goal-card-blur"
      }`}
    >
      {isLoading && (
        // Loading overlay for when the voting process is ongoing
        <div className="loading-overlay">
          <div className="ball-container">
            <img
              src={soccer_ball}
              alt="Soccer Ball"
              className="soccer-ball-spinner"
            />
          </div>
        </div>
      )}
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

/* Function to authenticate with Google and log in - (it is not being used in this version of the app) 
 async function loginWithGoogle(tokenId) {
  const authResponse = await fetch(`${config.API_URL}/googlelogin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tokenId }),
  });

  const data = await authResponse.json();

  // If response status is 200 (sucessfull), set necessary user details and close the popup
  if (authResponse.status === 200) {
    localStorage.setItem("userSave", data.token);
    setIsAdmin(data.isAdmin);
    setUserToken(data.token);
    onLoginSuccess();
    setUserId(data.userId);

    if (data.goalVoted > 0) {
      setIsVoted(true);
      setGoalVoted(data.goalVoted);
      window.alert(
        "You've already voted, we are redirecting you to our top 10..."
      );
    } else {
      setIsVoted(false);
      window.alert(
        "You are now logged in, please choose wisely as you only can vote once, enjoy!"
      );
    }
  } else {
    console.error("Error:", data.message);
  }
} */

/* Function to handle successful Google Login
  const handleGoogleLogin = async (response) => {
    const { tokenId } = response;

    try {
      setIsLoading(true);
      await loginWithGoogle(tokenId);
    } catch (error) {
      console.error("Login with Google failed:", error);
    } finally {
      setIsLoading(false);
    }
  };
  */
