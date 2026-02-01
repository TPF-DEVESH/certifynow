const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/signup", async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  await User.create({ email: req.body.email, password: hash });
  res.json({ success: true });
});

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(401).send("Invalid");

  const ok = await bcrypt.compare(req.body.password, user.password);
  if (!ok) return res.status(401).send("Invalid");

  res.json({
    token: jwt.sign({ id: user._id }, process.env.JWT_SECRET)
  });
});

module.exports = router;
