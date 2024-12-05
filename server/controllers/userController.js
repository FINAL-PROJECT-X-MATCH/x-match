const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');
const cloudinary = require('cloudinary').v2;
const { OAuth2Client } = require('google-auth-library');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class UserController {
  static async register(req, res) {
    try {
      console.log(req.body,"<<<<<<<<<<<<ini req body");
      const { username, email, password } = req.body;
      console.log(req.body, "==== di register");
      const hashedPassword = await bcrypt.hash(password, 8);
      const db = getDb();
      const user = {
        username,
        email,
        password: hashedPassword,
        notification: [],
        status: {
          ban: false,
          duration: ""
        },
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
        updateData.avatar = result.secure_url;
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

  static async checkStatus() {
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
        for(const user of users) {
          console.log(user, ` ini di forEach`);
          unbannedUsers.push(user._id);
          const _id = user._id;
          const response = await db.collection('users').updateOne(
            { _id },
            {
              $set: {
                "status.ban": false,
                "status.duration": ""
              }
            }
          );
          console.log(response, "ini hasil update");
          const find = await db.collection('users').findOne({_id})
          console.log(find, "seteleah berubah");
        };
        console.log(`User(s) with ID(s) ${unbannedUsers.join(',')} has/have been unbanned`);
      }
    } catch (error) {
      console.log(error, "Error handler");
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
      res.status(500).send({ error: "Internal Server Error" });
    }
  }


  static async getJoinedEvents(req, res) {
    try {
      const db = getDb();
      const events = await db.collection('events').find({ player: req.user._id }).toArray();
      res.send(events);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  static async getNotifications(req, res) {
    try {
      const db = getDb();
      const user = await db.collection('users').findOne({ _id: new ObjectId(req.user._id) });
      res.send(user.notification);
    } catch (error) {
      res.status(400).send({ message: 'Failed to get notifications', error });
    }
  }

  static async notificationOK(req, res, next) {
    // tujuan jika user bisa datang, notifikasi kehapus
    try {
      const { _id } = req.user
      const { eventId } = req.params
      const db = await getDb()
      const user = await db.collection("users").findOne({ _id })
      const notifications = user.notification
      console.log(notifications, "sebelum di cut");
      const indexNotif = notifications.findIndex(notification => {
        return notification.eventId.equals(new ObjectId(eventId))
      }
      )
      if (indexNotif === -1) {
        res.status(201).json({
          message: "Event id is not register to the user"
        })
      }
      notifications.splice(indexNotif, 1)
      const updateNotif = await db.collection("users").updateOne(
        {_id},
        {$set: {
          notification: notifications
        }}
      )
      res.status(201).json({
        message: "succesfully delete notification"
      })
    } catch (error) {
      res.status(500).send({ error: "internal server error" })
    }
  }

  static async savePushToken(req, res) {
    try {
      const userId = req.user._id;
      const { token } = req.body;

      const db = await getDb();
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { pushToken: token } }
      );

      res.status(200).json({ message: 'Push token saved successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  

}

module.exports = UserController;
