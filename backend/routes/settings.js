const router = require("express").Router();
const auth = require("../middleware/auth");
const paid = require("../middleware/paidOnly");
const User = require("../models/User");
const { encrypt } = require("../utils/crypto");

router.post("/smtp", auth, paid, async (req, res) => {
  await User.findByIdAndUpdate(req.userId, {
    smtp: { ...req.body, enabled: true, pass: encrypt(req.body.pass) }
  });
  res.json({ success: true });
});

module.exports = router;
