/* component used to add new goals to the database when a admin user logs in */

import React, { useState } from "react";
import config from "../config";

const AdminPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoURL, setVideoURL] = useState("");

  /* calls server function when the details of a new goal are filled in the admin form */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Call the API to add the goal to the database
    try {
      const response = await fetch(`${config.API_URL}/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userSave")}`,
        },
        body: JSON.stringify({ title, description, videoURL, votes: 0 }),
      });

      const data = await response.json();

      if (response.status === 201) {
        console.log("Goal created successfully:", data);
        // Clear the input fields after submitting
        setTitle("");
        setDescription("");
        setVideoURL("");
      } else {
        console.error("Error:", data.message);
      }
    } catch (err) {
      console.error("Error adding goal:", err);
    }
  };

  return (
    <div className="admin-page-container">
      <h2>Add a new goal</h2>
      <form className="admin-page-form" onSubmit={handleSubmit}>
        <div className="admin-page-form-group">
          <label htmlFor="title">Title:</label>
          <input
            className="admin-page-input-field"
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="admin-page-form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            className="admin-page-input-field"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="admin-page-form-group">
          <label htmlFor="videoURL">Video URL:</label>
          <input
            className="admin-page-input-field"
            type="text"
            id="videoURL"
            value={videoURL}
            onChange={(e) => setVideoURL(e.target.value)}
          />
        </div>
        <button className="admin-page-submit-button" type="submit">
          Add Goal
        </button>
      </form>
    </div>
  );
};

export default AdminPage;
