const { promisify } = require("util");
const createConnection = require("./db");
require("dotenv").config();

const vote = async (event) => {
  try {
    const connection = createConnection();
    console.log(event);
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (err) {
      console.log("Failed passing the body", event.body);

      throw err;
    }
    console.log("body");
    const userId = body.userId;
    const goalId = body.goalId;
    const getUserQuery = "SELECT * FROM users WHERE id = ?";
    const [results] = await promisify(connection.query).bind(connection)(
      getUserQuery,
      [userId]
    );
    console.log("This is the results:", results);
    console.log("This is result[0]", results[0]);
    console.log("this is the results length:", results.length);
    if (results) {
      const user = results;
      console.log("server goal VOTED!:", user.goalVoted);
      if (user.goalVoted > 0) {
        return {
          statusCode: 403,
          body: JSON.stringify({ message: "User has already voted" }),
          headers: {
            "Access-Control-Allow-Origin":
              process.env.ACCESS_CONTROL_ALLOW_ORIGIN,
          },
        };
      } else {
        const updateVotesQuery =
          "UPDATE goals SET votes = votes + 1 WHERE id = ?; UPDATE users SET goalVoted = ? WHERE id = ?;";
        await promisify(connection.query).bind(connection)(updateVotesQuery, [
          goalId,
          goalId,
          userId,
        ]);

        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Vote successfully submitted" }),
          headers: {
            "Access-Control-Allow-Origin":
              process.env.ACCESS_CONTROL_ALLOW_ORIGIN,
          },
        };
      }
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Internal Server Error, went" }),
        headers: {
          "Access-Control-Allow-Origin":
            process.env.ACCESS_CONTROL_ALLOW_ORIGIN,
        },
      };
    }
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error, didnt go in",
        err,
      }),
      headers: {
        "Access-Control-Allow-Origin": process.env.ACCESS_CONTROL_ALLOW_ORIGIN,
      },
    };
  }
};

module.exports = { vote };
