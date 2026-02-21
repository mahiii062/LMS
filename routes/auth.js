const express = require("express"); // load express module so that we can create routes
const { v4: uuidv4 } = require("uuid"); // import uuid module to create unique ids
const router = express.Router();
const { readJSON, writeJSON } = require("../helpers/db"); // import read/write JSON functions from db.js

// Register API
// POST /api/auth/register
router.post("/register", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing fields" });
  }


  // for checking values with users.json file to compare
  const users = readJSON("users.json"); // read users data from JSON file
  const exists = users.find((u) => u.email === email);
  if (exists) return res.status(400).json({ error: "Email already registered" });

  // after checking, Create new user object
  const newUser = {
    id: uuidv4(),
    name,
    email,
    password,
    role
  };

  // Save user into JSON file
  users.push(newUser);
  writeJSON("users.json", users);
  // send response to frontend
  res.json({ message: "Registered", user: newUser });
});

// Login API
// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body; // taking email and password from req body
  const users = readJSON("users.json"); // read users data from JSON file to check

  // check user credentials
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  // send res to frontend
  res.json({ message: "Login success", user });
});

module.exports = router; // to use this route from server.js we use exports
