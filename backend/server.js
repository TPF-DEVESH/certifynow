const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/certificate", require("./routes/certificate"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/logs", require("./routes/logs"));
app.use("/api/admin", require("./routes/admin"));

app.listen(process.env.PORT, () =>
  console.log("CertifyNow backend running on", process.env.PORT)
);
