const app = require("../app");
const request = require("supertest");
const jwt = require('jsonwebtoken');
const { MongoClient} = require("mongodb");
const { faker } = require("@faker-js/faker");
jest.setTimeout(30000);

const uri = process.env.MONGO_URI
  

const client = new MongoClient(uri);
const user1 = {
  username: "User Test",
  email: "user.test@mail.com",
  password: "usertest",
};
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
    describe("POST /register - create new user",()=>{
      test("201 Success register - should create new User", () => {
        request(app)
          .post("/register")
          .send(user1)
          .end((err, res) => {
            if (err) return done(err);
            const { body, status } = res;
    
            expect(status).toBe(201);
            expect(body).toHaveProperty("username", user1.username);
            expect(body).toHaveProperty("email", user1.email);
          
          });
      });
    })
  })
  describe("POST /login - user login",()=>{
    test("200 Success login - should return access_token", () => {
      request(app)
        .post("/login")
        .send({
          email: "user.test@mail.com",
          password: "usertest",
        })
        .end((err, res) => {
          if (err) return done(err);
          const { body, status } = res;

          expect(status).toBe(200);
          expect(body).toHaveProperty("access_token", expect.any(String));
        });
    });
    test("400 Failed login - should return Invalid email/password", () => {
      request(app)
        .post("/login")
        .send({
          email: "salah email",
          password: "salah password",
        })
        .end((err, res) => {
          if (err) return done(err);
          const { body, status } = res;
          expect(status).toBe(400);
          expect(body).toHaveProperty("message", "Invalid email/password");
        });
    });

  })

  describe("GET /user", () => {
    test("200 success get user", () => {
      request(app)
        .get("/user")
        .set("Authorization", `Bearer ${user1_token}`)
        .then((response) => {
          const { body, status } = response;
          expect(status).toBe(200);
          expect(body).toBeInstanceOf(Object);
        })
    });
  });

  describe("PATCH /user",()=>{
    test("200 success update user",()=>{
      request(app)
      .patch("/user")
      .set("Authorization", `Bearer ${user1_token}`)
      .then((response)=>{
        const{body,status} = response;
        expect(status).toBe(200);
        expect(body).toBeInstanceOf(Object)
      })
    })
  })

  describe("GET /user/events",()=>{
    test("200 success get user event",()=>{
      request(app)
      .get("/user/events")
      .set("Authorization", `Bearer ${user1_token}`)
      .then((response)=>{
        const{body,status} = response;
        expect(status).toBe(200);
        expect(body).toBeInstanceOf(Object)
      })
    })
  })

  describe("GET /user/joined-events",()=>{
    test("200 success get user join event",()=>{
      request(app)
      .get("/user/joined-events")
      .set("Authorization", `Bearer ${user1_token}`)
      .then((response)=>{
        const{body,status} = response;
        expect(status).toBe(200);
        expect(body).toBeInstanceOf(Object)
      })
    })
  })
  
  describe("POST /user/:userId/ban",()=>{
    test("201 success post user ban",()=>{
      request(app)
      .post(`/user/${user1_Id}/ban`)
      .set("Authorization", `Bearer ${user1_token}`)
      .then((response)=>{
        const{body,status} = response;
        expect(status).toBe(201);
        expect(body).toBeInstanceOf(Object)
        expect(body).toHaveProperty("message", `User with ID ${user1_Id} has been banned for 1 day`);

      })
    })
  })
  
  describe("GET /users/check-status",()=>{
    test("200 check status",()=>{
      request(app)
      .get('/users/check-status')
      .set("Authorization", `Bearer ${user1_token}`)
      .then((response)=>{
        const{body,status} = response;
        expect(status).toBe(200);
        expect(body).toBeInstanceOf(Object)
        expect(body).toHaveProperty(`User(s) with ID(s) ${unbannedUsers.join(',')} has/have been unbanned`);

      })
    })
  })

  describe("GET /user/notifications",()=>{
    test("200 notification",()=>{
      request(app)
      .get('/user/notifications')
      .set("Authorization", `Bearer ${user1_token}`)
      .then((response)=>{
        const{body,status} = response;
        expect(status).toBe(200);
        expect(body).toBeInstanceOf(Object)

      })
    })

    test("400 failed get notification",()=>{
      request(app)
      .get('/user/notifications')
      .set("Authorization", `Bearer ${user1_token}`)
      .then((response)=>{
        const{body,status} = response;
        expect(status).toBe(400);
        expect(body).toBeInstanceOf(Object)
        expect(body).toHaveProperty("message",'Failed to get notifications')

      })
    })
  })

  describe("DELETE /user/deleteNotif/:eventId",()=>{
    test("200 notification",()=>{
      request(app)
      .delete(`/user/deleteNotif/${event1_Id}`)
      .set("Authorization", `Bearer ${user1_token}`)
      .then((response)=>{
        const{body,status} = response;
        expect(status).toBe(201);
        expect(body).toHaveProperty("message","succesfully delete notification")

      })
    })

  })

  describe("POST /users/push-token",()=>{
    test("200 success post token",()=>{
      request(app)
      .post("/users/push-token")
      .set("Authorization", `Bearer ${user1_token}`)
      .then((response)=>{
        const{body,status} = response;
        expect(status).toBe(200);
        expect(body).toHaveProperty("message",'Push token saved successfully')

    })
  })
  })

  afterAll(async () => {
    try {
      await usersCollection.deleteMany({})
      await eventsCollection.deleteMany({})
      await client.close();
    } catch (error) {
      console.log(error);
    }
  });
});

