// modules import
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const authRoutes = require("./routes/auth"); // Login/Register API
const courseRoutes = require("./routes/courses"); // Course related API
const bankRoutes = require("./routes/bank"); // Bank transactions API
const learnerRoutes = require("./routes/learner"); // Student dashboard / enroll API
const instructorRoutes = require("./routes/instructor"); // Teacher actions
const certificateRoutes = require("./routes/certificates"); // Certificate generate/download API

// creating express server
const app = express();

//MIDDLEWARE
app.use(express.json()); // accepts incoming JSON body
app.use(express.urlencoded({ extended: true })); // read HTML form data
app.use(bodyParser.json());

// Serve frontend (public folder) files
app.use(express.static(path.join(__dirname, "public")));

// API ROUTES: These send the requests to the route files.
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/bank", bankRoutes);
app.use("/api/learner", learnerRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/cert", certificateRoutes);

// FRONTEND FALLBACK (Home page)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// START SERVER
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`LMS server running at http://localhost:${PORT}`);
});
