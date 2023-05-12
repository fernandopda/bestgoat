const mysql = require("mysql");
require("dotenv").config();

let connection;

function createConnection() {
  if (!connection) {
    connection = mysql.createConnection({
      host: process.env.DT_DATABASE_HOST,
      user: process.env.DT_DATABASE_USER,
      password: process.env.DT_DATABASE_PW,
      database: process.env.DT_DATABASE,
      port: 3306,
      multipleStatements: true,
    });
  }

  return connection;
}

module.exports = createConnection;
