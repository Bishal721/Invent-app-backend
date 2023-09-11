const express = require("express");
const dotenv = require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require("./config/connectDB");
const path = require("path");

// important imports
const userRoute = require("./routes/userRoute");
const productRoute = require("./routes/productRoute");
const contatcRoute = require("./routes/contactRoute");
const errorhandler = require("./middleware/errorhandler");
const cookieParser = require("cookie-parser");
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000", "https://invent-app-seven-fawn.vercel.app"],
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes middleware
app.use("/api/users", userRoute);
app.use("/api/products", productRoute);
app.use("/api/contactus", contatcRoute);

app.get("/", (req, res) => {
  res.send("Homepage");
  res.end();
});

app.use(errorhandler);

const PORT = 80 || process.env.PORT;
// Connect TO Database and start
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on Port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
