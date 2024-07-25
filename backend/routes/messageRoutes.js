const express = require("express");
const {
  allMessages,
  sendMessage,
  updateMessage,
  deleteMessage
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/:chatId").get(protect, allMessages);
router.route("/").post(protect, sendMessage);
router.put('/:id', protect, updateMessage);
router.route("/:id").delete(protect, deleteMessage);

module.exports = router;
