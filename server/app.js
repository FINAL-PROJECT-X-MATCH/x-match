const express = require('express');
const { connectDb } = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const chatRoutes = require('./routes/chatRoutes');
const http = require('http');
const socketIo = require('socket.io');
const cors = require("cors");
const timer = require('node-cron');
const EventController = require('./controllers/eventController');
const UserController = require('./controllers/userController');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);


app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(userRoutes);
app.use(eventRoutes);
app.use(chatRoutes);


io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('join', ({ eventId, userId }) => {
    socket.join(eventId);
  });

  socket.on('sendMessage', ({ eventId, userId, message, username , image}) => {
    const newMessage = { eventId, userId, message, username , image};
    io.to(eventId).emit('message', newMessage);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

timer.schedule('* 6 * * *', () => {
  EventController.checkEvent()
  EventController.checkNotification()
  UserController.checkStatus()
  }, {
    scheduled: true,
    timezone: "Asia/Jakarta"
  })

const startServer = async () => {
  try {
    await connectDb();
    console.log('Connected to MongoDB');
    server.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
  }
};

startServer();
