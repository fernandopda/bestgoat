const jwt = require("jsonwebtoken");
const createConnection = require("./db");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { promisify } = require("util");

const addCorsHeaders = (response) => {
  return {
    ...response,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
    },
  };
};

const googleLogin = async (event) => {
  try {
    const connection = createConnection();
    console.log("this is the event", event);
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      console.error("Failed to parse event body:", event.body);
      throw e;
    }
    console.log("event body:", event.body);
    const { tokenId } = body;

    const ticket = await client
      .verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
      .catch((error) => {
        console.error("Token verification failed:", error);
        throw new Error("Token verification failed");
      });

    const { email, sub: googleId } = ticket.getPayload();
    console.log("this is the google id:", googleId);

    const getUserByGoogleIdQuery = "SELECT * FROM users WHERE google_id = ?";
    let results;
    try {
      [results] = await promisify(connection.query).bind(connection)(
        getUserByGoogleIdQuery,
        [googleId]
      );
    } catch (e) {
      console.log("Failed to fetch data from database", e);
      throw e;
    }
    console.log("this is the results before ifss", results);

    if (!results || results.length === 0) {
      console.log("Will create a new user");
      const createUserQuery =
        "INSERT INTO users (email, google_id) VALUES (?, ?)";
      const [result] = await promisify(connection.query).bind(connection)(
        createUserQuery,
        [email, googleId]
      );

      if (result) {
        const userId = result.insertId;
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN,
        });

        return addCorsHeaders({
          statusCode: 200,
          body: JSON.stringify({ token }),
        });
      } else {
        return addCorsHeaders({
          statusCode: 500,
          body: JSON.stringify({
            message: "It was not possible to create a new user",
          }),
        });
      }
    } else {
      console.log("this is the result:", results);
      const user = results;
      console.log("this is the result from database fetch", results);
      const userId = user.ID;
      const goalVoted = user.goalVoted;
      console.log(
        "this is the userID from positive result found in database:",
        userId
      );
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      return addCorsHeaders({
        statusCode: 200,
        body: JSON.stringify({
          token,
          isAdmin: user.is_admin,
          userId,
          goalVoted,
        }),
      });
    }
  } catch (err) {
    console.error("Google login failed:", err);

    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify({
        message: "AUTH!! Internal Server Error",
        error: err.message,
        eventBody: event.body,
      }),
    });
  }
};

module.exports = { googleLogin };
