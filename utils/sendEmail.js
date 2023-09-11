const nodemailer = require("nodemailer");
const Mail = require("nodemailer/lib/mailer");

const sendEmail = async (sent_from, send_to, subject, message, reply_to) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Options for sending mail

  // console.log(subject);
  const options = {
    from: sent_from,
    to: send_to,
    subject: subject,
    html: message,
    reply_to,
  };

  //   send Mail

  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
};

module.exports = sendEmail;
