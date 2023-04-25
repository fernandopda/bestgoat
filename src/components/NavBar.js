import React from "react";
import "../App.css";

const NavBar = ({ onLogout }) => {
  const handleLogout = () => {
    localStorage.removeItem("userSave");
    onLogout();
  };

  return (
    <nav className="nav-bar">
      <div className="nav-logo">
        <h2> Top Goals Ever! </h2>
      </div>
      <div className="nav-links">
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default NavBar;
