// handleSuggestion.js - Lambda function to update suggestion status (approve/decline)

const createConnection = require("./db"); // Import the DB connection module

// Helper function to add CORS headers to responses for cross-origin requests (e.g., from AdminPage frontend)
const addCors = (res) => ({
  ...res,
  headers: {
    "Access-Control-Allow-Origin": process.env.ACCESS_CONTROL_ALLOW_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  },
});

// Main Lambda handler function
exports.handler = async (event) => {
  // Handle CORS preflight requests (OPTIONS method)
  if (event.httpMethod === "OPTIONS") {
    return addCors({ statusCode: 200, body: "" });
  }

  let body;
  try {
    // Parse the request body (JSON from POST)
    console.log('Parsing request body...');
    body = JSON.parse(event.body);
    console.log('Body parsed successfully');
  } catch (parseErr) {
    console.error('Parse error:', parseErr.message);
    return addCors({
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON in request body' }),
    });
  }

  const { suggestionId, action } = body;
  // Validate input: suggestionId must be provided, action must be 'approve' or 'decline'
  if (!suggestionId || !['approve', 'decline'].includes(action)) {
    console.error('Invalid input: missing suggestionId or invalid action');
    return addCors({
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid suggestionId or action (must be approve or decline)' }),
    });
  }

  let connection;
  try {
    // Establish DB connection
    console.log('Connecting to RDS...');
    connection = await createConnection();
    console.log('Connected to RDS');

    // Map action to status value
    const newStatus = action === 'approve' ? 'approved' : 'declined';

    // Update the suggestion status in RDS
    console.log(`Updating suggestion ${suggestionId} to ${newStatus}...`);
    await connection.query(
      'UPDATE suggestions SET status = ? WHERE id = ?',
      [newStatus, suggestionId]
    );
    console.log('Update complete');

    // Return success response
    return addCors({
      statusCode: 200,
      body: JSON.stringify({ message: `Suggestion ${action}d successfully` }),
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