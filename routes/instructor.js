// routes/instructor.js
const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../helpers/db");

// Instructor collects pending payments
router.post("/collect", (req, res) => {
  const { instructorId, secret } = req.body;
  if (!instructorId || !secret) return res.status(400).json({ error: "Missing fields" });

  const bank = readJSON("bank.json");
  const instAcc = bank.find(b => b.userId === instructorId);
  const lmsAcc = bank.find(b => b.userId === "LMS");
  if (!instAcc) return res.status(404).json({ error: "Instructor bank missing" });
  if (!lmsAcc) return res.status(400).json({ error: "LMS bank missing" });

  if (instAcc.secret !== secret) return res.status(401).json({ error: "Wrong bank secret" });

  const trxs = readJSON("transactions.json");

  let collected = 0;
  trxs.forEach(trx => {
    if (trx.instructorId === instructorId && trx.status === "pending") {
      if (lmsAcc.balance >= trx.amount) {
        lmsAcc.balance -= trx.amount;
        instAcc.balance += trx.amount;
        trx.status = "completed";
        collected += trx.amount;
      }
    }
  });

  writeJSON("transactions.json", trxs);
  writeJSON("bank.json", bank);

  res.json({ message: `Collected ${collected} TK successfully`, collected });
});

// Instructor uploads materials → gets reward instantly
router.post("/reward", (req, res) => {
  const { instructorId } = req.body;
  const bank = readJSON("bank.json");
  const instAcc = bank.find(b => b.userId === instructorId);
  if (!instAcc) return res.status(404).json({ error: "Instructor bank missing" });
  instAcc.balance += 200;
  writeJSON("bank.json", bank);
  res.json({ message: "Reward added: +200 TK" });
});

// GET all pending completion requests for instructor's courses
router.get("/pending-approvals/:instructorId", (req, res) => {
  const { instructorId } = req.params;

  const courses = readJSON("courses.json");
  const users = readJSON("users.json");

  const myCourses = courses.filter(c => c.instructorId === instructorId);

  const pending = [];
  myCourses.forEach(course => {
    (course.students || []).forEach(student => {
      if (student.completionStatus === "pending") {
        const user = users.find(u => u.id === student.userId);
        pending.push({
          courseId: course.id,
          courseTitle: course.title,
          userId: student.userId,
          learnerName: user ? user.name : student.userId
        });
      }
    });
  });

  res.json(pending);
});

// POST approve a learner's completion
router.post("/approve-completion", (req, res) => {
  const { instructorId, userId, courseId } = req.body;
  if (!instructorId || !userId || !courseId) return res.status(400).json({ error: "Missing fields" });

  const courses = readJSON("courses.json");
  const course = courses.find(c => c.id === courseId);
  if (!course) return res.status(404).json({ error: "Course not found" });
  if (course.instructorId !== instructorId) return res.status(403).json({ error: "Not your course" });

  const student = (course.students || []).find(s => s.userId === userId);
  if (!student) return res.status(404).json({ error: "Learner not enrolled" });
  if (student.completionStatus !== "pending") return res.status(400).json({ error: "No pending request from this learner" });

  student.completionStatus = "approved";
  writeJSON("courses.json", courses);

  res.json({ message: "Completion approved. Learner can now download their certificate." });
});

module.exports = router;