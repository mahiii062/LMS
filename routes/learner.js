// routes/learner.js
const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../helpers/db");
const { v4: uuidv4 } = require("uuid");

// BUY A COURSE (auto unlock)
router.post("/buy", (req, res) => {
  const { userId, courseId, secret } = req.body;
  if (!userId || !courseId || !secret) return res.status(400).json({ error: "Missing fields" });

  const users = readJSON("users.json");
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Learner not found" });

  const courses = readJSON("courses.json");
  const course = courses.find(c => c.id === courseId);
  if (!course) return res.status(404).json({ error: "Course not found" });

  const bank = reNadJSO("bank.json");
  const learnerAcc = bank.find(b => b.userId === userId);
  const instAcc = bank.find(b => b.userId === course.instructorId);
  const lmsAcc = bank.find(b => b.userId === "LMS");

  if (!learnerAcc) return res.status(400).json({ error: "Learner bank missing" });
  if (!instAcc) return res.status(400).json({ error: "Instructor bank missing" });
  if (!lmsAcc) return res.status(400).json({ error: "LMS bank missing" });

  if (learnerAcc.secret !== secret) return res.status(401).json({ error: "Wrong bank secret" });
  if (learnerAcc.balance < course.price) return res.status(400).json({ error: "Insufficient balance" });

  // Money moves from learner to LMS account (instructor collects later)
  learnerAcc.balance -= course.price;
  lmsAcc.balance += course.price;
  writeJSON("bank.json", bank);

  // Create transaction (still pending for instructor collect)
  const trxs = readJSON("transactions.json");
  const trx = { id: uuidv4(), learnerId: userId, courseId, instructorId: course.instructorId, amount: course.price, status: "pending" };
  trxs.push(trx);
  writeJSON("transactions.json", trxs);

  // Add learner — auto unlocked, completionStatus starts as "none"
  if (!course.students) course.students = [];
  const already = course.students.find(s => s.userId === userId);
  if (!already) course.students.push({ userId, unlocked: true, completionStatus: "none" });

  writeJSON("courses.json", courses);

  res.json({ message: "Course purchased successfully. Access unlocked immediately.", unlocked: true, transaction: trx });
});

// LEARNER REQUESTS COMPLETION (Mark as Done)
router.post("/request-completion", (req, res) => {
  const { userId, courseId } = req.body;
  if (!userId || !courseId) return res.status(400).json({ error: "Missing fields" });

  const courses = readJSON("courses.json");
  const course = courses.find(c => c.id === courseId);
  if (!course) return res.status(404).json({ error: "Course not found" });

  const student = (course.students || []).find(s => s.userId === userId);
  if (!student) return res.status(403).json({ error: "You are not enrolled in this course" });
  if (!student.unlocked) return res.status(403).json({ error: "Course not unlocked" });

  if (student.completionStatus === "approved") {
    return res.status(400).json({ error: "Already approved. Download your certificate!" });
  }
  if (student.completionStatus === "pending") {
    return res.status(400).json({ error: "Request already sent. Waiting for instructor approval." });
  }

  student.completionStatus = "pending";
  writeJSON("courses.json", courses);

  res.json({ message: "Completion request sent to instructor. Please wait for approval." });
});

// GET Learner Dashboard Data (Available + Purchased)
router.get("/dashboard/:userId", (req, res) => {
  const userId = req.params.userId;

  const courses = readJSON("courses.json");

  const purchasedCourses = [];
  const availableCourses = [];

  courses.forEach(course => {
    const student = (course.students || []).find(
      s => s.userId === userId
    );

    if (student && student.unlocked) {
      purchasedCourses.push(course);
    } else {
      availableCourses.push(course);
    }
  });

  res.json({
    availableCourses,
    purchasedCourses
  });
});


module.exports = router;