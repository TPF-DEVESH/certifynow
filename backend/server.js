const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const app = express();

/* ===== MIDDLEWARE ===== */
app.use(cors());
app.use(express.json());

/* ===== ENSURE UPLOADS FOLDER EXISTS ===== */
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/* ===== ROUTES ===== */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/certificate", require("./routes/certificate"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/logs", require("./routes/logs"));
app.use("/api/admin", require("./routes/admin"));

/* ===== START SERVER ===== */
const PORT = process.env.PORT || 10000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log("Server running on port", PORT);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // ❗ prevents silent crash
  });
