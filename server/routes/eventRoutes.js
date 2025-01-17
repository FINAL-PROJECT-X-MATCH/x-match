const express = require('express');
const EventController = require('../controllers/eventController');
const auth = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.get('/events', auth, EventController.getEvents);
router.get('/event/:eventId', auth, EventController.getEvent);
router.post('/event', auth, upload.single('imageLocation'), EventController.createEvent);
router.post('/event/:eventId/join', auth, EventController.joinEvent);
// router.get('/events/check', auth, EventController.checkEvent);
// router.delete('/event/:eventId/:userId', auth, EventController.unableToJoin);
router.delete('/event/:eventId/', auth, EventController.unableToJoin)
router.post('/midtrans/transaction', auth, EventController.createTransaction);
router.post('/midtrans/notification', EventController.handleTransactionNotification);

module.exports = router;
