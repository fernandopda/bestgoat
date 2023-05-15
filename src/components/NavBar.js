import React, { forwardRef } from "react";
import "../App.css";
import logo from "./img/login.png";

const NavBar = forwardRef(
  (
    {
      isAuthenticated,
      openLogin,
      onLogout,
      searchTerm,
      setSearchTerm,
      isVoted,
    },
    ref
  ) => {
    return (
      <nav ref={ref} className="nav-bar">
        {isAuthenticated && isVoted ? (
          <>
            <div className="ranking-nav-left">
              <img className="ranking-nav-login-logo" src={logo} />
              <a className="ranking-nav-link" onClick={onLogout}>
                LOGOUT
              </a>
              <span className="ranking-nav-title1">Best Football Goals</span>
              <span className="ranking-nav-title2">OF ALL TIME</span>
              <span className="ranking-nav-top10">TOP 10 </span>
              {/* 
              <button className="nav-btn" onClick={onLogout}>
                Logout
              </button> */}
            </div>
            <span className="ranking-nav-top10-responsive">TOP 10 </span>
          </>
        ) : (
          <>
            <div className="nav-left">
              <img className="nav-login-logo" src={logo} />

              {isAuthenticated ? (
                <>
                  <a className="nav-link" onClick={onLogout}>
                    {" "}
                    LOGOUT{" "}
                  </a>
                </>
              ) : (
                <>
                  <a className="nav-link" onClick={openLogin}>
                    {" "}
                    LOGIN{" "}
                  </a>
                </>
              )}

              <span className="nav-title1">Best Football Goals</span>
              <span className="nav-title2">OF ALL TIME</span>
              <div className="nav-search">
                <input
                  type="text"
                  placeholder="Search for a goal.."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <p className="nav-top-goals-msg"></p>
            </div>
            <div className="nav-search-responsive">
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
