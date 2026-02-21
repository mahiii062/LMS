// importing required modules
const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../helpers/db");

// Setup bank info for a user
// POST /api/bank/setup
router.post("/setup", (req, res) => {
  const { userId, accountNumber, secret, startingBalance } = req.body;
  if (!userId || !accountNumber || !secret) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // check if bank already exists or not
  const bank = readJSON("bank.json");
  const exists = bank.find((b) => b.userId === userId);
  if (exists) return res.status(400).json({ error: "Bank already set" });

  // create new bank account
  bank.push({
    userId,
    accountNumber,
    secret,
    balance: Number(startingBalance || 2000)
  });
  writeJSON("bank.json", bank);
  res.json({ message: "Bank setup complete" });
});

// Get individual balance
// GET /api/bank/balance/:userId
router.get("/balance/:userId", (req, res) => {
  const { userId } = req.params; // get userId from URL params
  const bank = readJSON("bank.json");
  const acc = bank.find((b) => b.userId === userId);
  if (!acc) return res.status(404).json({ error: "Account not found" });
  res.json({ balance: acc.balance }); // send balance to frontend
});

// SIMPLE transaction creation by LMS (internal - exposed for simplicity)
// POST /api/bank/transact
router.post("/transact", (req, res) => {

  const { fromUserId, toUserId, amount, secret } = req.body;
  const bank = readJSON("bank.json");
  const from = bank.find((b) => b.userId === fromUserId);
  const to = bank.find((b) => b.userId === toUserId);

  if (!from || !to) return res.status(404).json({ error: "Account not found" });
  if (from.secret !== secret) return res.status(401).json({ error: "Auth failed" });
  if (from.balance < amount) return res.status(400).json({ error: "Insufficient funds" });

  from.balance -= Number(amount);
  to.balance += Number(amount);
  writeJSON("bank.json", bank);

  // create a transaction record
  const transactions = readJSON("transactions.json");
  const trx = {
    id: Date.now().toString(),
    fromUserId,
    toUserId,
    amount: Number(amount),
    date: new Date().toISOString()
  };
  transactions.push(trx);
  writeJSON("transactions.json", transactions);

  res.json({ message: "Transaction successful", transaction: trx });
});

module.exports = router;
