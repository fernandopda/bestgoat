import React, { forwardRef } from "react";
import "../App.css";

const NavBar = forwardRef(
  (
    { isAuthenticated, openLogin, onLogout, searchTerm, setSearchTerm },
    ref
  ) => {
    return (
      <nav ref={ref} className="nav-bar">
        {isAuthenticated ? (
          <>
            <div className="nav-left">
              <h2 className="nav-title">Best Football Goals Ever</h2>
              {/* 
              <button className="nav-btn" onClick={onLogout}>
                Logout
              </button> */}
            </div>
          </>
        ) : (
          <>
            <div className="nav-left">
              <h2 className="nav-title">Best Football Goals Ever</h2>
              <p className="top-goals-msg">
                Login to vote and check the top 10 best goals ever!
              </p>
              <button className="nav-btn" onClick={openLogin}>
                Login
              </button>
            </div>
            <div className="search">
              <input
                type="text"
                placeholder="Search for a goal.."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </>
        )}
      </nav>
    );
  }
);

export default NavBar;
