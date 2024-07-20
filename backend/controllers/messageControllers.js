const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

//@description     Get all Messages
//@route           GET /api/message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate({
        path: "sender",
        select: "name pic email", // Select specific fields for the sender
      })
      .populate({
        path: "chat",
        populate: {
          path: "users",
          select: "name pic email", // Select specific fields for the chat users
        },
      });

    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/message
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.status(400).send("Invalid data passed into request");
  }

  try {
    const newMessage = {
      sender: req.user._id,
      content: content,
      chat: chatId,
    };

    // Create new message
    let message = await Message.create(newMessage);

    // Populate sender and chat with user details
    message = await Message.findById(message._id)
      .populate({
        path: 'sender',
        select: 'name pic',
      })
      .populate({
        path: 'chat',
        populate: {
          path: 'users',
          select: 'name pic email',
        },
      });

    // Update the latest message in the chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message }, { new: true });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { allMessages, sendMessage };
