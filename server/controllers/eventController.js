const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');
const cloudinary = require('cloudinary').v2;
const midtransClient = require('midtrans-client');
const axios = require('axios')

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
      console.log('masuk create event');
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
      console.log(event, 'ini event');
      event.player.push(req.user._id)

      await db.collection('events').insertOne(event);
      res.send(event);
    } catch (error) {
      console.log(error);
      res.status(400).send(error);
    }
  }

  static async joinEvent(req, res) {
    try {
      const db = getDb();
      console.log(req.user._id, "ini user id")
      const event = await db.collection('events').findOne({ _id: new ObjectId(req.params.eventId) });
      if (!event) {
        return res.status(404).send({ message: 'Event not found' });
      }
      if (event.player.map(playerId => playerId.toString()).includes(req.user._id.toString())) {
        return res.status(400).send({ message: 'User already joined the event' });
      }
      if (event.player.length >= event.quota) {
        return res.status(400).send({ message: 'Event is full' });
      }
      event.player.push(req.user._id);
      console.log(event);
      await db.collection('events').updateOne({ _id: new ObjectId(req.params.eventId) }, { $set: { player: event.player } });
      res.send(event);
    } catch (error) {
      res.status(400).send(error);
    }
  }
  

  static async sendPushNotification(token, message) {
    const body = {
      to: token,
      sound: 'default',
      title: 'Event Reminder',
      body: message,
      data: { message }
    };

    try {
      const response = await axios.post('https://exp.host/--/api/v2/push/send', body, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json'
        }
      });
      console.log('Push notification sent:', response.data);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  static async checkEvent() {
    try {
      const today = new Date();
      const oneDayAfter = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const twoDayAfter = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
      const db = await getDb();
      let playersNotified = [];

      const getEvents = await db.collection('events').find({
        date: {
          $gt: oneDayAfter.toISOString(),
          $lt: twoDayAfter.toISOString()
        }
      }).toArray();

      for (const event of getEvents) {
        console.log('Event:', event);
        playersNotified.push(event._id);
        const players = event.player || [];
        console.log('Players:', players);

        const date = new Date(event.date).toLocaleDateString();
        for (const playerId of players) {
          const id = new ObjectId(playerId);
          const user = await db.collection('users').findOne({ _id: id });
          if (user.pushToken) {
            await EventController.sendPushNotification(user.pushToken, `Can you attend ${event.name} at ${date}?`);
          }
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
        }
      }

      let id = playersNotified.join(',');
      console.log(`Player(s) with ID(s) ${id} have been notified.`);
    } catch (error) {
      console.error('Error in checkEvent:', error);
    }
  }

  static async checkNotification() {
    try {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const db = await getDb();
      const users = await db.collection("users").find().toArray();
      for (const user of users) {
        let banned = false;
        const notifIndex = [];
        let notifications = user.notification || [];
        for (let i = 0; i < notifications.length; i++) {
          const notification = notifications[i];
          if (new Date(notification.createdAt) <= yesterday) {
            banned = true;
            notifIndex.push(i);
          }
        }
        const newNotif = notifications.filter((_, index) => !notifIndex.includes(index));
        if (banned) {
          await db.collection("users").updateOne(
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
      }
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

      console.log(`User ID: ${_id}`);
      console.log(`Event ID: ${eventId}`);

      const user = await db.collection("users").findOne({ _id: userId });
      const notifications = user.notification || [];
      console.log(`User notifications before update: ${JSON.stringify(notifications)}`);

      const index = notifications.findIndex(obj => obj.eventId.equals(new ObjectId(eventId)));
      
      if (index !== -1) {
        notifications.splice(index, 1);
      } 
      
      console.log(`User notifications after update: ${JSON.stringify(notifications)}`);

      await db.collection("users").updateOne(
        { _id: userId },
        {
          $set: {
            notification: notifications
          }
        }
      );

      const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) });
     console.log(event, "ini event");
      if (!event) {
        console.log("Event not found");
        return res.status(404).json({ message: "Event not found" });
      }
      console.log(`Event players before update: ${JSON.stringify(event.player)}`);

      const playerIndex = event.player.findIndex(obj => obj.equals(userId));
      if (playerIndex !== -1) {
        event.player.splice(playerIndex, 1);
      }
      console.log(`Event players after update: ${JSON.stringify(event.player)}`);

      await db.collection("events").updateOne(
        { _id: new ObjectId(eventId) },
        {
          $set: {
            player: event.player
          }
        }
      );

      res.status(201).json({ message: 'Successfully updated notification and event player' });
    } catch (error) {
      console.error("Error in unableToJoin:", error);
      res.status(400).json({ message: 'Error updating notification and event player', error });
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
      console.log(transaction.token, "<<<<<<<")
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
      res.status(400).send(error);
    }
  }
  
}

module.exports = EventController;
