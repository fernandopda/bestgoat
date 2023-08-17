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

    connection.connect((err) => {
      if (err) {
        console.error("Error connecting to the database:", err.stack);
        return;
      }

      console.log("Successfully connected to the database");
    });
  }

  return connection;
}

module.exports = createConnection;
