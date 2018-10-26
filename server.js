// =======================
// get the packages we need ============
// =======================
var express     = require('express');
var app         = express();
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model
const apiRoutes = require('./app/routes/api');

// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens

mongoose.connect(config.db, {useNewUrlParser: true}); // connect to database

// use body parser so we can get info from POST and/or URL parameters
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =======================
// routes ================
// =======================
// basic route
app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

// API ROUTES -------------------
// we'll get to these in a second
app.get('/setup', async (req, res) => {
  // create a sample user
  var test = new User({
    name: 'xumium',
    password: 'password',
    admin: true
  });

  try {
    // save the sample user
    await test.save();
    console.log('User saved successfully');
    res.json({ success: true })
  } catch (err) {
    console.error(err);
  }
});

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);


// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);
