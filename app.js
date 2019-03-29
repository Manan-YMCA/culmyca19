var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path = require('path');
var passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })) 

app.use(session({secret: 'keyboard cat', resave: false, saveUninitialized: false}));
app.use(cookieParser());

//Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  var allowedOrigins = ['http://127.0.0.1:3000', 'http://elementsculmyca.com/'];
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){ 
       res.setHeader('Access-Control-Allow-Origin', origin);
  }
  //res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:8020');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  return next();
});

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

// Mongoose Connection 
mongoose.connect('mongodb://namansachdeva:namansachdeva12@ds159204.mlab.com:59204/culmyca19',{ useNewUrlParser: true })

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error: '));

//Show that our db is succesfully Connected
db.once('open', function(){
console.log("Connected to Mongo Lab: ");
});

// Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Set path for the Routes
var routes = require('./routes/user');
var routes_club = require('./routes/club');
//Setting the views
app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'ejs');

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/club',routes_club);

var port = process.env.PORT || 3000
app.listen(port, function() {
    console.log("App is running on port " + port);
});