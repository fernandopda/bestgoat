const createConnection = require("./db");
const { promisify } = require("util");

const connection = createConnection();

const addGoals = async (event) => {
  try {
    // Parse the event.body, since it comes as a string
    const body = JSON.parse(event.body);
    const { title, description, videoURL, votes } = body;

    const query =
      "INSERT INTO goals (title, description, url, votes) VALUES (?, ?, ?, ?)";

    const result = await promisify(connection.query).bind(connection)(query, [
      title,
      description,
      videoURL,
      votes,
    ]);

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

module.exports = { addGoals };
