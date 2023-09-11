const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");

const contactUs = asyncHandler(async (req, res) => {
  const {subject, message} = req.body;
  console.log(req.body.subject);
  
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(400);
    throw new Error("Usere not found, Please Signup");
  }
  // validation for empty string
  if (!subject || !message) {
    res.status(400);
    throw new Error("Please add suject and message");
  }

  const send_to = process.env.EMAIL_USER;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = user.email;
  try {
    await sendEmail(sent_from, send_to, subject, message, reply_to);
    res.status(200).json({
      success: true,
      message: "Email Sent",
    });
  } catch (error) {
    res.status(500);
    throw new Error("Email not Sent, Please try Again");
  }

});

module.exports = {
  contactUs,
};
