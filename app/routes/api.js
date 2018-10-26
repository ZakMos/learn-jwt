const express = require('express');
const User    = require('../models/user');
const config  = require('../../config'); // get our config file
const jwt     = require('jsonwebtoken'); // used to create, sign, and verify tokens

const decodeToken = (req, res, next) => {
  const token = req.headers['x-access-token'];

  if(!token){
    return res.status(403).json({
      message: 'No token provided.'
    });
  }

  // decodes the token, adds it to request object
  jwt.verify(token, config.secret, (err, decoded) => {
    if(err) {
      res.status(401).json({message: 'Failed to authenticate token.'});
    } else {
      req.decoded = decoded;
      next();
    }
  });
}


const validateUser = async (req, res, next) => {
  const {_id} = req.decoded;

  try {
    const user = await User.findById(_id).exec();

    if (!user) {
      return res.status(401).json({message: 'Failed to authenticate token.'});
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({message: 'Failed to authenticate token.'});
  }
}

// Route Handler
const sendToken = (req, res) => {
  const {user} = req;

  const payload = {
    _id: user._id
  }

  const token = jwt.sign(payload, config.secret ,{
    expiresIn: 60 * 60 * 24 // 24 hours
  });

  res.json({
    message: 'Enjoy your token!',
    token
  });
}

// get an instance of the router for api routes
const apiRoutes = express.Router();

// TODO: route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', async (req, res, next) => {
  const {name, password} = req.body;

  try {
    // Find the user
    const user = await User.findOne({name});
    console.log(user.password, password);

    if(!user || !user.authenticate(password)) {
      return res.status(401).json({ message: 'Authentication failed.' });
    }

    req.user = user;
    next();

  } catch(err) {
    console.error(err);
  }
}, sendToken);

// TODO: route middleware to verify a token
apiRoutes.use(decodeToken, validateUser);

// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/', (req, res) => {
  res.json({ message: 'Welcome to the coolest API on earth!' });
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.route('/users')
  .get(async (req, res) => {
    if(!req.user){
      return res.status(403).json({message: "You do not have sufficient permissions to read this resource"});
    }

    const data = await User.find();

    res.json(data);
  })
  .post(async (req, res, next) => {
    const newUser = new User(req.body);

    try {
      await newUser.save();
      req.user = newUser;
      next();
    } catch (err) {
      console.error(err);
    }
  }, sendToken);

module.exports = apiRoutes;
