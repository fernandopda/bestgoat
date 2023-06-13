/**
 * The `LoginPopup` component is a modal that enables the user to log in with Google authentication.
 *
 * Props:
 * - `isOpen`: Controls the visibility of the modal.
 * - `closeLoginPopup`: Function that closes the modal.
 * - `setIsVoted`: Function that updates whether the user has voted.
 * - `onLoginSuccess`: Function that runs when the user successfully logs in.
 * - `setIsAdmin`: Function that updates whether the user is an admin.
 * - `setGoalVoted`: Function that updates the ID of the goal the user voted for.
 * - `setUserToken`: Function that saves the user token.
 * - `setUserId`: Function that saves the user ID.
 *
 * State:
 * - `isLoading`: Indicates whether a login request is in progress.
 *
 * Upon a successful login, it saves the user token, user ID, admin status, and the voted goal ID in the local state.
 */

import React, { useState } from "react";
import { GoogleLogin } from "react-google-login";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import config from "../config";
import "../App.css";
import soccer_ball from "./img/soccer_ball2.svg";

const LoginPopup = ({
  isOpen,
  closeLoginPopup,
  setIsVoted,
  onLoginSuccess,
  setIsAdmin,
  setGoalVoted,
  setUserToken,
  setUserId,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Function to authenticate with Google and log in
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
  }

  // Function to handle failure of Google Login
  const onGoogleLoginFailure = (error) => {
    console.log("Google login failed:", error);
  };

  // Function to handle successful Google Login
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

  // Rendering the component
  return (
    <Modal
      isOpen={isOpen} // Prop to control whether modal is open
      onRequestClose={closeLoginPopup} // Function to run when modal should close
      contentLabel="Login Modal" // Aria label for accessibility
      className="login-modal" // CSS class
      ariaHideApp={false} // Accessibility setting
    >
      {isLoading && (
        <div className="loading-overlay">
          {" "}
          {/* Overlay for loading state */}
          <div className="ball-container">
            <img
              src={soccer_ball} // Display a soccer ball image
              alt="Soccer Ball"
              className="soccer-ball-spinner" // Add spinning animation through CSS
            />
          </div>
        </div>
      )}
      <button onClick={closeLoginPopup} className="close-modal">
        {" "}
        {/* Button to close the modal */}
        <FontAwesomeIcon icon={faTimes} /> {/* 'X' icon from FontAwesome */}
      </button>
      <h2>Login</h2> {/* Modal title */}
      <div className="social-login">
        <div className="social-login-text">
          To vote and view top-voted goals, please log in. One vote per user!
        </div>

        <div className="googleLogin">
          {" "}
          {/* Google login button */}
          <GoogleLogin
            clientId={process.env.GOOGLE_CLIENT_ID} // Google client ID
            buttonText="Login with Google" // Text for the button
            onSuccess={handleGoogleLogin} // Function to handle successful login
            onFailure={onGoogleLoginFailure} // Function to handle failed login
            cookiePolicy={"single_host_origin"} // Cookie policy
          />
        </div>
      </div>
    </Modal>
  );
};

export default LoginPopup;
