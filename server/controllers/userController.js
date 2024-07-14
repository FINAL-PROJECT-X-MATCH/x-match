const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class UserController {
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 8);
      const db = getDb();
      const user = {
        username,
        email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('users').insertOne(user);
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.status(201).send({
        access_token: token,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      res.status(400).send(error);
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const db = getDb();
      const user = await db.collection('users').findOne({ email });
      if (!user) {
        return res.status(400).send({ message: 'Invalid email/password' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).send({ message: 'Invalid email/password' });
      }
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.send({
        access_token: token,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      res.status(400).send(error);
    }
  }

  static async getUser(req, res) {
    res.send(req.user);
  }

  static async updateUser(req, res) {
    try {
      const db = getDb();
      const updates = Object.keys(req.body);
      const updateData = {};
      updates.forEach(update => updateData[update] = req.body[update]);

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path);
        updateData.image = result.secure_url;
      }

      updateData.updatedAt = new Date();
      await db.collection('users').updateOne({ _id: new ObjectId(req.user._id) }, { $set: updateData });
      const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(req.user._id) });
      res.send(updatedUser);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  static async getUserEvents(req, res) {
    try {
      const db = getDb();
      const events = await db.collection('events').find({ player: req.user._id }).toArray();
      res.send(events);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  static async checkStatus(req, res) {
    try {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const db = await getDb();
      let unbannedUsers = [];
      const users = await db.collection('users').find({
        "status.ban": true,
        "status.duration": {
          $ne: "",
          $lt: yesterday.toISOString()
        }
      }).toArray();
      if (users.length === 0) {
        console.log("User not found");
      } else if (users.length > 0) {
        users.forEach(async (user) => {
          unbannedUsers.push(user._id);
          const _id = user._id;
          await db.collection('users').updateOne(
            { _id },
            {
              $set: {
                "status.ban": false,
                "status.duration": ""
              }
            }
          );
        });
        console.log(`User(s) with ID(s) ${unbannedUsers.join(',')} has/have been unbanned`);
      }
      res.status(200).send({ message: "Check status completed" });
    } catch (error) {
      console.log(error, "Error handler");
      res.status(500).send({ error: "Internal Server Error" });
    }
  }

  static async banUser(req, res, next) {
    try {
      const { userId } = req.params;
      const id = new ObjectId(userId);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const db = await getDb();
      const banUser = await db.collection('users').updateOne(
        { _id: id },
        {
          $set: {
            status: {
              ban: true,
              duration: tomorrow.toISOString()
            }
          }
        }
      );
      if (banUser.modifiedCount === 0) {
        throw { error: "ID_NOT_FOUND" };
      }
      res.status(201).json({
        message: `User with ID ${userId} has been banned for 1 day`
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
}

module.exports = UserController;
