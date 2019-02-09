var express = require('express');
let router = express.Router();
var request = require("request");
var rn = require('random-number');
var Otp = require('../models/otps');

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
module.exports = router;