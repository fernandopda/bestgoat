import React, { useState } from "react";
import config from "../config";  // Your API_URL config
import "../App.css";

const AdminPage = () => {
  // States for manual add form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoURL, setVideoURL] = useState("");

  // States for suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch and refresh suggestions list (GET /getSuggestions)
  const fetchSuggestionsList = async () => {
    try {
      const response = await fetch(`${config.API_URL}/getSuggestions`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userSave")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch suggestions");
      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setError(err.message);
    }
  };

  // Function for "Give me suggestions" button (POST /fetchSuggestions)
  const handleFetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.API_URL}/fetchSuggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userSave")}`,
        },
        body: JSON.stringify({}),  // Empty body; add params if needed later
      });
      if (!response.ok) throw new Error("Failed to generate suggestions");
      const data = await response.json();
      console.log("Suggestions generated:", data);
      // Refresh the list after generation
      await fetchSuggestionsList();
    } catch (err) {
      console.error("Error generating suggestions:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function for approve/decline (POST /handleSuggestion)
  const handleSuggestionAction = async (id, action) => {
    try {
      const response = await fetch(`${config.API_URL}/handleSuggestion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userSave")}`,
        },
        body: JSON.stringify({ suggestionId: id, action }),
      });
      if (!response.ok) throw new Error(`Failed to ${action} suggestion`);
      // Refresh the list after action
      await fetchSuggestionsList();
    } catch (err) {
      console.error(`Error on ${action}:`, err);
      setError(err.message);
    }
  };

  // Function for manual add (POST /addGoals)
  const handleManualAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${config.API_URL}/addGoals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userSave")}`,
        },
        body: JSON.stringify({ title, description, videoURL, votes: 0 }),
      });
      if (!response.ok) throw new Error("Failed to add goal");
      setTitle("");
      setDescription("");
      setVideoURL("");
      console.log("Goal added successfully");
    } catch (err) {
      console.error("Error adding goal:", err);
      setError(err.message);
    }
  };

  return (
    <div className="admin-page-container">
      {/* Manual Add Section */}
      <section className="admin-page-manual-add">
        <h2>Add a New Goal Manually</h2>
        <form className="admin-page-form" onSubmit={handleManualAdd}>
          <div className="admin-page-form-group">
            <label htmlFor="title">Title</label>
            <input
              className="admin-page-input-field"
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="admin-page-form-group">
            <label htmlFor="description">Description</label>
            <textarea
              className="admin-page-input-field"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="admin-page-form-group">
            <label htmlFor="videoURL">Video URL</label>
            <input
              className="admin-page-input-field"
              type="text"
              id="videoURL"
              value={videoURL}
              onChange={(e) => setVideoURL(e.target.value)}
              required
            />
          </div>
          <button className="admin-page-submit-button" type="submit">Add Goal</button>
        </form>
      </section>

      {/* Suggestions Section */}
      <section className="admin-page-suggestions">
        <h2>Suggested Goals</h2>
        <button
          className="admin-page-fetch-button"
          onClick={handleFetchSuggestions}
          disabled={loading}
        >
          {loading ? "Generating Suggestions..." : "Give me suggestions"}
        </button>
        {error && <p className="admin-page-error">{error}</p>}
        {suggestions.length === 0 ? (
          <p className="admin-page-no-suggestions">No suggestions yet. Click the button to generate!</p>
        ) : (
          <div className="admin-page-suggestions-grid">
            {suggestions.map((sug) => (
              <div className="admin-page-suggestion-card" key={sug.id}>
                <img src={sug.thumbnail_url} alt={sug.title} className="admin-page-thumbnail" />
                <h3>{sug.title}</h3>
                <p className="admin-page-stats">
                  Score: {sug.score} | Views: {sug.views.toLocaleString()} | Likes: {sug.likes.toLocaleString()} | Comments: {sug.comment_count.toLocaleString()}
                </p>
                <p className="admin-page-reason">AI Reason: {sug.ai_reason}</p>
                <p className="admin-page-desc">{sug.description.substring(0, 150)}...</p>
                <a href={sug.url} target="_blank" rel="noopener noreferrer" className="admin-page-watch-link">
                  Watch Video
                </a>
                <div className="admin-page-actions">
                  <button onClick={() => handleSuggestionAction(sug.id, "approve")} className="admin-page-approve">Approve</button>
                  <button onClick={() => handleSuggestionAction(sug.id, "decline")} className="admin-page-decline">Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPage;