// gv_dbHandler.js
const createConnection = require("./db");
require("dotenv").config();

exports.handler = async (event) => {
  // Expect event = { email, name, googleId, goalId }
  const { email, name, googleId, goalId } = event;

  let pool;
  try {
    pool = await createConnection();
    console.log("Successfully obtained MySQL pool");

    // 1) Check if user already voted
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      // New user → insert into users and increment goal's votes
      const insertSql = `
        INSERT INTO users (name, email, google_id, goalVoted) VALUES (?, ?, ?, ?)
      `;
      const updateSql = `
        UPDATE goals SET votes = votes + 1 WHERE id = ?
      `;

      await pool.execute(insertSql, [name, email, googleId, goalId]);
      await pool.execute(updateSql, [goalId]);

      return {
        statusCode: 200,
        body: { message: "Vote recorded" },
      };
    } else {
      // User already exists → forbid
      return {
        statusCode: 403,
        body: { message: "Already voted" },
      };
    }
  } catch (err) {
    console.error("DB handler error:", err);
    return {
      statusCode: 500,
      body: { message: "DB error", error: err.message },
    };
  }
};
