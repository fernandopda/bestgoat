const createConnection = require("./db");
const { promisify } = require("util"); // This can be removed if not used elsewhere

// Helper to add CORS headers
const addCors = (res) => ({
  ...res,
  headers: {
    "Access-Control-Allow-Origin": process.env.ACCESS_CONTROL_ALLOW_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  },
});

exports.handler = async (event) => {
  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return addCors({ statusCode: 200, body: "" });
  }

  try {
    // Await the connection since createConnection returns a Promise
    const connection = await createConnection();

    // Parse the incoming event body to get the goal data
    const { title, description, videoURL, votes } = JSON.parse(event.body);

    // Insert into database (no promisify needed; .query() returns a Promise)
    const insertSql =
      "INSERT INTO goals (title, description, url, votes) VALUES (?, ?, ?, ?)";
    const [result] = await connection.query(insertSql, [
      title,
      description,
      videoURL,
      votes,
    ]);

    // Optionally close the connection (good practice, though Lambda may handle it)
    await connection.end();

    // Success response
    return addCors({
      statusCode: 201,
      body: JSON.stringify({
        message: "Goal created successfully",
        id: result.insertId,
      }),
    });
  } catch (err) {
    console.error(err);
    return addCors({
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: err.message,
      }),
    });
  }
};