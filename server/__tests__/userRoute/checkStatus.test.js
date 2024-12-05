const { MongoClient } = require("mongodb");
const { faker } = require("@faker-js/faker");
const dotenv = require('dotenv');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require("../../app");
const EventController = require("../../controllers/eventController");
const UserController = require("../../controllers/userController");
dotenv.config()
jest.setTimeout(30000);

const uri = process.env.MONGO_URI
console.log(uri), "ini uri";

const client = new MongoClient(uri);

describe("check status", () => {
    let now = new Date();
    let eventDate = now.getTime() + (1.5 * 24 * 60 * 60 * 1000);
    eventDate = (new Date(eventDate)).toISOString()
    let yesterday = now.getTime() - (2 * 24 * 60 * 60 * 1000)
    yesterday = (new Date(yesterday)).toISOString()
    let eventsCollection;
    let usersCollection
    let userData = [{
        "username": "user1",
        "email": "user1@mail.com",
        "password": "$2a$08$mQ6Qu4NQ9qYbAyPDCQZtLOkA0/u.4QngQttmQ6ayUJ3PD03/wPbIW",
        "notification": [],
        "status": {
            "ban": true,
            "duration": yesterday
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

    let user1_Id
    let user1_token
    let user2_Id
    let user2_token


    beforeAll(async () => {
        try {
            await client.connect();
            const db = client.db("x-match");
            usersCollection = db.collection("users");
            await usersCollection.insertMany(userData)
            const users = await usersCollection.find().toArray()
            user1_Id = users[0]._id
            user1_token = jwt.sign({ _id: user1_Id.toString() }, process.env.JWT_SECRET)
            user2_Id = users[1]._id
            user2_token = jwt.sign({ _id: user2_Id.toString() }, process.env.JWT_SECRET)
        } catch (err) {
            console.error("Error connecting to the database:", err);
        }
    });

    test("Test check event", async () => {
        const response = await UserController.checkStatus()
        const updatedUser = await usersCollection.findOne({_id: user1_Id})
        console.log(updatedUser, "ini updated User")
        expect(updatedUser).toBeInstanceOf(Object)
        expect(updatedUser.status).toHaveProperty("ban", false)
        expect(updatedUser.status).toHaveProperty("duration", "")
    }, 30000);


    afterAll(async () => {
        try {
            await usersCollection.deleteMany({})
        } catch (error) {
            console.log(error)
        } finally {
            await client.close();
        }
    });
});