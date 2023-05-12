const { promisify } = require("util");
require("dotenv").config();
const createConnection = require("./db");

const connection = createConnection();

const queryAsync = promisify(connection.query).bind(connection);

const getGoals = async (event) => {
  const getGoals = async () => {
    try {
      const results = await queryAsync("SELECT * FROM goals");
      return {
        statusCode: 200,
        body: JSON.stringify(results),
        headers: {
          "Access-Control-Allow-Origin":
            process.env.ACCESS_CONTROL_ALLOW_ORIGIN,
        },
      };
    } catch (err) {
      console.error(err);
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
    const response = await getGoals();
    return response;
  } catch (error) {
    return error;
  }
};
module.exports = { getGoals };
