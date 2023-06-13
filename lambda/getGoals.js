/**
 * This module provides a function `getGoals` that retrieves all goals from the database and returns them in a random order.
 * In case of success, it returns a response with a status code of 200 and the goals in the response body.
 * If an error occurs, it logs the error and returns a response with a status code of 500.
 */

const { promisify } = require("util");
require("dotenv").config();
const createConnection = require("./db");

const connection = createConnection();

// Promisify the `query` method from the `connection` object,
// so that it returns promises that can be awaited
const queryAsync = promisify(connection.query).bind(connection);

// The `getGoals` function fetches all records from the `goals` table in a random order
const getGoals = async (event) => {
  // The inner `getGoals` function executes the actual database query
  const getGoals = async () => {
    try {
      // Execute the query and await the result
      const result = await queryAsync("SELECT * FROM goals ORDER BY RAND()");

      // Return the results in the response body with a status code of 200 (OK)
      return {
        statusCode: 200,
        body: JSON.stringify(result),
        headers: {
          "Access-Control-Allow-Origin":
            process.env.ACCESS_CONTROL_ALLOW_ORIGIN,
        },
      };
    } catch (err) {
      console.error(err);

      // In case of an error, return a status code of 500 (Internal Server Error)
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Internal Server Error", err }),
        headers: {
          "Access-Control-Allow-Origin":
            process.env.ACCESS_CONTROL_ALLOW_ORIGIN,
        },
      };
    }
  };

  try {
    // Call the inner `getGoals` function and await its result
    const response = await getGoals();
    return response;
  } catch (error) {
    // If an error occurs while calling `getGoals`, return the error
    return error;
  }
};

// Export the `getGoals` function so it can be imported and used in other modules
module.exports = { getGoals };
