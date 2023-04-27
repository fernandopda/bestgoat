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

/* Admin add goals */
const addGoals = (req, res) => {
  const { title, description, videoURL, votes } = req.body;

  const query =
    "INSERT INTO goals (title, description, videoURL, votes) VALUES (?, ?, ?, ?)";
  connection.query(
    query,
    [title, description, videoURL, votes],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
      } else {
        res
          .status(201)
          .json({ message: "Goal created successfully", id: result.insertId });
      }
    }
  );
};

const getUserById = (userId, callback) => {
  connection.query("SELECT * FROM users WHERE id = ?", [userId], callback);
};

const getUserByGoogleId = (googleId, callback) => {
  connection.query(
    "SELECT * FROM users WHERE google_id = ?",
    [googleId],
    callback
  );
};

const createUser = (email, googleId, callback) => {
  const createUserQuery = "INSERT INTO users (email, google_id) VALUES (?, ?)";
  connection.query(createUserQuery, [email, googleId], callback);
};

const isAdmin = (req, res, next) => {
  const userId = req.user.id;
  console.log("userId:", userId);

  getUserById(userId, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    } else if (!results || results.length === 0) {
      console.log("no results found for userId:", userId);
      res.status(404).json({ message: "User not found" });
    } else {
      const user = results[0];
      if (user.is_admin) {
        next();
      } else {
        res.status(403).json({ message: "Forbidden" });
      }
    }
  });
};

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

    getUserByGoogleId(googleId, async (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error", err });
        // Creates a new user in case it doest exist
      } else if (!results || results.length === 0) {
        console.log("creating user");
        createUser(email, googleId, (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({
              message: "It was not possible to create a new user",
              err,
            });
          } else {
            console.log("user created");
            const userId = result.insertId;
            const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
              expiresIn: process.env.JWT_EXPIRES_IN,
            });
            res.status(200).json({ token });
          }
        });
      } else {
        console.log("user exists!");
        const user = results[0];
        console.log("USER:", user);
        const userId = user.ID;
        console.log("USERID:", userId);
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN,
        });
        console.log("USER ADMIN", user.is_admin ? "YES" : "NO");
        res.status(200).json({ token, isAdmin: user.is_admin });
      }
    });
  } catch (err) {
    console.error("Google login failed:", err);
    res.status(500).json({ message: "AUTH!! Internal Server Error" });
  }
};

/* EMAIL LOGIN */
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

// Export the router instance instead of the object
// Add middleware and routes to the router instance
router.post("/googleLogin", googleLogin);
router.post("/addGoals", isAdmin, addGoals);

// Export the router instance
module.exports = router;
