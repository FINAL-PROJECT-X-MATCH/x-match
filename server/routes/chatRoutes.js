const express = require('express');
const ChatController = require('../controllers/chatController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.post('/chats', auth, ChatController.uploadImage, ChatController.postChat);
router.get('/chats/:eventId', auth, ChatController.getChats);

module.exports = router;++++++++++++++++++++++++++++++++++
