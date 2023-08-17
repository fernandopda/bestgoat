const axios = require("axios");
const createConnection = require("./db");

// Function to add CORS headers to your response
const addCorsHeaders = (response) => {
  return {
    ...response,
    headers: {
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,X-Amz-Security-Token,Authorization,X-Api-Key,X-Requested-With,Accept",
      "Access-Control-Allow-Origin": "https://www.bestgoat.net",
      "Access-Control-Allow-Methods": "OPTIONS,PUT",
      "Access-Control-Allow-Credentials": "true",
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  };
};

const formVote = async (event) => {
  try {
    const connection = createConnection();
    const { userName, userEmail, goalId, captchaValue } = JSON.parse(
      event.body
    );
    const secretKey = process.env.RECAPTCHA_SITE_KEY;

    // verifying the captcha token
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaValue}`,
      {},
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
        },
      }
    );

    // Add captcha success validation if needed
    // if (!response.data.success) {
    //   return addCorsHeaders({
    //     statusCode: 400,
    //     body: JSON.stringify({ message: 'Recaptcha verification failed' }),
    //   });
    // }

    // tries to select email from database
    const [users] = await connection.query(
      "SELECT * FROM users WHERE email = ?",
      [userEmail]
    );
    const user = users[0];

    if (!user) {
      // No user found with this email, creating new user
      const [results] = await connection.query(
        "INSERT INTO users (name, email,goalVoted) VALUES (?, ?,?);UPDATE goals SET votes = votes + 1 WHERE id = ?;",
        [userName, userEmail, goalId, goalId]
      );

      if (results) {
        return addCorsHeaders({
          statusCode: 200,
          body: JSON.stringify({
            message: "New user created, Vote successful!",
          }),
        });
      } else {
        return addCorsHeaders({
          statusCode: 500,
          body: JSON.stringify({ message: "Failed to create new user" }),
        });
      }
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
      body: JSON.stringify({ message: "Recaptcha verification server error" }),
    });
  }
};

module.exports = { formVote };
