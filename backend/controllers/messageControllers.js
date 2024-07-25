const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate({
        path: "sender",
        select: "name pic email",
      })
      .populate("chat");

    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected

const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  const newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    let message = await Message.create(newMessage);

    message = await Message.findById(message._id)
      .populate({
        path: "sender",
        select: "name pic",
      })
      .populate("chat")
      .exec();

    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const updateMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const messageId = req.params.id;

  const updatedMessage = await Message.findByIdAndUpdate(
    messageId,
    { content },
    { new: true }
  );
  console.log("updateMessage", updateMessage);
  if (!updatedMessage) {
    return res.status(404).json({ message: "Message not found" });
  }

  res.json(updatedMessage);
});


const deleteMessage = asyncHandler(async (req, res) => {
  const messageId = req.params.id;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Use deleteOne or findByIdAndDelete
    await Message.findByIdAndDelete(messageId);

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = { allMessages, sendMessage, updateMessage, deleteMessage };
