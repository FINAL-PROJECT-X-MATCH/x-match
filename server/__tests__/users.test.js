const app = require("../app");
const request = require("supertest");
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
describe("Database Tests", () => {
  let usersCollection;

  beforeAll(async () => {
    try {
      await client.connect();
      const db = client.db("x-match");
      usersCollection = db.collection("users");
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
    
      test("400 Failed register - should return error if email is null", () => {
        request(app)
          .post("/register")
          .send({
            password: user1.password,
          })
          .end((err, res) => {
            if (err) return done(err);
            const { body, status } = res;
    
            expect(status).toBe(400);
            expect(body).toHaveProperty("message", "Email is required");
            
          });
      });
      test("400 Failed register - should return error if password is null", () => {
        request(app)
          .post("/register")
          .send({
            email: user1.email,
          })
          .end((err, res) => {
            if (err) return done(err);
            const { body, status } = res;
    
            expect(status).toBe(400);
            expect(body).toHaveProperty("message", "Password is required");
          });
      });
    })
  })
  describe("POST /login - user login",()=>{
    test("200 Success login - should return access_token", () => {
      request(app)
        .post("/login")
        .send(user1)
        .end((err, res) => {
          if (err) return done(err);
          const { body, status } = res;

          expect(status).toBe(200);
          expect(body).toHaveProperty("access_token", expect.any(String));
        });
    });
  })

  afterEach(async () => {
    await usersCollection.deleteMany({});
  });

  afterAll(async () => {
    await client.close();
  });
});


