const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const protect = asyncHandler(async (req, res, next) => {
  try {
    // check for token in cookies
    const token = req.cookies.token;

    if (!token) {
      res.status(401);
      throw new Error("Not Authorized, Please login");
    }

    // Verify the token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    // get user id from token
    const user = await User.findById(verified.id).select("-password");

    if (!user) {
      res.status(400);
      throw new Error("User not found");
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not Authorized, Please login");
  }
});

module.exports = { protect };
