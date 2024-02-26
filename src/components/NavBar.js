/* component handless nav bar of the page */

import React, { forwardRef, useState } from "react";
import "../App.css";
import logo from "./img/login.png";
import navText from "./img/navBarText.png";
import { IconSearch, IconArrowBack } from "./img/Icons";


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
    const [isSearching, setIsSearhcing] = useState(false);
    //  sets value for searchTeam on searchbar
    const onSearchChange = (e) => {

      setSearchTerm(e.target.value);
    };

    return (
      <nav ref={ref} className="nav-bar">
        {isAuthenticated && isVoted ? (
          <>
            <div className="ranking-nav-left">
              <a onClick={onLogout}>
                <IconArrowBack />
              </a>

              {/* 
             <button className="nav-btn" onClick={onLogout}>
               Logout
             </button> */}
            </div>
            <div className="ranking-nav-center ">
              <span>TOP 10</span>
            </div>
          </>
        ) : (
          <>

            <div className="nav-center">
              {isSearching ? (
                <div></div>
              ) : (
                <>
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
            </div>
          </>
        )}
      </nav>
    );
  }
);

export default NavBar;
