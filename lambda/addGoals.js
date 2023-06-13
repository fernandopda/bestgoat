/**
 * This module exports the `addGoals` function, which is used to add new goals into a database.
 *
 * The function is triggered by an HTTP event, and it expects the request body to carry the title,description, video URL, and votes for the goal.
 *
 * It then inserts these goal details into the database. If the goal is inserted successfully, the function sends back an HTTP response with a status code of 201 and a message confirming the successful creation of the goal.
 *
 * If an error occurs during this process, it's caught, logged, and an HTTP response with a status code of 500 is returned.
 */

const createConnection = require("./db");
const { promisify } = require("util");

// The addGoals function is an async function to allow use of await inside it
const addGoals = async (event) => {
  try {
    const connection = createConnection();
    const queryAsync = promisify(connection.query).bind(connection);
    // Parse the incoming event body to get the goal data
    const body = JSON.parse(event.body);

    // Destructure the parsed body to get the necessary properties
    const { title, description, videoURL, votes } = body;

    // SQL query for inserting a new goal into the database
    const query =
      "INSERT INTO goals (title, description, url, votes) VALUES (?, ?, ?, ?)";

    // Execute the query using the promisified connection.query method
    const result = await queryAsync(query, [
      title,
      description,
      videoURL,
      votes,
    ]);

    // Return a successful response with the inserted goal's ID
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Goal created successfully",
        id: result.insertId,
      }),
      headers: {
        "Access-Control-Allow-Origin": process.env.ACCESS_CONTROL_ALLOW_ORIGIN,
      },
    };
  } catch (err) {
    // If there's an error in the try block, catch it, log it, and return an error response
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error", err }),
      headers: {
        "Access-Control-Allow-Origin": process.env.ACCESS_CONTROL_ALLOW_ORIGIN,
      },
    };
  }
};

// Export the addGoals function for use in other files
module.exports = { addGoals };
