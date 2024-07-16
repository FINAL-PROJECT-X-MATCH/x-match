const express = require('express');
const UserController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/user', auth, UserController.getUser);
router.patch('/user', auth, upload.single('image'), UserController.updateUser);
router.get('/user/events', auth, UserController.getUserEvents);
// router.delete('/user/deleteNotif/:eventId', auth, UserController.notificationOK)
router.delete('/user/deleteNotif/:eventId', UserController.notificationOK)
router.post('/user/:userId/ban', auth, UserController.banUser);

module.exports = router;
