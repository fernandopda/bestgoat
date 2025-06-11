const { OAuth2Client } = require("google-auth-library");
const AWS = require("aws-sdk");
require("dotenv").config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const lambda = new AWS.Lambda();

const addCors = (res) => ({
  ...res,
  headers: {
    "Access-Control-Allow-Origin": "https://www.bestgoat.net",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
  }
});

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return addCors({ statusCode: 200, body: "" });
  }

  let payload;
  try {
    const { tokenId, goalId } = JSON.parse(event.body);
    // 1) Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { email, name, sub: googleId } = ticket.getPayload();

    // 2) Invoke the DB Lambda
    const invokeRes = await lambda.invoke({
      FunctionName: process.env.DB_HANDLER_ARN,
      InvocationType: "RequestResponse",
      Payload: JSON.stringify({ email, name, googleId, goalId })
    }).promise();

    const dbResult = JSON.parse(invokeRes.Payload);
    // Normalize into an HTTP response
    return addCors({
      statusCode: dbResult.statusCode,
      body: JSON.stringify(dbResult.body)
    });
  } catch (err) {
    console.error(err);
    return addCors({
      statusCode: 500,
      body: JSON.stringify({ message: "Auth error", error: err.message })
    });
  }
};
