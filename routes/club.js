var express = require('express');
let router = express.Router();
var passport = require('passport');
const session = require('express-session');
var LocalStrategy = require('passport-local').Strategy;
var Admin = require('../models/admins');
var Sponsor =  require('../models/sponsors');

function BrixxloggedIn(req, res, next) {
  console.log(req.user.username);
    if (req.user.username == 'brixx') {
        next();
    } else {
        res.redirect('/');
    }
}

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

 router.get('/',require('connect-ensure-login').ensureLoggedIn('/club/login'), function(req,res){
  res.render('index');
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

router.get('/showsponsor',function(req,res){
    Sponsor.find({ },function(err,result){
      if(err) 
        console.log("Some Error Occur");
      else
        res.json(result);
    });
});  

router.post('/addsponsor', BrixxloggedIn, function(req, res, next) {
        var name = req.body.name;
        var title = req.body.title;
        var rank = req.body.rank;
        var logo = req.body.logo;
        var website = req.body.website;
        // console.log(name);
        var newSponsor = new Sponsor({
            name: name,
            title: title,
            rank: rank,
            logo: logo,
            website: website
        });
        // console.log(newSponsor);
        Sponsor.create(newSponsor,function(err,sponsor){
          console.log(sponsor);
            if(err)
            {
                res.redirect('/club/addsponsor');
            }
            else
            {
                res.redirect('/');
            }
        })
});

router.get('/addsponsor', BrixxloggedIn, function(req, res, next) {
    // Brixx Logged In
    res.render('addsponsor')
});

router.get('/addevent', require('connect-ensure-login').ensureLoggedIn('/club/login'), function(req,res){
	res.render('addevent');
})

module.exports = router;