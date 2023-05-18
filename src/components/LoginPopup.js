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
  setUserToken,
  setUserId: setUserId,
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
      console.log(data);
      setIsAdmin(data.isAdmin);
      setUserToken(data.token);
      console.log("USER ID IS:!!", data.userId);
      console.log(data.isAdmin);
      console.log("Logged in with Google");
      onLoginSuccess();
      setUserId(data.userId);
      console.log(data.goalVoted);
      console.log(data.goalVoted);
      if (data.goalVoted > 0) {
        setIsVoted(true);
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

// const fetchVoteStatus = async (userId) => {
//   try {
//     const response = await fetch(
//       "https://zcw74z8g88.execute-api.ap-southeast-2.amazonaws.com/test/checkvote",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ userId }),
//       }
//     );

//     if (response.status === 200) {
//       const data = await response.json();
//       console.log("data is this:", data);
//       if (data.goalVotedId > 0) {
//         console.log("data is this:", data);
//         console.log("User has already voted GOAL ID:", data.goalVotedId);
//         setIsVoted(true);
//         console.log(setIsVoted);
//         // Use data.goalVotedId to get the voted goal ID and handle accordingly
//       } else {
//         console.log("User has not voted yet");
//         setIsVoted(false);
//       }
//     } else {
//       throw new Error("Error fetching vote status", response);
//     }
//   } catch (error) {
//     console.error("Error fetching vote status:", error);
//   }
// };
