const express = require("express");
const router = express.Router();
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const { promisify } = require("util");
const { constrainedMemory } = require("process");
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
  port: 3306,
  multipleStatements: true,
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* Admin add goals */
const addGoals = (req, res) => {
  const { title, description, videoURL, votes } = req.body;

  const query =
    "INSERT INTO goals (title, description, url, votes) VALUES (?, ?, ?, ?)";
  connection.query(
    query,
    [title, description, videoURL, votes],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error", err });
      } else {
        res
          .status(201)
          .json({ message: "Goal created successfully", id: result.insertId });
      }
    }
  );
};
const getGoals = (req, res) => {
  connection.query("SELECT * FROM goals", (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error", err });
    } else {
      res.status(200).json(results);
    }
  });
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
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Get the token part from the "Bearer <token>" format

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403); // If the token is not valid, return 403 (Forbidden)
      }

      req.user = user; // Set the req.user object
      next(); // Proceed to the next middleware function
    });
  } else {
    res.sendStatus(401); // If no authorization header is present, return 401 (Unauthorized)
  }
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
    console.log("reqBody:", req.body);
    const { tokenId } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, sub: googleId } = ticket.getPayload();
    console.log("this is email:", email);

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
        const user = results[0];
        const userId = user.ID;
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN,
        });
        console.log("USER ADMIN", user.is_admin ? "YES" : "NO");
        res.status(200).json({ token, isAdmin: user.is_admin, userId });
      }
    });
  } catch (err) {
    console.error("Google login failed:", err);
    res.status(500).json({ message: "AUTH!! Internal Server Error" });
  }
};
const checkVote = (req, res) => {
  const userId = req.body.userId;
  connection.query(
    "SELECT goalVoted FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error", err });
      } else {
        res.status(200).json({
          goalVotedId: results[0].goalVoted,
        });
      }
    }
  );
};

const vote = (req, res) => {
  const userId = req.body.userId;
  const goalId = req.body.goalId;
  console.log("USER AUTH", userId);
  console.log("GOALIDMAN", goalId);
  connection.query(
    "SELECT * FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error", err });
      } else {
        const user = results[0];

        if (user.voted) {
          res.status(403).json({ message: "User has already voted" });
        } else {
          connection.query(
            "UPDATE goals SET votes = votes + 1 WHERE id = ?; UPDATE users SET goalVoted = ? WHERE id = ?;",
            [goalId, goalId, userId],
            (err, result) => {
              if (err) {
                console.error(err);
                res.status(500).json({ message: "Internal Server Error", err });
              } else {
                connection.query(
                  "UPDATE users SET voted = 1 WHERE id = ?",
                  [userId],
                  (err, result) => {
                    if (err) {
                      console.error(err);
                      res
                        .status(500)
                        .json({ message: "Internal Server Error", err });
                    } else {
                      res
                        .status(200)
                        .json({ message: "Vote successfully submitted" });
                    }
                  }
                );
              }
            }
          );
        }
      }
    }
  );
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
router.post("/addGoals", authenticateJWT, isAdmin, addGoals);
router.get("/getGoals", getGoals);
router.post("/vote", vote);
router.post("/checkVote", checkVote);
// Export the router instance
module.exports = router;
