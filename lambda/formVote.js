const createConnection = require("./db");
const { promisify } = require("util");

// Function to add CORS headers to your response
const addCorsHeaders = (response) => {
  return {
    ...response,
    headers: {
      "Access-Control-Allow-Origin": "https://www.bestgoat.net",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
      "Access-Control-Allow-Credentials": "true",
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  };
};

const formVote = async (event) => {
  try {
    const connection = createConnection();
    const { userName, userEmail, goalId } = JSON.parse(event.body);

    // tries to select email from database
    const query = "SELECT * FROM users WHERE email = ?";
    let [user] = await promisify(connection.query).bind(connection)(query, [
      userEmail,
    ]);
    console.log("This is the user", [user]);

    if (!user || user.length === 0) {
      // No user found with this email, creating new user
      const createUserQuery =
        "INSERT INTO users (name, email,goalVoted) VALUES (?, ?,?);UPDATE goals SET votes = votes + 1 WHERE id = ?;";
      await promisify(connection.query).bind(connection)(createUserQuery, [
        userName,
        userEmail,
        goalId,
        goalId,
      ]);
      return addCorsHeaders({
        statusCode: 200,
        body: JSON.stringify({
          message: "New user created, Vote successful!",
        }),
      });
    } else {
      if (user.goalVoted > 0) {
        return addCorsHeaders({
          statusCode: 403,
          body: JSON.stringify({ message: "User has already voted" }),
        });
      }
    }
  } catch (err) {
    console.log(err);
    return addCorsHeaders({
      statusCode: 500,
      body: JSON.stringify({ message: "An error occurred on the server", err }),
    });
  }
};

module.exports = { formVote };
