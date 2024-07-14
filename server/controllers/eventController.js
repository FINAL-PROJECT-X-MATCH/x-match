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
      event.player.push(req.user._id);
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
        const players = event.player;
        const date = new Date(event.date).toLocaleDateString();
        players.forEach(async (player) => {
          const id = new ObjectId(player);
          await db.collection('users').updateOne(
            { _id: id },
            {
              $push: {
                notification: {
                  eventId: event._id,
                  message: `Can you attend ${event.name} at ${date}?`
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
}

module.exports = EventController;
