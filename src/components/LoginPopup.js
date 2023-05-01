import React, { useState } from "react";
import { GoogleLogin } from "react-google-login";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

import "../App.css";

const LoginPopup = ({
  isOpen,
  onRequestClose,
  setIsVoted,
  onLoginSuccess,
  setIsAdmin,
  setUserToken,
  setUserId: setUserId,
}) => {
  const fetchVoteStatus = async (userId) => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/checkVote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userId }),
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data.goalVotedId > 0) {
          console.log("User has already voted GOAL ID:", data.goalVotedId);
          setIsVoted(true);
          console.log(setIsVoted);
          // Use data.goalVotedId to get the voted goal ID and handle accordingly
        } else {
          console.log("User has not voted yet");
          setIsVoted(false);
        }
      } else {
        throw new Error("Error fetching vote status", response);
      }
    } catch (error) {
      console.error("Error fetching vote status:", error);
    }
  };

  async function loginWithGoogle(tokenId) {
    const authResponse = await fetch(
      "http://localhost:5000/api/auth/googleLogin",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenId }),
      }
    );

    const data = await authResponse.json();

    if (authResponse.status === 200) {
      localStorage.setItem("userSave", data.token);
      console.log(data);
      setIsAdmin(data.isAdmin);
      setUserToken(tokenId);
      setUserId(data.userId);
      console.log("USER ID IS:!!", data.userId);
      console.log(data.isAdmin);
      console.log("Logged in with Google");
      onLoginSuccess();
      fetchVoteStatus(data.userId);
    } else {
      console.error("Error:", data.message);
    }
  }

  const onGoogleLoginFailure = (error) => {
    console.log("Google login failed:", error);
  };

  const handleGoogleLogin = async (response) => {
    const { tokenId } = response;
    try {
      await loginWithGoogle(tokenId);
    } catch (error) {
      console.error("Login with Google failed:", error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Login Modal"
      className="login-modal"
      ariaHideApp={false}
    >
      <button onClick={onRequestClose} className="close-modal">
        <FontAwesomeIcon icon={faTimes} />
      </button>
      <h2>Login</h2>
      <div className="social-login">
        <div className="googleLogin">
          <GoogleLogin
            clientId={process.env.GOOGLE_CLIENT_ID}
            buttonText="Login with Google"
            onSuccess={handleGoogleLogin}
            onFailure={onGoogleLoginFailure}
            cookiePolicy={"single_host_origin"}
          />
        </div>
      </div>
    </Modal>
  );
};

export default LoginPopup;
