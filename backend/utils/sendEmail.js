const nodemailer = require("nodemailer");
const User = require("../models/User");
const { decrypt } = require("./crypto");

module.exports = async (userId, to, text, attachment) => {
  const user = await User.findById(userId);

  let transporter;

  if (user.smtp?.enabled) {
    transporter = nodemailer.createTransport({
      host: user.smtp.host,
      port: user.smtp.port,
      secure: user.smtp.secure,
      auth: {
        user: user.smtp.user,
        pass: decrypt(user.smtp.pass)
      }
    });
  } else {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  await transporter.sendMail({
    from: "CertifyNow <no-reply@certifynow.com>",
    to,
    subject: "Your Certificate",
    html: `<p>${text}</p><hr/><small>Sent via CertifyNow</small>`,
    attachments: [{ path: attachment }]
  });
};
