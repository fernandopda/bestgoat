/**
 * This module provides a function for handling voting on goals.
 * The function retrieves the vote information from the request body,
 * checks if the user has already voted, and if not, increments the vote count for the specified goal and sets the user's voted status. If an error occurs during the process, an error message is returned.
 * Note: This function expects to receive an event with a request body containing userId and goalId.
 */

const { promisify } = require("util");
const createConnection = require("./db");
require("dotenv").config();

// The `vote` function is responsible for handling the voting operation
const vote = async (event) => {
  try {
    const connection = createConnection();

    let body;
    try {
      // Parse the incoming event body to get the user's and goal's IDs
      body = JSON.parse(event.body);
    } catch (err) {
      console.log("Failed passing the body", event.body);

      // If the parsing fails, throw the error
      throw err;
    }

    const userId = body.userId;
    const goalId = body.goalId;

    // SQL query to get the user by ID
    const query = "SELECT * FROM users WHERE id = ?";

    // Execute the query and await the result
    const [results] = await promisify(connection.query).bind(connection)(
      query,
      [userId]
    );

    // If a user with the given ID exists
    if (results) {
      const user = results;

      // Check if the user has already voted
      if (user.goalVoted > 0) {
        // If so, return an error message
        return {
          statusCode: 403,
          body: JSON.stringify({ message: "User has already voted" }),
          headers: {
            "Access-Control-Allow-Origin":
              process.env.ACCESS_CONTROL_ALLOW_ORIGIN,
            "Access-Control-Allow-Headers":
              "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
          },
        };
      } else {
        // If the user has not voted yet, update the votes for the goal and mark the user as having voted
        const updateVotesQuery =
          "UPDATE goals SET votes = votes + 1 WHERE id = ?; UPDATE users SET goalVoted = ? WHERE id = ?;";

        await promisify(connection.query).bind(connection)(updateVotesQuery, [
          goalId,
          goalId,
          userId,
        ]);

        // Return a success message
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "Vote successfully submitted",
            goalVoted: goalId,
          }),
          headers: {
            "Access-Control-Allow-Origin":
              process.env.ACCESS_CONTROL_ALLOW_ORIGIN,
            "Access-Control-Allow-Headers":
              "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
          },
        };
      }
    } else {
      // If no user with the given ID exists, return an error message
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Internal Server Error, went" }),
        headers: {
          "Access-Control-Allow-Origin":
            process.env.ACCESS_CONTROL_ALLOW_ORIGIN,
          "Access-Control-Allow-Headers":
            "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
          "Access-Control-Allow-Methods": "OPTIONS,POST",
        },
      };
    }
  } catch (err) {
    // If an error occurs during the process, log it and return an error message
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error, didn't go in",
        err,
      }),
      headers: {
        "Access-Control-Allow-Origin": process.env.ACCESS_CONTROL_ALLOW_ORIGIN,
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
      },
    };
  }
};

// Export the `vote` function
module.exports = { vote };
