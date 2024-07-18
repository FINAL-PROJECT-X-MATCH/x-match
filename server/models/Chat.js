const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');

const createChat = async (chat) => {
  const db = getDb();
  const result = await db.collection('chats').insertOne(chat);
  return { ...chat, _id: result.insertedId };
};

const getChatsByEventId = async (eventId) => {
  const db = getDb();
  const chats = await db.collection('chats').find({ eventId: new ObjectId(eventId) }).toArray();
  console.log(chats, "ini di get chat by event id");
  return chats;
};

module.exports = { createChat, getChatsByEventId };
