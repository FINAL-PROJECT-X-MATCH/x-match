const { MongoClient } = require("mongodb");
const { faker } = require("@faker-js/faker");
const dotenv = require('dotenv');
const request = require('supertest'); 
const jwt = require('jsonwebtoken');
const app = require("../../app");
dotenv.config()
jest.setTimeout(30000);

const uri = process.env.MONGO_URI
console.log(uri), "ini uri";

const client = new MongoClient(uri);

describe("GET /events", () => {
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
      "player": [
          "66949263cc42652aedc14e33",
          "66948b2fcc42652aedc14e2e",
          "6694e8a430ce579661f6e86d"
      ],
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
      "player": [
          "6694af730e0a195c77e03f9b"
      ],
      "createdAt": "2024-07-15T03:09:54.151Z",
      "updatedAt": "2024-07-15T03:09:54.151Z"
  }
  ]
  let user1_Id
  let user1_token
  let user2_Id
  let user2_token

  let event1_Id
  let event2_Id
  beforeAll(async () => {
    try {
      await client.connect();
      const db = client.db("x-match");
      usersCollection = db.collection("users");
      await usersCollection.insertMany(userData)
      const users = await usersCollection.find().toArray()
      user1_Id = users[0]._id
      user1_token = jwt.sign({_id: user1_Id.toString()}, process.env.JWT_SECRET)
      user2_Id = users[1]._id
      user2_token = jwt.sign({_id: user2_Id.toString()}, process.env.JWT_SECRET)


      eventsCollection = db.collection("events");
      await eventsCollection.insertMany(eventsData)
      const events = await usersCollection.find().toArray()
      event1_Id = events[0]._id
      event2_Id = events[1]._id

    } catch (err) {
      console.error("Error connecting to the database:", err);
    }
  });

  test("Test GET EVENTS", async () => {
    const response = await request(app).get('/events').set('authorization', `Bearer ${user1_token}` )
    expect(response.status).toBe(200)
    expect(response.body).toBeInstanceOf(Array)
    expect(response.body[0]).toBeInstanceOf(Object)
    expect(response.body[0]).toHaveProperty('_id', expect.any(String))
    expect(response.body[0]).toHaveProperty('name', eventsData[0].name)
    expect(response.body[0]).toHaveProperty('category',  eventsData[0].category)
    expect(response.body[0]).toHaveProperty('address',  eventsData[0].address)
    expect(response.body[0]).toHaveProperty('date',  eventsData[0].date)
    expect(response.body[0]).toHaveProperty('quota',  eventsData[0].quota)
    expect(response.body[0]).toHaveProperty('description',  eventsData[0].description)
    expect(response.body[0]).toHaveProperty('location',  eventsData[0].location)
    expect(response.body[0]).toHaveProperty('imageLocation',  eventsData[0].imageLocation)
    expect(response.body[0]).toHaveProperty('author',  eventsData[0].author)
    expect(response.body[0]).toHaveProperty('authorUsername',  eventsData[0].authorUsername)
    expect(response.body[0]).toHaveProperty('player',  eventsData[0].player)
    expect(response.body[0]).toHaveProperty('createdAt',  eventsData[0].createdAt)
    expect(response.body[0]).toHaveProperty('updatedAt',  eventsData[0].updatedAt)
  }, 30000);
  
  test("WRONG AUTH", async () => {
    const wongAuth = "wrong access_token"
    const response = await request(app).get('/events').set('authorization', `Bearer ${wongAuth}` )
    expect(response.status).toBe(401)
    expect(response.body).toBeInstanceOf(Object)
    expect(response.body).toHaveProperty("error", "Please authenticate.")
  })

  test("No auth", async () => {
    const response = await request(app).get('/events')
    expect(response.status).toBe(401)
    expect(response.body).toBeInstanceOf(Object)
    expect(response.body).toHaveProperty("error", "Authorization header not found")
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