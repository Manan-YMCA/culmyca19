var express = require('express');
let router = express.Router();
var request = require("request");
var rn = require('random-number');
var uniqid = require('uniqid');
var async = require("async");
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');
var Otp = require('../models/otps');
var Event = require('../models/events');
var Registraion = require('../models/registrations');
var Sponsor = require('../models/sponsors');
var User = require('../models/users')
var pdf = require('html-pdf');
var path = require('path');
var fs = require('fs');
//-----------------------------------------Generate OTP----------------------------------------------------------//

var generateRandom = rn.generator({
  min:  1000,
  max:  9999,
  integer: true
});



router.get('/',function(req,res){
	res.render('index');
});

router.get('/sendotp',function(req,res){
	res.render('sendotp');
});

router.post('/sendotp',function(req,res){

	var phone = req.body.phone;
	var otp = generateRandom();
	var options = { method: 'GET',
	  		//https://2factor.in/API/V1/{api_key}/SMS/{phone_number}/{otp}/{template_name}
	  	url: 'https://2factor.in/API/V1/9983a223-ae79-11e6-a40f-00163ef91450/SMS/'+phone+'/'+otp+'/culmyca18',
  		headers: { 'content-type': 'application/x-www-form-urlencoded' },
  		form: {} };

		request(options, function (error, response, body) {
  		if (error) throw new Error(error);
  		console.log(body);
  		var obj = JSON.parse(body);

  		// Check if Phone Already Exist Then Use Update Query rather then Creating New Entry In OTP.
  			Otp.find({phone: phone}).then(function(result){

  				if(result.length > 0)
  				{
					var myquery = { phone: phone };
					var newvalues = {$set: { session_id: obj.Details, otp: otp } };
  					Otp.updateOne(myquery, newvalues, function(err, res) {
      					if (err) throw err;
					});
					res.redirect('/verifyotp');
  				} 
  				else
  				{
			  			var newOtp = new Otp({
			            phone: phone,
			            session_id: obj.Details,
			            otp: otp,
			            status: 'false'
			        	});

			        	Otp.create(newOtp,function(err,otp){
			            if(err)
			            {
			                res.redirect('/sendotp');
			            }
			            else
			            {
			                res.redirect('/verifyotp');
			            }
			        });
  				}
		});

	});
});

//-----------------------------------------Verify OTP----------------------------------------------------------//


router.get('/verifyotp',function(req,res){
	res.render('verifyotp');
});

router.post('/verifyotp',function(req,res){

	var phone = req.body.phone;
	var otp = req.body.otp;
	Otp.find({phone: phone}).then(function(result){

			console.log(result);
			var session_id = result[0].session_id;
			console.log(session_id);
			var options = { method: 'GET',
				  //https://2factor.in/API/V1/{api_key}/SMS/VERIFY/{session_id}/{otp_input}
			  url: 'https://2factor.in/API/V1/9983a223-ae79-11e6-a40f-00163ef91450/SMS/VERIFY/'+session_id+'/'+otp,
			  headers: { 'content-type': 'application/x-www-form-urlencoded' },
			  form: {} };

			request(options, function (error, response, body) {
			  if (error) throw new Error(error);

			  console.log(body);
			  res.json(body);
			});
	});
});

//-----------------------------------------Show Event Club Wise----------------------------------------------------------//

router.get('/clubevent',function(req,res){
	res.render('clubevent');
});
//----------------------------------------Send event name and id by club------------------------------------------//
router.post('/clubevent',function(req,res){
	var club = req.body.club;
	Event.find({clubname: club},'title',function(err,result){
		res.json(result);
	});
});
//---------------------------------Find Event By ID----------------------------------------------------//
router.post('/eventbyid',(req,res)=>{
	//console.log(req.body.id);
	Event.findById(req.body.id,(error,result)=>{
		res.json(result);
	});
});

//---------------------------------SHOW EVENTS CATEGORY AND TITLE ONLY-----------------------------------//
router.get('/eventname',(req,res)=>{
	Event.find({},{'title':true, 'clubname':true},(error,result)=>{
		res.json(result);
	})
});

router.get('/allevent',function(req,res){
	res.render('allevent');
});

router.post('/allevent',function(req,res){
	Event.find({},function(err,result){
		res.json(result);
	});
});



//-----------------------------------------Event Registration----------------------------------------------------------//

router.get('/register',function(req,res){
	res.render('register');
});

router.post('/register',function(req,res){

    var name = req.body.name;
    var phone = req.body.phone;
    var email = req.body.email;
    var college = req.body.college;
    var eventid = req.body.eventid;
    var eventname = req.body.eventname;
    var team = req.body.team;
    var timestamp = req.body.timestamp;
    var str = uniqid.time();
    str = str + Math.random().toString(36).substring(2,10);
    var qrcode = str;
    Registraion.find({phone:phone, eventid: eventid} ).then(function(result){
    	if(result.length >0 )
    	{
			var obj = {
			    status: 'Already Registered'
			};
    		res.json(obj);
    	}
    	else
    	{
		    	var newRegistraion  = new Registraion({
		    	name: name,
		    	phone: phone,
		    	email: email,
		    	college: college,
		    	eventid: eventid,
		    	eventname: eventname,
				timestamp: timestamp,
				team : team,
				qrcode: qrcode,
				arrived: 'false',
				paymentstatus: 'false'    	
		      });
			  //console.log(newRegistraion);
			  Registraion.create(newRegistraion,function(err,registraion){
			    //console.log(registraion);
			    if(err)
			    {
			      var obj = {
				    status: 'Failed!!Error Occured'
					};
				res.send(obj);
				res.end();
			    }
			    else
			    {
			      var obj = {
				    status: 'Success'
					};
				res.send(obj);
				res.end();
			    }
			  });
    	}
    });
});

