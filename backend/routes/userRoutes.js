const express = require("express");
const {
  registerUser,
  authUser,
  updateUser,
  allUsers,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, allUsers);

router.route("/register").post(registerUser);

router.post("/login", authUser);

router.route('/:id').post( updateUser);

module.exports = router;
