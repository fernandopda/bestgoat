// getSuggestions.js - Lambda function to fetch pending suggestions from RDS

const createConnection = require("./db"); // Import the DB connection module

// Helper function to add CORS headers to responses for cross-origin requests (e.g., from AdminPage frontend)
const addCors = (res) => ({
  ...res,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,GET",
  },
});

// Main Lambda handler function
exports.handler = async (event) => {
  // Handle CORS preflight requests (OPTIONS method)
  if (event.httpMethod === "OPTIONS") {
    return addCors({ statusCode: 200, body: "" });
  }

  let connection;
  try {
    // Establish DB connection
    console.log('Connecting to RDS...');
    connection = await createConnection();
    console.log('Connected to RDS');

    // Query for pending suggestions, ordered by score descending
    console.log('Querying pending suggestions...');
    const [rows] = await connection.query(
      'SELECT * FROM suggestions WHERE status = "pending" ORDER BY score DESC'
    );
    console.log('Query complete, found', rows.length, 'suggestions');

    // Return the suggestions as JSON
    return addCors({
      statusCode: 200,
      body: JSON.stringify(rows),
    });
  } catch (err) {
    console.error('Error:', err.message);
    return addCors({
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error', details: err.message }),
    });
  } finally {
    // Close DB connection if established
    if (connection) {
      console.log('Closing DB connection');
      await connection.end();
    }
  }
};