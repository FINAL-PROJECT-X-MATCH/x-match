const { MongoClient } = require('mongodb');
require('dotenv').config();

const client = new MongoClient(process.env.MONGO_URI);

let db;

const connectDb = async () => {
  await client.connect();
  db = client.db('x-match');
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
};

module.exports = { connectDb, getDb };
