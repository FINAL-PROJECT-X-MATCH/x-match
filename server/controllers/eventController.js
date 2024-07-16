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
      await db.collection('events').updateOne(
        { _id: new ObjectId(req.params.eventId) },
        { $set: { player: event.player } }
      );
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
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(today.getDate() - 1)
      const tommorow = new Date()
      tommorow.setDate(today.getDate() + 1)
      const db = await getDb()
      const users = await db.collection("users").find().toArray()
      users.forEach(async (user) => {
        let banned = false
        const notifIndex = []
        let notifications = user.notification
        notifications.forEach(async (notification, i) => {
          if (notification.date === yesterday || notification.date > yesterday) {
            banned = true
            notifIndex.push(i)
          }
        })
        const newNotif = notifications.filter((_,index) => !notifIndex.includes(index))
        if (banned === true) {
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
      })
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

  static async createTransaction(req, res) {
    try {
      const { eventId, amount } = req.body;
      const db = getDb();
      const event = await db.collection('events').findOne({ _id: new ObjectId(eventId) });
      if (!event) {
        return res.status(404).send({ message: 'Event not found' });
      }

      const snap = new midtransClient.Snap({
        isProduction: false,
        serverKey: 'SB-Mid-server-8V82JIS0MWfU2t-6hZwuynDl',
        clientKey: 'SB-Mid-client-0EqnETEPgKmeo1sV',
      });

      const parameter = {
        transaction_details: {
          order_id: `order-id-${Math.round((new Date()).getTime() / 1000)}`,
          gross_amount: amount,
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          first_name: req.user.username,
          email: req.user.email,
        },
      };

      const transaction = await snap.createTransaction(parameter);
      const transactionData = {
        eventId: new ObjectId(eventId),
        userId: new ObjectId(req.user._id),
        amount,
        orderId: parameter.transaction_details.order_id,
        transactionStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('transactions').insertOne(transactionData);

      res.send({ token: transaction.token });
    } catch (error) {
      res.status(400).send(error);
    }
  }

  static async handleTransactionNotification(req, res) {
    try {
      const { order_id, transaction_status } = req.body;
      console.log(`Received notification for order_id: ${order_id}, transaction_status: ${transaction_status}`);
      const db = getDb();
  
      const transaction = await db.collection('transactions').findOne({ orderId: order_id });
      if (!transaction) {
        return res.status(404).send({ message: 'Transaction not found' });
      }
  
      await db.collection('transactions').updateOne(
        { _id: transaction._id },
        { $set: { transactionStatus: transaction_status, updatedAt: new Date() } }
      );
  
      if (transaction_status === 'settlement') {
        await db.collection('events').updateOne(
          { _id: transaction.eventId },
          { $push: { player: { _id: transaction.userId, username: req.user.username } } }
        );
      }
  
      res.status(200).send({ message: 'Transaction status updated' });
    } catch (error) {
      console.log(error);
      res.status(400).send(error);
    }
  }
  
}

module.exports = EventController;
