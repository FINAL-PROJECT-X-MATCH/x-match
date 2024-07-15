const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');
const cloudinary = require('cloudinary').v2;
const midtransClient = require('midtrans-client');

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
      if (!event) {
        return res.status(404).send({ message: 'Event not found' });
      }
      res.send(event);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  static async createEvent(req, res) {
    try {
      const { name, category, address, date, quota, description, location, price } = req.body;
      const result = await cloudinary.uploader.upload(req.file.path);
      const db = getDb();
      const isFree = price === undefined || price === 'free';
      const eventPrice = isFree ? 'free' : Number(price) + 1000;
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
        price: eventPrice,
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
      if (event.player.some(player => player._id.equals(req.user._id))) {
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
      const oneDayAfter = new Date(today);
      oneDayAfter.setDate(today.getDate() + 1);
      const twoDaysAfter = new Date(today);
      twoDaysAfter.setDate(today.getDate() + 2);
      const db = await getDb();
      let playersNotified = [];
      const getEvents = await db.collection('events').find({
        date: {
          $gt: oneDayAfter.toISOString(),
          $lt: twoDaysAfter.toISOString()
        }
      }).toArray();

      getEvents.forEach(async (event) => {
        playersNotified.push(event._id);
        const players = event.player;
        console.log(event);
        const date = new Date(event.date).toLocaleDateString();
        players.forEach(async (player) => {
          const id = new ObjectId(player._id);
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
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const db = await getDb();
      const users = await db.collection('users').find().toArray();
      users.forEach(async (user) => {
        let banned = false;
        const notifIndex = [];
        let notifications = user.notification;
        notifications.forEach((notification, i) => {
          const notificationDate = new Date(notification.date);
          if (notificationDate >= yesterday && notificationDate < today) {
            banned = true;
            notifIndex.push(i);
          }
        });
        const newNotif = notifications.filter((_, index) => !notifIndex.includes(index));
        if (banned) {
          await db.collection('users').updateOne(
            { _id: user._id },
            {
              $set: {
                status: {
                  ban: true,
                  duration: tomorrow.toISOString()
                },
                notification: newNotif
              }
            }
          );
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  static async unableToJoin(req, res, next) {
    try {
      const { _id } = req.user;
      const { eventId } = req.params;
      const userId = new ObjectId(_id);
      const db = await getDb();
      const user = await db.collection("users").findOne({ _id: userId });
      if (!user) {
        return res.status(404).json({ message: "Id not found" });
      }
      const index = user.notification.findIndex(obj => obj.eventId.equals(new ObjectId(eventId)));
      if (index !== -1) {
        user.notification.splice(index, 1);
        await db.collection("users").updateOne(
          { _id: userId },
          { $set: { notification: user.notification } }
        );
      }
      const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) });
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      const playerIndex = event.player.findIndex(obj => obj._id.equals(userId));
      if (playerIndex !== -1) {
        event.player.splice(playerIndex, 1);
        await db.collection("events").updateOne(
          { _id: new ObjectId(eventId) },
          { $set: { player: event.player } }
        );
      }
      res.status(201).json({ message: 'Successfully updated notification and event player' });
    } catch (error) {
      res.status(400).json(error);
    }
  }
}

module.exports = EventController;
