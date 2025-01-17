const express = require('express');
const UserController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/google-login', UserController.googleLogin);
router.get('/user', auth, UserController.getUser);
router.patch('/user', auth, upload.single('image'), UserController.updateUser);
router.get('/user/events', auth, UserController.getUserEvents);
router.get('/user/joined-events', auth, UserController.getJoinedEvents);
router.post('/user/:userId/ban', auth, UserController.banUser);
router.get('/users/check-status', auth, UserController.checkStatus);
router.get('/user/notifications', auth, UserController.getNotifications);
router.delete('/user/deleteNotif/:eventId', auth, UserController.notificationOK)
router.post('/users/push-token', auth, UserController.savePushToken);


module.exports = router;
