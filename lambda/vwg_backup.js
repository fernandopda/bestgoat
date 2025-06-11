const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { promisify } = require("util");
require("dotenv").config();
const createConnection = require("./db");

const addCorsHeaders = (response) => {
  return {
    ...response,

    headers: {
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,X-Amz-Security-Token,Authorization,X-Api-Key,X-Requested-With,Accept",
      "Access-Control-Allow-Origin": "https://www.bestgoat.net",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
      "Access-Control-Allow-Credentials": "true",
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  };
};

// Main function for Google Login
const voteWithGoogle = async (event) => {
  try {
    // Create a new database connection
    const connection = createConnection();
    console.log("MySQL connection:", connection);

    // Extract tokenId and goalId from request
    const { tokenId, goalId } = JSON.parse(event.body);
    console.log("TOKEN", tokenId);
    console.log("GOALID", goalId);

    // Verify the token received from the client with Google's servers
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      requiredAudience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, sub: googleId } = ticket.getPayload();
    console.log("GOOOGLE details", email, name, goalId);

    // Query for the user with the given email
    const query = "SELECT * FROM users WHERE email = ?";
    let [results] = await promisify(connection.query).bind(connection)(query, [
      email,
    ]);
    console.log("RESULTADOS", [results]);

    // If the user doesn't exist, create a new user and cast a vote
    if (!results || results.length === 0) {
      console.log("ENTROU NAO RESULT");
      // Insert new user query and update vote count for the goal
      const createUserQuery =
        "INSERT INTO users (name, email, google_id, goalVoted) VALUES (?, ?, ?, ?); UPDATE goals SET votes = votes + 1 WHERE id = ?";
      // Execute the query
      await promisify(connection.query).bind(connection)(createUserQuery, [
        name,
        email,
        googleId,
        goalId,
        goalId,
      ]);
      return addCorsHeaders({
        statusCode: 200,
        body: JSON.stringify({ message: "New user created, Vote successful!" }),
      });
    } else {
      const user = results;
      console.log("RESULTS!!!", results);
      console.log("THIS IS THE GOAL VOTED", user.goalVoted);
      console.log("Results 1", results[0]);

      return addCorsHeaders({
        statusCode: 403,
        body: JSON.stringify({ message: "User has already voted" }),
      });
    }
  } catch (err) {
    console.error(err); // Log the full error object
    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify({
        message: "AUTH!! Internal Server Error",
        error: err.message,
      }),
    });
  }
};

// Export the voteWithGoogle function for use in other files
module.exports = { voteWithGoogle };
