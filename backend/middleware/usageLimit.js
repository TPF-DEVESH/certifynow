const User = require("../models/User");

module.exports = async (req, res, next) => {
  const user = await User.findById(req.userId);
  const today = new Date().toDateString();

  if (user.lastUsed !== today) {
    user.dailyUsage = 0;
    user.lastUsed = today;
  }

  if (user.plan === "free" && user.dailyUsage >= 100) {
    return res.status(403).send("Daily limit reached");
  }

  user.dailyUsage++;
  await user.save();
  next();
};
