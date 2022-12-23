const express = require('express');
const { protect } = require('../middleware/auth');
const multer = require('multer');
//var upload = multer({ dest: 'image/' })

const storage = multer.memoryStorage({
      acl: 'public-read-write',
      destination: (req, file, callback) => {
            callback(null, '');
      }
});
const upload = multer({ storage }).single('file');

const { getUsers, getUser, createUser, getUserById, updateUser, deleteUser,
      getTrainee, createTrainee, updateTrainee, getAllTrainees, deleteTrainee,
      loginUser, searchUserByQuery, getMyTrainer, updateAvatar,
      forgatPassword, resetPassword, updateAvatarTrainee } = require('../controllers/users');
const { json } = require('express');

const router = express.Router();

router
      .route('/all')
      .get(getUsers);

// CRUD Trainer
router
      .route('/')
      .get(protect, getUser)
      .post(createUser)
      .put(protect, upload, updateUser)
      .delete(protect, deleteUser);

router
      .route('/:id')
      .get(getUserById);

router
      .route('/avatar')
      .put(protect, upload, updateAvatar)

router
      .route('/avatar/tarinee/:id')
      .put(protect, upload, updateAvatarTrainee)

router
      .route('/file')
      .post(protect, upload, async (req, res) => {
            res.json(req.file.filename)
      })

//CRUD Trainee
router
      .route('/trainee')
      .get(protect, getAllTrainees)
      .post(protect, createTrainee);

router
      .route('/trainee/mytrainer')
      .get(protect, getMyTrainer);
router
      .route('/trainee/:id')
      .get(protect, getTrainee)
      .put(protect, updateTrainee)
      .delete(protect, deleteTrainee);

router.route('/search').get(searchUserByQuery);
router.route('/login').post(loginUser);
router.route('/forgatpass').post(forgatPassword);
router.route('/resetpassword/:resettoken').put(resetPassword);

module.exports = router;

