const router = require("express").Router();
const multer = require("multer");
const auth = require("../middleware/auth");
const limit = require("../middleware/usageLimit");
const parseCSV = require("../utils/csvParser");
const generate = require("../utils/generateCertificate");
const sendMail = require("../utils/sendEmail");

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 3 * 1024 * 1024 }
});

router.post(
  "/send",
  auth,
  limit,
  upload.fields([{ name: "template" }, { name: "csv" }]),
  async (req, res) => {
    const users = await parseCSV(req.files.csv[0].path);

    for (let u of users) {
      const cert = await generate(
        req.files.template[0].path,
        u.name,
        Number(req.body.x),
        Number(req.body.y)
      );
      await sendMail(req.userId, u.email, req.body.message, cert);
    }

    res.json({ success: true });
  }
);

module.exports = router;
