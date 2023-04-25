const express = require("express");
const router = express.Router();
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const { promisify } = require("util");
const app = express();
require("dotenv").config();
app.use((req, res, next) => {
  console.log("Request headers:", req.headers);
  console.log("Request body:", req.body);
  next();
});
app.use(express.json());
const connection = mysql.createConnection({
  host: process.env.DT_DATABASE_HOST,
  user: process.env.DT_DATABASE_USER,
  password: process.env.DT_DATABASE_PW,
  database: process.env.DT_DATABASE,
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  try {
    console.log("reqBody", req.body);
    const { tokenId } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, sub: googleId } = ticket.getPayload();
    console.log(email);
    // Check if user exists in the database
    connection.query(
      "SELECT * FROM users WHERE google_id = ?",
      [googleId],
      async (err, results) => {
        if (err) {
          console.error(err);
          res.status(500).json({ message: "Internal Server Error" });
        } else if (!results || results.length === 0) {
          // User doesn't exist, create a new user with the Google ID and email
          console.log("criando user");
          const createUserQuery =
            "INSERT INTO users (email, google_id) VALUES (?, ?)";
          connection.query(
            createUserQuery,
            [email, googleId],
            (err, result) => {
              if (err) {
                console.error(err);
                res.status(500).json({ message: "Internal Server Error" });
              } else {
                console.log("entrou");
                const userId = result.insertId;
                const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
                  expiresIn: process.env.JWT_EXPIRES_IN,
                });
                res.status(200).json({ token });
                console.log(token);
              }
            }
          );
        } else {
          console.log("user exists!");
          const userId = results[0].id;
          const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
          });
          res.status(200).json({ token });
        }
      }
    );
  } catch (err) {
    console.error("Google login failed:", err);
    res.status(500).json({ message: "AUTH!! Internal Server Error" });
  }
};

// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     console.log(email);
//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Please provide an email and password" });
//     }
//     connection.query(
//       "SELECT * FROM users WHERE email = ?",
//       [email],
//       async (err, results) => {
//         if (err) {
//           console.error(err);
//           res.status(500).json({ message: "Internal Server Error" });
//         } else if (!results || results.length === 0) {
//           res.status(400).json({ message: "Invalid email or password" });
//         } else if (!(await bcrypt.compare(password, results[0].password))) {
//           res.status(400).json({ message: "Invalid email or password" });
//         } else {
//           const id = results[0].id;

//           const token = jwt.sign({ id }, process.env.JWT_SECRET, {
//             expiresIn: process.env.JWT_EXPIRES_IN,
//           });

//           res.status(200).json({ token });
//         }
//       }
//     );
//   } catch (err) {
//     console.log("FUDEU!", err);
//   }
// };

// Define the login route and use the login function as the route handler
// router.post("/login", login);
router.post("/googleLogin", googleLogin);

// Export the router instance instead of the object
module.exports = router;
