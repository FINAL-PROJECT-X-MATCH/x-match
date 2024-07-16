const { MongoClient } = require("mongodb");
const { faker } = require("@faker-js/faker");
const dotenv = require('dotenv')
dotenv.config()
jest.setTimeout(30000);

const uri = process.env.MONGO_URI
console.log(uri), "ini uri";

const client = new MongoClient(uri);

describe("Database Tests", () => {
  let eventsCollection;
  let usersCollection
  let userData = [{
    
  }]
  beforeAll(async () => {
    try {
      await client.connect();
      const db = client.db("mytestdb");
      usersCollection = db.collection("users");
      eventsCollection = db.collection("events");
    } catch (err) {
      console.error("Error connecting to the database:", err);
    }
  });

  test("Test CREATE", async () => {
    let newUsers = [];
    let total_users_to_add = 3;

    for (let i = 0; i < total_users_to_add; i++) {
      newUsers.push({
        name: faker.person.firstName(),
        email: faker.internet.email(),
      });
    }

    const result = await usersCollection.insertMany(newUsers);
    expect(result.insertedCount).toBe(total_users_to_add);
  }, 30000);

  afterEach(async () => {
    await usersCollection.deleteMany({});
  });

  afterAll(async () => {
    try {
    await usersCollection.deleteMany({})
    await eventsCollection.deleteMany({})      
    } catch (error) {
      
    } finally {
      await client.close();
    }
  });
});