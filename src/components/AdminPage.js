import React, { useState } from "react";

const AdminPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoURL, setVideoURL] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Call the API to add the goal to the database
    try {
      const response = await fetch("http://localhost:5000/api/auth/addGoals", {
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
    <div>
      <h2>Add a new goal</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Title:</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label htmlFor="videoURL">Video URL:</label>
        <input
          type="text"
          id="videoURL"
          value={videoURL}
          onChange={(e) => setVideoURL(e.target.value)}
        />
        <button type="submit">Add Goal</button>
      </form>
    </div>
  );
};

export default AdminPage;
