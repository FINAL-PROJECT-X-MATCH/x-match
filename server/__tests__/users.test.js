const app = require("../app");
const request = require("supertest");
const jwt = require('jsonwebtoken');
const { MongoClient} = require("mongodb");
const { faker } = require("@faker-js/faker");
const UserController = require("../controllers/userController");
jest.setTimeout(30000);

const uri = process.env.MONGO_URI
  

const client = new MongoClient(uri);
const user1 = {
  username: "User Test",
  email: "user.test@mail.com",
  password: "usertest",
};
const google_token ="eyJhbGciOiJSUzI1NiIsImtpZCI6IjBlMzQ1ZmQ3ZTRhOTcyNzFkZmZhOTkxZjVhODkzY2QxNmI4ZTA4MjciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIyOTUwNzYzODkyNTgtMnQ0aWhkbmVwaTJzbm52Mm1nbmt2dmZvOWU0cWI5NWguYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIyOTUwNzYzODkyNTgtMnQ0aWhkbmVwaTJzbm52Mm1nbmt2dmZvOWU0cWI5NWguYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTM4OTQ1ODU0MjY5NTYxODEyNDciLCJlbWFpbCI6InNldG95dWRpYXJnb0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmJmIjoxNzIxMjY5MDI4LCJuYW1lIjoic2V0byB5dWRpYXJnbyIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLMUtVU2RnRXBMZkREajdkZkYtLUJZUVNueDdoX3NRdGc0R1ZiRGw0N3UwRnBvWUowPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6InNldG8iLCJmYW1pbHlfbmFtZSI6Inl1ZGlhcmdvIiwiaWF0IjoxNzIxMjY5MzI4LCJleHAiOjE3MjEyNzI5MjgsImp0aSI6IjM4MmQ5MTYxNGZiOTQxOGQwZTE0NmMwNWE0Y2ZlMTljMjkzMDhhZTUifQ.EwEF_XXfvGbFagnQmlIvLOjo50kQb_fzPkrzYDqdEOy1DZuimjKKW67091gYIW5dHdus8_-TTZBdslioKjcbLrWoDYGsbn1USvR-5YicwEFY9BOOw1cpEiUJX7cy0Vl1rwsYAZNvaRm3fiI38zmNaEqRqDH9JhCNRDOQpKXjL9ktRZBjSEOIHgVI7tODt2jMeer9vaUGXxRHT8gwjGNGi_vuZVZPYGOhX5KvPI6qb1b4DGUDCcAltjKnYcZMIsuA_swtGciDb-g0ZsYzgNYbvieqkGMJnrRkM7iLu7JF3K0q_YMSwXL8X82Ekch-XIoZZG2MdMtQabG_6gnT5TFtBA"
let userData = [{
  "username": "user1",
  "email": "user1@mail.com",
  "password": "$2a$08$mQ6Qu4NQ9qYbAyPDCQZtLOkA0/u.4QngQttmQ6ayUJ3PD03/wPbIW",
  "notification": [],
  "status": {
    "ban": false,
    "duration": ""
  },
  "avatar" : "ini avatar dia bro",
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
  "avatar" : "ini avatar dia bro",
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
  "avatar" : "ini avatar dia bro",
  "createdAt": "2024-07-16T14:32:14.652Z",
  "updatedAt": "2024-07-16T14:32:14.652Z"
}]
let eventsData = [
  {
    "name": "Fun Futsal",
    "category": "Futsal",
    "address": "",
    "date": "2024-07-20T02:36:00.000Z",
    "quota": "2",
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

describe("Database Tests", () => {
  let usersCollection;
  let user1_Id
  let user1_token


  beforeAll(async () => {
    try {
      await client.connect();
      const db = client.db("x-match");
      usersCollection = db.collection("users");
      await usersCollection.insertMany(userData)
      const users = await usersCollection.find().toArray()
      user1_Id = users[0]._id
      user1_token = jwt.sign({_id: user1_Id.toString()}, process.env.JWT_SECRET)

      eventsCollection = db.collection("events");
      await eventsCollection.insertMany(eventsData)
      const events = await eventsCollection.find().toArray()
      console.log(events);
      event1_Id = events[0]._id
      event1_Id = event1_Id.toString()
      console.log(event1_Id);
    } catch (err) {
      console.error("Error connecting to the database:", err);
    }
  });

  describe("User Routes test",()=>{
    test("Test 201 success Register",async()=>{
      const response = await request(app).post('/register').send(user1)
      expect(response.status).toBe(201)
      expect(response.body).toBeInstanceOf(Object)
      expect(response.body).toHaveProperty('user.username',user1.username)
      expect(response.body).toHaveProperty('user.email',user1.email)
    })

    test("Test 200 success Login return access_token",async()=>{
      const response = await request(app).post('/login').send(user1)
      expect(response.status).toBe(200)
      expect(response.body).toBeInstanceOf(Object)
      expect(response.body).toHaveProperty('access_token',expect.any(String))
      expect(response.body).toHaveProperty('user.id',expect.any(String))
      expect(response.body).toHaveProperty('user.username',user1.username)
      expect(response.body).toHaveProperty('user.email',user1.email)
    })
    test("Test 400 Failed Login invalid email/password",async()=>{
      const response = await request(app).post('/login').send({
        email:'email.co',
        password:'salah password'
      })
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message',"Invalid email/password")
    })
    test("Test 400 Failed Login invalid email/password",async()=>{
      const response = await request(app).post('/login').send({
        email:user1.email,
        password:'salah password'
      })
      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('message',"Invalid email/password")
    })
    test("Test 200 success Get User",async()=>{
      const response = await request(app).get('/user').set('Authorization', `Bearer ${user1_token}` )
      expect(response.status).toBe(200)
      expect(response.body).toBeInstanceOf(Object)
    })
    test("Test 201 success Patch user",async()=>{
      const response = await request(app).patch('/user').send({}).set('Authorization', `Bearer ${user1_token}`)
      expect(response.status).toBe(200)
      expect(response.body).toBeInstanceOf(Object)
      expect(response.body).toHaveProperty('_id', expect.any(String))
      expect(response.body).toHaveProperty("username",userData[0].username)
      expect(response.body).toHaveProperty("email",userData[0].email)
      expect(response.body).toHaveProperty("password",userData[0].password)
      expect(response.body).toHaveProperty("notification",userData[0].notification)
      expect(response.body).toHaveProperty("status",userData[0].status)
      expect(response.body).toHaveProperty("avatar",userData[0].avatar)
      expect(response.body).toHaveProperty("createdAt",userData[0].createdAt)
    })
    test("Test 200 success get event user",async()=>{
      const response = await request(app).get('/user/events').set('Authorization', `Bearer ${user1_token}`)
      expect(response.status).toBe(200)
      expect(response.body).toBeInstanceOf(Array)
      // expect(response.body[0]).toBeInstanceOf(Object)
      // expect(response.body[0]).toHaveProperty('_id', expect.any(String))
      // expect(response.body[0]).toHaveProperty("username",userData[0].username)
      // expect(response.body[0]).toHaveProperty("email",userData[0].email)
      // expect(response.body[0]).toHaveProperty("password",userData[0].password)
      // expect(response.body[0]).toHaveProperty("notification",userData[0].notification)
      // expect(response.body[0]).toHaveProperty("status",userData[0].status)
      // expect(response.body[0]).toHaveProperty("avatar",userData[0].avatar)
      // expect(response.body[0]).toHaveProperty("createdAt",userData[0].createdAt)

    })
    test("Test 200 success get joined event",async()=>{
      const response = await request(app).get('/user/joined-events').set('Authorization', `Bearer ${user1_token}`)
      expect(response.status).toBe(200)
      expect(response.body).toBeInstanceOf(Array)
    })
    test("Test 201 success banned",async()=>{
      const response = await request(app).post(`/user/${user1_Id}/ban`).set('Authorization', `Bearer ${user1_token}`)
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty("message",`User with ID ${user1_Id} has been banned for 1 day`)
    })
  })
  test("Test user notification",async()=>{
    const response = await request(app).get('/user/notifications').set('Authorization', `Bearer ${user1_token}`)
    expect(response.status).toBe(200)
    expect(response.body).toBeInstanceOf(Array)
  })
  test("Test delete user notification",async()=>{
    const response = await request(app).delete(`/user/deleteNotif/${event1_Id}`).set('Authorization', `Bearer ${user1_token}`)
    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty("message","Event id is not register to the user")
  })
  test("Test user push token",async()=>{
    const response = await request(app).post('/users/push-token').set('Authorization', `Bearer ${user1_token}`)
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty("message",'Push token saved successfully')
  })

  test("Test 200 success google-login return access_token",async()=>{
    const response = await request(app).post('/google-login').send({token:google_token})
    expect(response.status).toBe(200)
    expect(response.body).toBeInstanceOf(Object)
    expect(response.body).toHaveProperty('access_token',expect.any(String))
    expect(response.body).toHaveProperty('user.id',expect.any(String))
    expect(response.body).toHaveProperty('user.username',expect.any(String))
    expect(response.body).toHaveProperty('user.email',expect.any(String))
  },30000)
  describe("Test Check Status",()=>{
    test("Test Check Status unbanned",async()=>{
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const response = await UserController.checkStatus()
      const user = await usersCollection.find({
        "status.ban": true,
        "status.duration": {
          $ne: "",
          $lt: yesterday.toISOString()
        }
      }).toArray();
       expect(user.length).toBe(0)
    })
    test("Test check Status Banned",async()=>{
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date();
      await usersCollection.updateOne(
        { _id: user1_Id },
        {
          $set: {
            status: {
              ban: true,
              duration: tomorrow.toISOString()
            }
          }
        }
      )
      const response = await UserController.checkStatus()
      const user = await usersCollection.find({
        "status.ban": true,
        "status.duration": {
          $ne: "",
          $lt: yesterday.toISOString()
        }
      }).toArray();
      expect(user.length).toBe(0)
    })

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

