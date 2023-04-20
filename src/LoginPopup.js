import React, { useState } from "react";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import GoogleLogin from "react-google-login";
import FacebookLogin from "react-facebook-login";
import ReCAPTCHA from "react-google-recaptcha";
import "./App.css";

const LoginPopup = ({ isOpen, onRequestClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = (e) => {
    e.preventDefault();
    // Handle email login here
  };

  const responseGoogle = (response) => {
    console.log(response);
    // Handle Google login here
  };

  const responseFacebook = (response) => {
    console.log(response);
    // Handle Facebook login here
  };

  const handleRecaptcha = (value) => {
    console.log("Captcha value:", value);
    // Verify captcha value here
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Login Modal"
      className="login-modal"
    >
      <button onClick={onRequestClose} className="close-modal">
        <FontAwesomeIcon icon={faTimes} />
      </button>
      <h2>Login</h2>
      <form onSubmit={handleEmailLogin}>
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
      </form>
      <div className="social-login">
        <div className="googleLogin">
          <GoogleLogin
            clientId="YOUR_GOOGLE_CLIENT_ID"
            buttonText="Login with Google"
            onSuccess={responseGoogle}
            onFailure={responseGoogle}
            cookiePolicy={"single_host_origin"}
          />
        </div>
        <div className="facebookLogin">
          <FacebookLogin
            appId="YOUR_FACEBOOK_APP_ID"
            fields="name,email,picture"
            callback={responseFacebook}
            icon="fa-facebook"
          />
        </div>
      </div>
    </Modal>
  );
};

export default LoginPopup;