//-----------------------------------------Show Sponsors to Users----------------------------------------------------------//

router.get('/showsponsor', function(req,res){
    Sponsor.find({ },function(err,result){
      if(err) 
        console.log("Some Error Occur");
      else
        res.json(result);
    });
}); 

//-----------------------------------------Update Payment Status----------------------------------------------------------//

router.get('/updatepayment',function(req,res){
	res.render('updatepayment');
});

router.post('/updatepayment',function(req,res){

	var qrcode = req.body.qrcode;
	var myquery = { qrcode: qrcode };
	var newvalues = {$set: { paymentstatus: 'true' } };
	Registraion.updateOne(myquery, newvalues, function(err, res) {
		if (err) throw err;
	});	
	res.redirect('/');

});

//-----------------------------------------Update Arrival Status----------------------------------------------------------//

router.get('/updatearrival',function(req,res){
	res.render('updatearrival');
});

router.post('/updatearrival',function(req,res){

	var qrcode = req.body.qrcode;
	Registraion.find({qrcode: qrcode}).then(function(result){
		if(result[0].paymentstatus)
		{	
			var myquery = { qrcode: qrcode };
			var newvalues = {$set: { arrived: 'true' } };
			Registraion.updateOne(myquery, newvalues, function(err, res) {
				if (err) throw err;
			});	
			res.redirect('/');	
		}
		else
		{
			var obj = {
			    status: 'Payment Not Done Till Now'
			};
			res.json(obj);
		}
	});

});


//-----------------------------------------SendGrid Demo For Sending Mails----------------------------------------------------------//
router.get('/pdf/:qrcode',function(req,res){
	var qrcode = req.params.qrcode;
	var file = 'public/eticket_'+qrcode+'.pdf';
	var html  = '<strong>Hi Manmeet</strong><br><br>Thank you for your interest in SMSCP Siemens.<br>We regret to inform you that after careful consideration you were not able to get the minimum score which is 50 out of 100 in your SMSCP final exam.<br>Thank you again for your interest and we wish you the best in your future endeavors.<br><br> All the best!<br>Siemens</strong>';
	pdf.create(html).toFile(file,function(err, res1){
		  res.download(file);
		});
})
router.get('/sendmail/:qrcode',function(req,res){
	var qrimg  = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+req.params.qrcode+'" alt="" width="110" height="110" border="0" >';
	var url = '<a href="http://culmyca19.herokuapp.com/pdf/'+req.params.qrcode+'">Click here to download pdf</a>';
	var html  = '<strong>Hi Manmeet</strong><br>'+qrimg+'<br><br>'+url+'<br><br>Thank you for your interest in SMSCP Siemens.<br>We regret to inform you that after careful consideration you were not able to get the minimum score which is 50 out of 100 in your SMSCP final exam.<br>Thank you again for your interest and we wish you the best in your future endeavors.<br><br> All the best!<br>Siemens</strong>';
	const msg = {
	  to: ['princebatra2315@gmail.com'],
	  from: 'manmeetrana06@gmail.com',
	  subject: 'Result of SMSCP final exam',
	  text: 'Hello',
	  html : html,
	};

	sgMail.send(msg);
	res.send({'msg':'success'});
});

//----------------------------------------Increase Hit Count----------------------------------------------//

router.get('/updateTrending',function(req,res){
	Event.updateOne({_id : req.query.id},{$set : {hitCount : parseInt(req.query.hit) +1}},function(error,result){
		if(error)
		{
			console.log("Error Occur");
			res.json({success : false});
		}
		else
		{
			res.json({success : true});
		}
	})
})

//-----------------------------------------------Showing Trending---------------------------------------------//

function compare(a,b) {
  if (a.hitCount < b.hitCount)
    return 1;
  if (a.hitCount > b.hitCount)
    return -1;
  return 0;
}

router.get('/showTrending',function(req,res){

  	Event.find({ },function(err, result) {
    if (err) throw err;
    result.sort(compare);
    res.json(result);
  });	
});

//-----------------------------------------My Tickets----------------------------------------------------------//

router.get('/mytickets',function(req,res){
	res.render('mytickets');
});

router.post('/mytickets',function(req,res){
	var phone = req.body.phone;
	console.log(phone);
	Registraion.find({phone:phone}).then(function(result){
		console.log(result.length)
		res.json(result);
	});
});

//-----------------------------------------------User SignUp---------------------------------------------//

router.post('/users',function(req,res){


	var newUser  = new User({
		name: req.body.name,
		phone: req.body.phone,
		email: req.body.email,
		college: req.body.college
		});
	User.create(newUser,function(err,user){
		if(err) res.json({"status":"error"});
		else
		res.json({"status":"success","details": user});

	});
});

router.post('/login',function(req,res){
	User.find({phone: req.body.phone}).then(function(result){
		console.log(result);
		if(result.length==0)
			res.json({"status":"User Not Exist"});
		else
			res.json({"status":"User Exist"});
	});
});

//-----------------------------------------------Events By Tags---------------------------------------------//

router.post('/showbytag',function(req,res){

	var arr = [];
	var tag = req.body.tag;
  	Event.find({ }).then(function(result) {
  	var i = 0;
    async.each(result,function(item){
    		var ans = result[i].tags;  // Here I get a tag
    		var ele = ans.indexOf(tag,0);
    		if(ele!=-1)
     		arr.push(item);
                i++;
            },function(err){
              res.json(arr);
            });
            if(i == result.length)
               res.json(arr);
  });
            	
});

module.exports = router;