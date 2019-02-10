var express = require('express');
let router = express.Router();
var passport = require('passport');
const session = require('express-session');
var LocalStrategy = require('passport-local').Strategy;
var Admin = require('../models/admins');
var Sponsor =  require('../models/sponsors');
var Event =  require('../models/events');

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
/*--------------------------SHOW SPONSOR FOR ADMIN AND UPDATE BUTTON------------------------*/
router.get('/showsponsor',BrixxloggedIn,function(req,res){
    Sponsor.find({ },function(err,result){
      if(err) 
        console.log("Some Error Occur");
      else
        res.render('adminshowsponsor',{sponsor : result});
    });
});  

/*---------------FORM FOR GETTING ID OF SPONSOR AND RENDERING THE UPDATE FORM---------------*/

router.post('/updateFormSponsor',BrixxloggedIn,function(req,res){
  Sponsor.findOne({_id:req.body.id},function(error,result){
    if(error)
    {
      console.log("Error Occured");
    }
    else
    {
      res.render('updatesponsor',{sponsor : result});
    }
  })
})

/*----------------------UPDATE SPONSOR-----------------------------------------------------*/
router.post('/updateSponsor',BrixxloggedIn,function(req,res){
  var query = req.body.id;
  var name = req.body.name;
  var title = req.body.title;
  var rank = req.body.rank;
  var logo = req.body.logo;
  var website = req.body.website;
  var newValues = {$set : {
    name: name,
    title: title,
    rank: rank,
    logo: logo,
    website: website
  }};
  Sponsor.updateOne({_id : query},newValues,function(error,result){
    if(error)
    {
      console.log("Error Occured");
    }
    else
    {
      res.redirect('/club/showsponsor');
    }
  })
})

/*--------------------POST ROUTE FOR ADD SPONSOR--------------------------------------*/
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

/*------------------POST ROUTE FOR ADD EVENT-------------------------------------------*/

router.post('/addevent',require('connect-ensure-login').ensureLoggedIn('/club/login'),function(req,res){
  var clubname = req.user.username;
  var title = req.body.title;
  var category = req.body.category;
  var eventtype = req.body.eventtype;
  var coordinatorName = req.body.coordinatorName;
  var coordinatorPhone = req.body.coordinatorPhone;
  var prize1 = req.body.prize1;
  var prize2 = req.body.prize2;
  var prize3 = req.body.prize3;
  var description = req.body.description;
  var photolink = req.body.photolink;
  var venue = req.body.venue;
  var fee = req.body.fee;
  var date = req.body.date;
  var starttime = req.body.starttime;
  var endtime = req.body.endtime;
  var newEvent  = new Event({
    clubname : clubname,
    title : title,
    eventtype : eventtype,
    category : category,
    description : description,
    venue : venue,
    photolink : photolink,
    prizes : {
      prize1 : prize1,
      prize2 : prize2,
      prize3 : prize3,
    },
    coordinator : [{name : coordinatorName,phone : coordinatorPhone}],
    fees : fee,
    date : date,
    starttime : starttime,
    endtime : endtime,
  });
  //console.log(newEvent);
  Event.create(newEvent,function(err,event){
    //console.log(event);
    if(err)
    {
      res.redirect('/club/addevent');
    }
    else
    {
      res.redirect('/');
    }
  })
});


/*------------------FORM RENDERING FOR THE UPDATE EVENT------------------------------------*/
router.post('/updateFormEvent',require('connect-ensure-login').ensureLoggedIn('/club/login'),function(req,res){
  Event.findOne({_id : req.body.id},function(error,result){
      if(error)
      {
        console.log("Error Occured");
      }
      else
      {
        res.render('updateevent',{event : result});
      }
  })
})

/*--------------------------ROUTE FOR UPDATING THE EVENT---------------------------------*/
router.post('/updateevent',require('connect-ensure-login').ensureLoggedIn('/club/login'),function(req,res){
  var query = req.body.id;
  var clubname = req.user.username;
  var title = req.body.title;
  var category = req.body.category;
  var eventtype = req.body.eventtype;
  var coordinatorName = req.body.coordinatorName;
  var coordinatorPhone = req.body.coordinatorPhone;
  var prize1 = req.body.prize1;
  var prize2 = req.body.prize2;
  var prize3 = req.body.prize3;
  var description = req.body.description;
  var photolink = req.body.photolink;
  var venue = req.body.venue;
  var fee = req.body.fee;
  var date = req.body.date;
  var starttime = req.body.starttime;
  var endtime = req.body.endtime;
  var newValues = {$set : {
    title : title,
    eventtype : eventtype,
    category : category,
    description : description,
    venue : venue,
    photolink : photolink,
    prizes : {
      prize1 : prize1,
      prize2 : prize2,
      prize3 : prize3,
    },
    coordinator : [{name : coordinatorName,phone : coordinatorPhone}],
    fees : fee,
    date : date,
    starttime : starttime,
    endtime : endtime,
  }};
  Event.updateOne({_id:query},newValues,function(error,result){
    if(error)
    {
      console.log("Error Occcured");
    }
    else
    {
      console.log(result);
      res.redirect('/club/showevent');
    }
  })

})



/*route for showing list of events for the club */
router.get('/showevent',require('connect-ensure-login').ensureLoggedIn('/club/login'),function(req,res){
    Event.find({clubname:req.user.username},function(err,result){
      if(err)
      {
        console.log("Something very bad happens");
      }
      else
      {
        res.render('adminshowevent',{event : result});
      }
    })
});

/*-------------------------------RENDERING FORM FOR DELETING THE EVENT----------------------*/
router.get('/deleteEvent',require('connect-ensure-login').ensureLoggedIn('/club/login'),function(req,res){
  Event.find({clubname:req.user.username},function(err,result){
      if(err)
      {
        console.log("Something very bad happens");
      }
      else
      {
        res.render('deleteevent',{result:result});
      }
    })
});

/*--------------------------POST ROUTE FOR DELETE EVENT-------------------------------*/

router.post('/deleteevent',require('connect-ensure-login').ensureLoggedIn('/club/login'),function(req,res){
  Event.deleteOne({_id : req.body.id},function(err,result){
    //console.log(result);
    if(err)
    {
      console.log("Error Occured");
    }
    else
    {
      res.redirect('/');
    }
  })
});

/*--------------------------GET ROUTE FOR DELETE SPONSOR--------------------- */

router.get('/deletesponsor',BrixxloggedIn,function(req,res){
  Sponsor.find({},function(err,sponsor){
    if(err)
    {
      console.log("Error Occured");
    }
    else
    {
      res.render('deletesponsor',{sponsor : sponsor});
    }
  })
});

/*---------------------------POST ROUTE FOR DELETING SPONSOR----------------------*/
router.post('/deletesponsor',BrixxloggedIn,function(req,res){
  Sponsor.deleteOne({_id : req.body.id},function(err,result){
    if(err)
    {
      console.log("Error Occured");
    }
    else
    {
      res.redirect('/');
    }
  })
});


module.exports = router;