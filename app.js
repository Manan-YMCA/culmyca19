var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path = require('path');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })) 

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

// Mongoose Connection 
mongoose.connect('mongodb://naman:naman123@ds255364.mlab.com:55364/zomato',{ useNewUrlParser: true })

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error: '));

//Show that our db is succesfully Connected
db.once('open', function(){
console.log("Connected to Mongo Lab: ");
});

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