import React, { useState } from "react";
import { GoogleLogin } from "react-google-login";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
// import GoogleLogin from "react-google-login";
// import FacebookLogin from "react-facebook-login";
// import ReCAPTCHA from "react-google-recaptcha";

import "../App.css";

const LoginPopup = ({ isOpen, onRequestClose, onLoginSuccess }) => {
  // useEffect(() => {
  //   function start() {
  //     gapi.client.init({
  //       clientId: process.env.GOOGLE_CLIENT_ID,
  //       scope: "email",
  //     });
  //   }

  //   gapi.load("client:auth2", start);
  // }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRecaptcha = (value) => {
    console.log("Captcha value:", value);
    // Verify captcha value here
  };
  async function loginWithGoogle(tokenId) {
    // Send the tokenId to your server to authenticate the user and get an access token for your app
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
      // Save the received token in localStorage
      localStorage.setItem("userSave", data.token);

      // Call the onLoginSuccess function from the prop
      console.log("Logged in with Google");
      onLoginSuccess();
    } else {
      // Show error message
      console.error("Error:", data.message);
    }
  }

  const onGoogleLoginFailure = (error) => {
    console.log("Google login failed:", error);
    // Handle the error as appropriate for your application
  };
  const handleGoogleLogin = async (response) => {
    // Extract the user information from the Google login response
    const { tokenId } = response;
    try {
      // Call your existing login function with the extracted information
      await loginWithGoogle(tokenId);
      // console.log(tokenId);
    } catch (error) {
      // Handle the error
      console.error("Login with Google failed:", error);
    }
  };

  // async function handleEmailLogin(e) {
  //   e.preventDefault();

  //   const response = await fetch("http://localhost:5000/api/auth/login", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ email, password }),
  //   });

  //   const data = await response.json();
  //   if (response.status === 200) {
  //     // Save the received token in localStorage
  //     localStorage.setItem("userSave", data.token);

  //     // Call the onLoginSuccess function from the prop
  //     console.log("Logado");
  //     onLoginSuccess();
  //   } else {
  //     // Show error message
  //     console.error("Error:", data.message);
  //   }
  // }

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
      {/* <form onSubmit={handleEmailLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <ReCAPTCHA
          sitekey="YOUR_RECAPTCHA_SITE_KEY"
          onChange={handleRecaptcha}
        />
        <button type="submit">Login</button>
      </form> */}
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
