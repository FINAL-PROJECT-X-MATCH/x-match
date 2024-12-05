const { ObjectId } = require('mongodb');
const { createChat, getChatsByEventId } = require('../models/Chat');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

class ChatController {
  static uploadImage = upload.single('image');

  static async postChat(req, res) {
    try {
      const { eventId, message } = req.body;
      let imageUrl = null;

      if (req.file) {
        console.log('File received:', req.file); 
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'chat_images' },
            (error, result) => {
              if (error) {
                return reject(error);
              }
              resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        imageUrl = result.secure_url;
        console.log('Uploaded image URL:', imageUrl);
      }

      const chat = await createChat({
        eventId: new ObjectId(eventId),
        userId: req.user._id,
        username: req.user.username,
        message,
        image: imageUrl,
        createdAt: new Date(),
      });
      res.send(chat);
    } catch (error) {
      res.status(400).send({ message: 'Failed to create chat', error });
    }
  }

  static async getChats(req, res) {
    try {
      const { eventId } = req.params;
      console.log(eventId, "ini di params");
      const chats = await getChatsByEventId(eventId);
      res.send(chats);
    } catch (error) {
      res.status(400).send({ message: 'Failed to get chats', error });
    }
  }
}

module.exports = ChatController;
