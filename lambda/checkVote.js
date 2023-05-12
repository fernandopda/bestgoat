require("dotenv").config();
const { promisify } = require("util");
const createConnection = require("./db");

const connection = createConnection();
const queryAsync = promisify(connection.query).bind(connection);

const addCorsHeaders = (response) => {
  response.headers = {
    ...response.headers,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
  };
  return response;
};
const checkVote = async (event, context, callback) => {
  try {
    const body = JSON.parse(event.body);
    const userId = body.userId;
    console.log("this is the event:", event);
    console.log("this is the body:", body);
    if (!userId) {
      return callback(
        null,
        addCorsHeaders({
          statusCode: 400,
          body: JSON.stringify({
            message: "Invalid request, missing user ID.",
          }),
        })
      );
    }

    const results = await queryAsync(
      "SELECT goalVoted FROM users WHERE id = ?",
      [userId]
    );
    console.log("this is results:", results);
    console.log("this is results[0]", results[0]);
    if (results.length === 0) {
      return callback(
        null,
        addCorsHeaders({
          statusCode: 404,
          body: JSON.stringify({
            message: "User not found.",
          }),
        })
      );
    }

    return callback(
      null,
      addCorsHeaders({
        statusCode: 200,
        body: JSON.stringify({
          goalVotedId: results[0].goalVoted,
        }),
      })
    );
  } catch (err) {
    console.error(err);

    callback(
      null,
      addCorsHeaders({
        statusCode: 500,
        body: JSON.stringify({
          message: "Internal Server Error",
          error: err.message,
          eventBody: event.body,
        }),
      })
    );
  }
};

module.exports = { checkVote };
