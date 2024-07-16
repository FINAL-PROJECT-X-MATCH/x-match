const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');
const cloudinary = require('cloudinary').v2;

class EventController {
  static async getEvents(req, res) {
    try {
      const db = getDb();
      const events = await db.collection('events').find().toArray();
      res.send(events);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  static async getEvent(req, res) {
    try {
      const db = getDb();
      const event = await db.collection('events').findOne({ _id: new ObjectId(req.params.eventId) });
      res.send(event);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  static async createEvent(req, res) {
    try {
      const { name, category, address, date, quota, description, location } = req.body;
      const result = await cloudinary.uploader.upload(req.file.path);
      const db = getDb();
      const event = {
        name,
        category,
        address,
        date,
        quota,
        description,
        location: JSON.parse(location),
        imageLocation: result.secure_url,
        author: new ObjectId(req.user._id),
        authorUsername: req.user.username,
        player: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection('events').insertOne(event);
      res.send(event);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  static async joinEvent(req, res) {
    try {
      const db = getDb();
      const event = await db.collection('events').findOne({ _id: new ObjectId(req.params.eventId) });
      if (!event) {
        return res.status(404).send({ message: 'Event not found' });
      }
      if (event.player.includes(req.user._id)) {
        return res.status(400).send({ message: 'User already joined the event' });
      }
      if (event.player.length >= event.quota) {
        return res.status(400).send({ message: 'Event is full' });
      }
      event.player.push({
        _id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar
      });
      await db.collection('events').updateOne({ _id: new ObjectId(req.params.eventId) }, { $set: { player: event.player } });
      res.send(event);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  static async checkEvent() {
    try {
      const today = new Date();
      const oneDayAfter = new Date();
      oneDayAfter.setDate(today.getDate() + 1);
      const twoDayAfter = new Date();
      twoDayAfter.setDate(today.getDate() + 2);
      const db = await getDb();
      let playersNotified = [];
      const getEvents = await db.collection('events').find({
        date: {
          $gt: oneDayAfter.toISOString(),
          $lt: twoDayAfter.toISOString()
        }
      }).toArray();

      getEvents.forEach((event) => {
        playersNotified.push(event._id);
        const players = event.players;
        const date = new Date(event.date).toLocaleDateString();
        players.forEach(async (player) => {
          const id = new ObjectId(player);
          await db.collection('users').updateOne(
            { _id: id },
            {
              $push: {
                notification: {
                  eventId: event._id,
                  message: `Can you attend ${event.name} at ${date}?`,
                  createdAt: new Date().toISOString()
                }
              }
            }
          );
        });
      });
      let id = playersNotified.join(',');
      console.log(`Player(s) with ID(s) ${id} have been notified.`);
    } catch (error) {
      console.log(error);
    }
  }

  static async checkNotification() {
    try {
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(today.getDate() - 1)
      const tommorow = new Date()
      tommorow.setDate(today.getDate() + 1)
      const db = await getDb()
      const users = await db.collection("users").find().toArray()
      for(const user of users) {
        let banned = false
        const notifIndex = []
        let notifications = user.notification
        for (let i = 0; i < notifications.length; i++) {
          const notification = notifications[i];
          if (notification.date === yesterday || notification.date > yesterday) {
            banned = true
            notifIndex.push(i)
          }
        }
        const newNotif = notifications.filter((_,index) => !notifIndex.includes(index))
        if (banned) {
          const banUser = await db.collection("users").updateOne(
            { _id: user._id },
            {
              $set: {
                status: {
                  ban: true,
                  duration: tommorow.toISOString()
                },
                notifications: newNotif
              }
            }
          )
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  static async unableToJoin(req, res, next) {
    try {
      const { _id } = req.user
      const { eventId } = req.params
      const userId = new ObjectId(_id)
      const db = await getDb()
      const user = await db.collection("users").findOne({ _id: userId })
      if (!user) {
        return res.status(404).json({ message: "Id not found" })
      }
      const index = user.notification.findIndex(obj => obj._id === new ObjectId(eventId))
      user.notification.splice(index, 1)
      const updateNotif = await db.collection("users").updateOne(
        { _id: new ObjectId(eventId) },
        {
          $set: {
            notification: user.notification
          }
        }
      )

      const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) })
      if (!event) {
        return res.status(404).json({ message: "Id not found" })
      }
      const playerIndex = event.player.findIndex(obj => obj._id === userId)
      event.player.splice(playerIndex, 1)
      const updateEvent = await db.collection("ecents").updateOne(
        { _id: new ObjectId(eventId) },
        {
          $set: {
            player: event.player
          }
        }
      )
      res.status(201).json({ message: 'succesfully updated notification and event player' })
    } catch (error) {
      res.status(400).json(error)
    }
  }
}

module.exports = EventController;
