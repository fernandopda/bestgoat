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

  async function loginWithGoogle(tokenId) {
    const authResponse = await fetch(`${config.API_URL}/googlelogin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tokenId }),
    });

    const data = await authResponse.json();

    if (authResponse.status === 200) {
      localStorage.setItem("userSave", data.token);
      setIsAdmin(data.isAdmin);
      setUserToken(data.token);
      onLoginSuccess();
      setUserId(data.userId);

      if (data.goalVoted > 0) {
        setIsVoted(true);
        setGoalVoted(data.goalVoted);
      } else {
        setIsVoted(false);
      }
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
      setIsLoading(true);
      await loginWithGoogle(tokenId);
    } catch (error) {
      console.error("Login with Google failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeLoginPopup}
      contentLabel="Login Modal"
      className="login-modal"
      ariaHideApp={false}
    >
      {isLoading && (
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

      <button onClick={closeLoginPopup} className="close-modal">
        <FontAwesomeIcon icon={faTimes} />
      </button>
      <h2>Login</h2>
      <div className="social-login">
        <div className="social-login-text">
          Hey there! 👋 To ensure every vote counts, we ask that you log in
          before voting. This helps us keep things fair and square by allowing
          each account a single vote. After casting your vote, you can check the
          top 10 goals voted by users.
        </div>

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
