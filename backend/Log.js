const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
  userId: String,
  email: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Log", LogSchema);
