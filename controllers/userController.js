const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const generatetoken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Register User
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  // validation

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill all the required Fields");
  }
  // check the length of password
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be up to 6 characters");
  }
  // check if email is already registered or not
  const userExist = await User.findOne({ email });
  if (userExist) {
    res.status(400);
    throw new Error("Email has already been registered");
  }

  // Create new user

  const user = await User.create({
    name,
    email,
    password,
  });

  // Generated koken
  const token = generatetoken(user._id);

  // HTTP only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // ! day
    sameSite: "none",
    secure: true,
  });

  if (user) {
    const { _id, name, email, image, phone, Bio } = user;
    res.status(201).json({
      _id,
      name,
      email,
      image,
      phone,
      Bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Error in creating a user");
  }
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please fill all the required Fields");
  }
  // Check if the user exists
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error("User not found. Please Signup first");
  }
  // User exixted now checking if the password is correct or not

  const PasswordCorrect = await bcrypt.compare(password, user.password);

  // Generated koken
  const token = generatetoken(user._id);

  // HTTP only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // ! day
    sameSite: "none",
    secure: true,
  });

  if (user && PasswordCorrect) {
    const { _id, name, email, image, phone, Bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      image,
      phone,
      Bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid Email or password");
  }
});

// Logout Controller
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0), // current second
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({ message: "Successfully Logged  Out" });
});

// Get User
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { _id, name, email, image, phone, Bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      image,
      phone,
      Bio,
    });
  } else {
    res.status(400);
    throw new Error("User not Found");
  }
});

const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.json(false);
  }

  // Verify the token
  const verified = jwt.verify(token, process.env.JWT_SECRET);

  if (verified) {
    return res.json(true);
  } else {
    return res.json(false);
  }
});

// update user controller function
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { name, email, image, phone, Bio } = user;
    user.email = email;
    user.name = req.body.name || name;
    user.image = req.body.image || image;
    user.phone = req.body.phone || phone;
    user.Bio = req.body.Bio || Bio;

    const updatedUser = await user.save();
    res.status(200).json({
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      phone: updatedUser.phone,
      Bio: updatedUser.Bio,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// change password controller

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldpassword, password } = req.body;
  // validate user
  if (!user) {
    res.status(404);
    throw new Error("User Not Found");
  }

  // Check for value is provided or not

  if (!oldpassword || !password) {
    res.status(400);
    throw new Error("Please provide old and new Password");
  }

  const PasswordCorrect = await bcrypt.compare(oldpassword, user.password);

  if (user && PasswordCorrect) {
    user.password = password;
    await user.save();
    res.status(200).send("Password changed successfully");
  } else {
    res.status(400);
    throw new Error("Old Password is incorrect");
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User does not exists");
  }
  // delete token if already exists

  let token = await Token.findOne({ userId: user._id });

  if (token) {
    await token.deleteOne();
  }
  // create Reset Token

  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log(resetToken);
  // Hsah token Before Saving to DB

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // save token to Database
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 20 * (60 * 1000),
  }).save();

  // Construct reset URL

  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  // RESET email

  const message = `
  <h2>Hello ${user.name}</h2>
  <p>Please use the url below to reset your password.</p>
  <p>This URL is only valid for only 5 Minutes.</p>
  <a href=${resetUrl} clicktracking=off >${resetUrl}</a>
  <p> Regards. </p>
  `;

  const subject = "Password Reset Request";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(sent_from, send_to, subject, message);
    res.status(200).json({
      success: true,
      message: "Reset URL Sent",
    });
  } catch (error) {
    console.log(error);
    res.status(500);
    throw new Error("Email not Sent, Please try Again");
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  // Hash token and find it in the Database
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Inavlid or Expired Token");
  }

  const user = await User.findOne({ _id: userToken.userId });

  user.password = password;
  await user.save();
  res.status(200).json({
    message: "Password Reset Successful, Please Login with new Password",
  });
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
