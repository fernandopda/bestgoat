// db.js
const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

/**
 * Returns a MySQL connection from a singleton pool. 
 * Uses environment variables: DT_DATABASE_HOST, DT_DATABASE_USER, DT_DATABASE_PW, DT_DATABASE.
 */
async function createConnection() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DT_DATABASE_HOST,
      user: process.env.DT_DATABASE_USER,
      password: process.env.DT_DATABASE_PW,
      database: process.env.DT_DATABASE,
      port: 3306,
      waitForConnections: true,
      connectionLimit: 5,       // adjust as needed
      queueLimit: 0,
      multipleStatements: true, // because we run INSERT + UPDATE in one string
    });
    console.log("MySQL Pool created");
  }
  return pool;
}

module.exports = createConnection;
