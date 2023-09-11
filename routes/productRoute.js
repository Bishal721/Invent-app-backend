const express = require("express");
const {
  createProduct,
  getallProducts,
  getSingleProduct,
  deleteProduct,
  updateProduct,
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../utils/fileUpload");
const router = express.Router();

// Routes for products
router.post("/", protect, upload.single("image"), createProduct);
router.get("/", protect, getallProducts); // Get all products
router.get("/:id", protect, getSingleProduct); // Get single product
router.delete("/:id", protect, deleteProduct); // Delete product
router.patch("/:id", protect, upload.single("image"), updateProduct);

module.exports = router;
