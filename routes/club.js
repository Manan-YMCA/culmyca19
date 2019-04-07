var express = require('express');
let router = express.Router();
var Admin = require('../models/admins');
var Sponsor =  require('../models/sponsors');
var Event =  require('../models/events');
var Registration = require('../models/registrations');
var jwt = require('jsonwebtoken'); 
var config = require('../config'); 

function BrixxloggedIn(req, res, next) {
  Admin.findById(req.userId, function (err, user) {
    if (err) return res.status(500).send('Error on the server.');
    if (!user) return res.status(404).send('No user found.');
    if(user.username==='brixx')
     next();
    else
      return res.status(500).send({ auth: false, message: 'Failed to authenticate token for brixx.' });
  });
}

function verifyToken(req, res, next) {
  var token = req.headers['auth'];
  console.log('auth : '+ token);
  if (!token) 
    return res.status(403).send({ auth: false, message: 'No token provided.' });
  jwt.verify(token, config.secret, function(err, decoded) {      
    if (err) 
      return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });    
    req.userId = decoded.id;
    next();
  });

}

router.post('/login', function(req, res) {

  Admin.findOne({ username: req.body.username }, function (err, user) {
    if (err) return res.status(500).send({ 'msg': 'Eror on Server', 'token': null,'username' :null});
    if (!user) return res.status(200).send({ 'msg': 'Wrong username and password pair!', 'token': null,'username' :null});
    var passwordIsValid = (req.body.password===user.password);
    if (!passwordIsValid) return res.status(200).send({ 'msg': 'Wrong username and password pair!', 'token': null,'username' :null});
    var token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: 86400 
    });
    res.status(200).send({ 'msg': 'success', 'token': token,'username' : user.username});
  });

});


router.get('/logout', function(req, res) {
  res.status(200).send({ auth: false, token: null });
});

router.post('/register',verifyToken,BrixxloggedIn, function(req, res) {

  Admin.create({
    username : req.body.username,
    password : req.body.password,
  }, 
  function (err, user) {
    if (err) return res.status(500).send("There was a problem registering the user.");

    var token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: 86400 
    });

    res.status(200).send({ auth: true, token: token });
  });

});

/*--------------------------SHOW SPONSOR FOR ADMIN AND UPDATE BUTTON------------------------*/
router.get('/showsponsor',verifyToken,BrixxloggedIn,function(req,res){
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

router.get('/addevent', verifyToken, function(req,res){
  res.render('addevent');
})

/*------------------POST ROUTE FOR ADD EVENT-------------------------------------------*/

router.post('/events/add',function(req,res){
    var token = req.body.token;
    var userId;
    if (!token) 
      res.status(403).send({'msg': 'No token provided.' });
    jwt.verify(token, config.secret, function(err, decoded) {      
      if (err) 
        res.status(500).send({'msg': 'Failed to authenticate token.' });    
      userId = decoded.id;
    });
    Admin.findById(userId,(error,admin)=>{
      if(error)
        res.send({'msg':'Server Error'});
      else
      {
        if(admin.username==req.body.clubname)
        {
          var newEvent  = new Event({
            clubname : req.body.clubname,
            hitCount : 0,
            title : req.body.title,
            eventtype : req.body.eventtype,
            category : req.body.category,
            desc : req.body.desc,
            rules : req.body.rules,
            fee : req.body.fee,
            venue : req.body.venue,
            photolink : req.body.photolink,
            prizes : {
              prize1 : req.body.prize1,
              prize2 : req.body.prize2,
              prize3 : req.body.prize3,
            },
            coordinators : [{name : req.body.coord1name,phone : req.body.coord1phone},{name : req.body.coord2name,phone : req.body.coord2phone}],
            timing : {
              from : req.body.from,
              to : req.body.to,
            },
            tags : req.body.tags,
          });
          Event.create(newEvent,function(err,event){
            if(err)
            {
              res.send({'msg':'Error in Creating Event Please enter valid date and time'});
            }
            else
            {
              res.json({'msg':'Event Created'});
            }
          })
        }
        else
        {
          res.send({'msg':'You are not allowed to create another club event'});
        }
      }
    });
});

/*--------------------------ROUTE FOR UPDATING THE EVENT---------------------------------*/
router.post('/events/update',function(req,res){
  var token = req.body.token;
    var userId;
    if (!token) 
      res.send({'msg': 'No token provided.' });
    jwt.verify(token, config.secret, function(err, decoded) {      
      if (err) 
        res.send({'msg': 'Failed to authenticate token.' });    
      userId = decoded.id;
    });
    Admin.findById(userId,(error,admin)=>{
      if(error)
        res.send({'msg':'Server Error'});
      else
      {
        if(admin.username==req.body.clubname)
        {
          console.log(req.body);
          var newEvent  = {
            clubname : req.body.clubname,
            hitCount : 0,
            title : req.body.title,
            eventtype : req.body.eventtype,
            category : req.body.category,
            desc : req.body.desc,
            rules : req.body.rules,
            fee : req.body.fee,
            venue : req.body.venue,
            prizes : {
              prize1 : req.body.prize1,
              prize2 : req.body.prize2,
              prize3 : req.body.prize3,
            },
            coordinators : [{name : req.body.coord1name,phone : req.body.coord1phone},{name : req.body.coord2name,phone : req.body.coord2phone}],
            timing : {
              from : req.body.from,
              to : req.body.to,
            },
            tags : req.body.tags,
          };
          var query = {'title': req.body.title,'clubname':req.body.clubname};
          console.log(newEvent);
          Event.update(query,newEvent,function(error,result){
            if(error)
            {
              console.log("error in update"+error);
              res.send({'msg':'Error in Updating Event Please enter valid date and time'});
            }
            else
            {
              console.log("updated" +result);
              res.json({'msg':'Event Updated Successfully'});
            }
          })
        }
        else
        {
          console.log('You are not allowed to update another club event');
          res.send({'msg':'You are not allowed to update another club event'});
        }
      }
    });
});


/*route for showing list of events for the club */
router.get('/events/:eventname/:clubname',function(req,res){
    var condtn;
    eventname = req.params.eventname;
    clubname = req.params.clubname;
    if(eventname=="*" && clubname=="*")
      condtn = {};
    else if(eventname=="*")
      condtn = {clubname : clubname};
    else
      condtn = {clubname:clubname,title:eventname};
    Event.find(condtn,function(err,result){
      if(err)
      {
        var response = {'success': 0,'msg' : 'error Occured','data':[]};
        res.send(JSON.stringify(response));
      }
      else
      {
        var response = {'success': 0,'msg' : 'success','data':result};
        res.send(JSON.stringify(response));
      }
    })
});

/*-------------------------------RENDERING FORM FOR DELETING THE EVENT----------------------*/
router.get('/deleteEvent',verifyToken,function(req,res){
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

router.post('/deleteevent',verifyToken,function(req,res){
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

/*-----------------------------------GET ROUTE FOR GETTING REGISTRATION BY EVENTNAME-----------------------------------*/

router.get('/:clubname/:eventid',function(req,res){
  var clubname = req.params.clubname;
  var eventid = req.params.eventid;
  Registration.find({eventid: eventid}).then(function(result){
    res.json(result);
  });
});

module.exports = router;