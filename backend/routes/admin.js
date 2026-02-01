const router = require("express").Router();
const User = require("../models/User");
const Log = require("../models/Log");

router.get("/users", async (_, res) => res.json(await User.find()));
router.get("/logs", async (_, res) => res.json(await Log.find()));

module.exports = router;
