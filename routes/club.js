var express = require('express');
let router = express.Router();
var passport = require('passport');
const session = require('express-session');
var LocalStrategy = require('passport-local').Strategy;
var Admin = require('../models/admins');

passport.use(new LocalStrategy(
  function(username, password, done) {
    Admin.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (user.password != password) { return done(null, false); }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});


 router.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

  router.get('/logout',
        function (req, res) {
            req.logout();
            res.redirect('/');
        });

router.get('/register',function(req,res){
      res.render('club_register');
});

router.post('/register',function(req,res){
        var username = req.body.username;
        var password = req.body.password;

        var newAdmin = new Admin({
            username: username,
            password: password
        });

        Admin.create(newAdmin,function(err,admin){
            if(err)
            {
                res.redirect('/register');
            }
            else
            {
                res.redirect('/');
            }
        })
    });

router.get('/login',function(req,res){
	res.render('login');
});

router.get('/', require('connect-ensure-login').ensureLoggedIn('/club/login'), function(req,res){
	res.render('index');
})


module.exports = router;