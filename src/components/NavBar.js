/* component handless nav bar of the page */

import React, { forwardRef } from "react";
import "../App.css";
import logo from "./img/login.png";
import navText from "./img/navBarText.png";
import { IconSearch } from "./img/Icons";


const NavBar = forwardRef(
  (
    {
      isAuthenticated,
      openLogin,
      onLogout,
      searchTerm,
      setSearchTerm,
      isVoted,
      setSearchActive
    },
    ref
  ) => {
    //  sets value for searchTeam on searchbar
    const onSearchChange = (e) => {

      setSearchTerm(e.target.value);
    };
    return (
      <nav ref={ref} className="nav-bar">
        {isAuthenticated && isVoted ? (
          <>
            <div className="ranking-nav-left">
              <img className="ranking-nav-login-logo" src={logo} />
              <a className="ranking-nav-link" onClick={onLogout}>
                GO BACK
              </a>

              {/* 
             <button className="nav-btn" onClick={onLogout}>
               Logout
             </button> */}
            </div>
            <div className="ranking-nav-center ">
              <img className="ranking-nav-text-img" src={navText} />
            </div>
          </>
        ) : (
          <>
            <div className="displaynone nav-left ">
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

              <p className="nav-top-goals-msg"></p>
            </div>
            <div className="nav-center">
              <div className="nav-text-img">
                <img src={navText} alt="Navigation Text" />
              </div>
              <div className="nav-search">
                <IconSearch />
                <input
                  type="text"
                  placeholder="Search for a goal.."
                  value={searchTerm}
                  onChange={onSearchChange}
                  onFocus={() => setSearchActive(true)}
                  onBlur={() => setSearchActive(false)}
                />
              </div>
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
