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
router.post('/user/:userId/ban', auth, UserController.banUser);
router.get('/users/check-status', auth, UserController.checkStatus);

module.exports = router;
