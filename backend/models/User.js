const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,

  role: { type: String, default: "user" },
  plan: { type: String, default: "free" },
  planExpiry: Date,

  dailyUsage: { type: Number, default: 0 },
  lastUsed: String,

  smtp: {
    enabled: { type: Boolean, default: false },
    host: String,
    port: Number,
    secure: Boolean,
    user: String,
    pass: String
  }
});

module.exports = mongoose.model("User", UserSchema);
