const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../helpers/db");
const { v4: uuidv4 } = require("uuid"); // for unique course/material IDs

// Get all courses
// GET /api/courses/
router.get("/", (req, res) => {
  const courses = readJSON("courses.json");
  res.json(courses);
});

// Add a course by (instructor)
// POST /api/courses/add
router.post("/add", (req, res) => {
  const { instructorId, title, price } = req.body;

  if (!instructorId || !title || !price) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const courses = readJSON("courses.json"); // read current courses for checking and editing
  if (courses.length >= 5) { // limit to 5 courses
    return res.status(400).json({ error: "LMS hosts only 5 courses" });
  }

  const newCourse = {
    id: uuidv4(),
    title,
    price: Number(price),
    instructorId,
    materials: [],
    students: []
  };

  courses.push(newCourse);
  writeJSON("courses.json", courses); // save updated courses

  // Reward instructor for adding course
  const bank = readJSON("bank.json");
  const instBank = bank.find(b => b.userId === instructorId);

  if (instBank) {
    instBank.balance += 200;  // reward for uploading a course
    writeJSON("bank.json", bank);
  }

  res.json({ message: "Course added & instructor rewarded", course: newCourse });
});

// Add material
// POST /api/courses/:courseId/material
router.post("/:courseId/material", (req, res) => {
  const { courseId } = req.params; // get courseId from URL params for identifying course to edit
  const { type, title, url } = req.body;

  const courses = readJSON("courses.json"); // read current courses for editing
  const course = courses.find(c => c.id === courseId);
  if (!course) return res.status(404).json({ error: "Course not found" });

  course.materials.push({
    id: uuidv4(),
    type,
    title,
    url
  });

  writeJSON("courses.json", courses); // save updated courses

  res.json({ message: "Material added", course });
});

module.exports = router; // to use this route from server.js we use exports
