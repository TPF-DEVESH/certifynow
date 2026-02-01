const User = require("../models/User");

module.exports = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (user.plan === "free") {
    return res.status(403).send("Paid plan required");
  }
  next();
};
