/**
 * This file defines the `googleLogin` function, which manages the Google OAuth2 login process.
 *
 * When a user tries to login through Google on the frontend, the frontend sends a Google ID token to this backend function. This function verifies the Google ID token with Google's servers,extracts the user's email and Google ID from the token's payload, and checks if a user with this Google ID exists in the database.
 *
 * If such a user doesn't exist, a new user is created in the database. If the user does exist, the function simply proceeds to the next step without creating a new user.
 *
 * In either case, the function then creates a JSON Web Token (JWT), signs it, and sends it back in the response. This token is typically used on the frontend to maintain the user's session.
 */


const jwt = require("jsonwebtoken");
const createConnection = require("./db");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { promisify } = require("util");

const googleLogin = async (event) => {
  try {
    // Create a new database connection
    const connection = createConnection();

    // Extract tokenId from request
    const { tokenId } = JSON.parse(event.body);

    // Verify the token received from the client with Google's servers
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // Get user info from the verified token
    const { email, sub: googleId } = ticket.getPayload();

    // Check if the user exists in your database
    const query = "SELECT * FROM users WHERE google_id = ?";
    let [results] = await promisify(connection.query)(query, [googleId]);

    // If the user doesn't exist, create a new user
    if (!results || results.length === 0) {
      // Insert new user query
      const createUserQuery =
        "INSERT INTO users (email, google_id) VALUES (?, ?)";
      // Execute the query
      const [result] = await promisify(connection.query)(createUserQuery, [
        email,
        googleId,
      ]);

      // If user creation is successful, sign and send the JWT
      if (result) {
        const userId = result.insertId;
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN,
        });

        return {
          statusCode: 200,
          body: JSON.stringify({ token }),
        };
      } else {
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "It was not possible to create a new user",
          }),
        };
      }
    } else {
      // If the user does exist, sign and send the JWT
      const user = results[0];
      const userId = user.ID;
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          token,
          isAdmin: user.is_admin,
          userId,
          goalVoted: user.goalVoted,
        }),
      };
    }
  } catch (err) {
    // If there's an error in the try block, catch it and return a 500 error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "AUTH!! Internal Server Error",
        error: err.message,
        eventBody: event.body,
      }),
    };
  }
};

// Export the googleLogin function for use in other files
module.exports = { googleLogin };