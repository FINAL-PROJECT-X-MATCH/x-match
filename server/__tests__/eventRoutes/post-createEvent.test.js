const { MongoClient } = require("mongodb");
const fs = require("fs")
const path = require("path")
const dotenv = require('dotenv');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require("../../app");
dotenv.config()
jest.setTimeout(30000);
const filePath = path.resolve(__dirname, "../../assets/images.jpeg")
const imageBuffer = fs.readFileSync(filePath)
const uri = process.env.MONGO_URI
console.log(uri), "ini uri";

const client = new MongoClient(uri);

describe("post /event", () => {
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
            user1_token = jwt.sign({ _id: user1_Id.toString() }, process.env.JWT_SECRET)
            user2_Id = users[1]._id
            user2_token = jwt.sign({ _id: user2_Id.toString() }, process.env.JWT_SECRET)


            eventsCollection = db.collection("events");
            await eventsCollection.insertMany(eventsData)
            const events = await usersCollection.find().toArray()
            event1_Id = events[0]._id
            event2_Id = events[1]._id

        } catch (err) {
            console.error("Error connecting to the database:", err);
        }
    });

    test("Test CREATE EVENT", async () => {
        const body = {
            name: 'test',
            category: 'renang',
            address: "Jalan bukit tinggi VIX",
            date: new Date(),
            quota: '5',
            description: "berenang bersama",
            location: JSON.stringify({
                latitude: '1.21542',
                longitude: '-15.2153'
            }),
            price: 1000
        }
        const response = await request(app)
            .post('/event')
            .set('Authorization', `Bearer ${user1_token}`)
            .field('name', body.name)
            .field('category', body.category)
            .field('address', body.address)
            .field('date', body.date.toISOString())
            .field('quota', body.quota)
            .field('description', body.description)
            .field('location', body.location)
            .field('price', body.price)
            .attach('imageLocation', imageBuffer, 'images.jpeg');
        expect(response.status).toBe(200)
        expect(response.body).toBeInstanceOf(Object)
        expect(response.body).toHaveProperty('name', body.name)
        expect(response.body).toHaveProperty('category', body.category)
        expect(response.body).toHaveProperty('address', body.address)
    }, 30000);

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