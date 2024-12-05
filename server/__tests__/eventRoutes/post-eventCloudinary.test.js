const { MongoClient, ObjectId } = require("mongodb");
const { faker } = require("@faker-js/faker");
const dotenv = require('dotenv');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require("../../app");
dotenv.config()
jest.setTimeout(30000);

const uri = process.env.MONGO_URI

const client = new MongoClient(uri);

describe("POST /midtrans/transaction", () => {
  let eventsCollection;
  let usersCollection
  let userData = [{
    "username": "user1",
    "email": "user1@mail.com",
    "password": "$2a$08$mQ6Qu4NQ9qYbAyPDCQZtLOkA0/u.4QngQttmQ6ayUJ3PD03/wPbIW",
    "notification": [],
    "status": {
      "ban": false,
      "duration": ""
    },
    "avatar": "ini avatar dia bro",
    "createdAt": "2024-07-16T14:32:14.652Z",
    "updatedAt": "2024-07-16T14:32:14.652Z"
  }, {
    "username": "user2",
    "email": "user2@mail.com",
    "password": "$2a$08$mQ6Qu4NQ9qYbAyPDCQZtLOkA0/u.4QngQttmQ6ayUJ3PD03/wPbIW",
    "notification": [],
    "status": {
      "ban": false,
      "duration": ""
    },
    "avatar": "ini avatar dia bro",
    "createdAt": "2024-07-16T14:32:14.652Z",
    "updatedAt": "2024-07-16T14:32:14.652Z"
  }, {
    "username": "user3",
    "email": "user3@mail.com",
    "password": "$2a$08$mQ6Qu4NQ9qYbAyPDCQZtLOkA0/u.4QngQttmQ6ayUJ3PD03/wPbIW",
    "notification": [],
    "status": {
      "ban": false,
      "duration": ""
    },
    "avatar": "ini avatar dia bro",
    "createdAt": "2024-07-16T14:32:14.652Z",
    "updatedAt": "2024-07-16T14:32:14.652Z"
  }]
  let eventsData = [
    {
      "name": "Fun Futsal",
      "category": "Futsal",
      "address": "",
      "date": "2024-07-20T02:36:00.000Z",
      "quota": "5",
      "description": "Mari olahraga supaya sehat",
      "location": {
        "latitude": -7.2655776,
        "longitude": 112.7468294
      },
      "imageLocation": "https://res.cloudinary.com/dswmqbrqi/image/upload/v1721011367/uzkukdkm1zi0blrewckq.jpg",
      "author": "66948b2fcc42652aedc14e2e",
      "authorUsername": "bayu5@mail.com",
      "player": [],
      "createdAt": "2024-07-15T02:42:48.936Z",
      "updatedAt": "2024-07-15T02:42:48.936Z"
    },
    {
      "name": "adu siput",
      "category": "Futsal",
      "address": "GGP5+V7 Pelayang, Tebo Regency, Jambi, Индонезия",
      "date": "2024-07-31T03:07:00.000Z",
      "quota": "2",
      "description": "lomba adu siput",
      "location": {
        "latitude": -1.4628674942651303,
        "longitude": 102.50820857341434
      },
      "imageLocation": "https://res.cloudinary.com/dswmqbrqi/image/upload/v1721012993/ktqpuzamyyxfeedlq3fe.jpg",
      "author": "66949263cc42652aedc14e33",
      "authorUsername": "1",
      "player": [],
      "createdAt": "2024-07-15T03:09:54.151Z",
      "updatedAt": "2024-07-15T03:09:54.151Z"
    }
  ]
  let user1_Id
  let user1_token
  let user2_Id
  let user2_token
  let user3_Id
  let user3_token

  let event1_Id
  beforeAll(async () => {
    try {
      await client.connect();
      const db = client.db("x-match");
      usersCollection = db.collection("users");
      await usersCollection.insertMany(userData)
      const users = await usersCollection.find().toArray()
      user1_Id = users[0]._id
      console.log(user1_Id, "ini id user 1");
      user1_token = jwt.sign({ _id: user1_Id.toString() }, process.env.JWT_SECRET)
      user2_Id = users[1]._id
      user2_token = jwt.sign({ _id: user2_Id.toString() }, process.env.JWT_SECRET)
      user3_Id = users[2]._id
      user3_token = jwt.sign({ _id: user3_Id.toString() }, process.env.JWT_SECRET)

      eventsCollection = db.collection("events");
      await eventsCollection.insertMany(eventsData)
      const events = await eventsCollection.find().toArray()
      event1_Id = events[0]._id
      event1_Id = event1_Id.toString()

      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      await eventsCollection.updateOne(
        { _id: event1_Id },
        {
          $set: {
            player: [user1_Id, user2_Id]
          }
        }
      )
      await usersCollection.updateOne(
        { _id: user1_Id },
        {
          $set: {
            notification: [
              {
                eventId: new ObjectId(event1_Id),
                message: `Can you attend this event at tommorow?`,
                createdAt: yesterday.toISOString()
              }
            ]
          }
        }
      )

      await usersCollection.updateOne(
        { _id: user2_Id },
        {
          $set: {
            notification: [
              {
                eventId: new ObjectId(event1_Id),
                message: `Can you attend this event at tommorow?`,
                createdAt: yesterday.toISOString()
              }
            ]
          }
        }
      )

    } catch (err) {
      console.error("Error connecting to the database:", err);
    }
  });

  test("Test Success createTransaction", async () => {
    const body = {
      eventId: event1_Id,
      amount: 5000
    }
    const response = await request(app).post(`/midtrans/transaction`).send(body).set('Authorization', `Bearer ${user1_token}`)
    expect(response.status).toBe(200)
    expect(response.body).toBeInstanceOf(Object)
    expect(response.body).toHaveProperty("token", expect.any(String))

  })

  test("Test fail wrong event id", async () => {
    const wrongEventId = '669764feeeaf446d711c7433'
    const body = {
      eventId: new ObjectId(wrongEventId),
      amount: 5000
    }
    const response = await request(app).post(`/midtrans/transaction`).send(body).set('Authorization', `Bearer ${user2_token}`)
    expect(response.status).toBe(404)
    expect(response.body).toBeInstanceOf(Object)
    expect(response.body).toHaveProperty("message", "Event not found")
  })

  afterAll(async () => {
    try {
      await usersCollection.deleteMany({})
      await eventsCollection.deleteMany({})
    } catch (error) {
      console.log(error)
    } finally {
      await client.close();
    }
  });
});