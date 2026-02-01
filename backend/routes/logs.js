const router = require("express").Router();
const auth = require("../middleware/auth");
const Log = require("../models/Log");

router.get("/", auth, async (req, res) => {
  res.json(await Log.find({ userId: req.userId }));
});

module.exports = router;
