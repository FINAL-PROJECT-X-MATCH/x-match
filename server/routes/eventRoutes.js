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
router.delete('/event/:eventId/', auth, EventController.unableToJoin)

module.exports = router;
