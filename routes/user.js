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
var path = require('path')

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
	})
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
	Event.find({},{'title':true, 'category':true},(error,result)=>{
		res.json(result);
	})
});

router.get('/events',(req,res)=>{
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
	console.log(req.body);
    var name = req.body.name;
    var phone = req.body.phone;
    var email = req.body.email;
    var college = req.body.college;
    var eventid = req.body.eventid;
    var eventname = req.body.eventname;
    var team = JSON.parse(req.body.team);
    var timestamp = req.body.timestamp;
    var str = uniqid.time();
    console.log(team);
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
			  console.log(newRegistraion);
			  Registraion.create(newRegistraion,function(err,registration){
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
				    status: 'Success',
				    qrcode: qrcode
					};
				EmailonRegistration(registration.name,registration.qrcode,registration.eventname,registration.eventid,registration.email);
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

router.post('/sendmail',function(req,res){

	const msg = {
	  to: 'manmeetrana06@gmail.com',
	  from: 'onelms.sitrain.industry@siemens.com',
	  subject: 'Result of SMSCP final exam',
	  text: 'Hello',
	  html: '<strong>Hi Manmeet</strong><br><br>Thank you for your interest in SMSCP Siemens.<br>We regret to inform you that after careful consideration you were not able to get the minimum score which is 50 out of 100 in your SMSCP final exam.<br>Thank you again for your interest and we wish you the best in your future endeavors.<br><br> All the best!<br>Siemens</strong>',
	};

	sgMail.send(msg);
	res.redirect('/');
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
        console.log("hello");
	var phone = req.body.phone;
	console.log(phone);
	User.find({phone: phone}).then(function(result)
	{
	    console.log(result);
	    console.log(result.length);
    	if(result.length > 0)
			res.json({"status":"error","details":result[0]});
		else
		{
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
		}	
	});
	
});

router.post('/login',function(req,res){
	User.find({phone: req.body.phone}).then(function(result){
		console.log(result);
		if(result.length==0)
			res.json({"status":"User Not Exist"});
		else
			res.json({"status":"User Exist",
				"data" : result[0]});
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

router.get('/pdf/:qrcode',(req,res)=>{
	var pdf=require("html-pdf");
        ai="";
        eventinfo="";
        console.log('generating pdf for '+req.params.qrcode)
        Registraion.findOne({qrcode: req.params.qrcode},function(err, attendeeInfo){
            console.log(attendeeInfo);
            ai=attendeeInfo;
        }).then(function(){
            Event.findOne({title: ai.eventname},function(err, tst){
                if(!err){
                    console.log(tst);
                    eventinfo=tst;
                }else{
                    console.log(err);
                }
            }).then(function(){
                var date=dateHelper(eventinfo.timing.from);
                var html = '<html>'+
                    '<head>'+
                    '  <title>Confirmation</title>'+
                    '</head>'+
                    '<body>'+
                    '  <div marginwidth="0" marginheight="0" style="font-family:Arial,sans-serif;padding:20px 0 0 0">'+
                    '    <table cellpadding="0" cellspacing="0" width="100%" border="0" align="center" style="padding:25px 0 15px 0">'+
                    '      <tbody><tr>'+
                    '        <td width="100%" valign="top">'+
                    '          <table cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="f2f2f2" style="min-width:600px;margin:0 auto">'+
                    '            <tbody>'+
                    '              <tr>'+
                    '                <td valign="top">'+
                    '                  <table cellpadding="0" cellspacing="0" width="600" border="0" align="center">'+
                    '                    <tbody><tr>'+
                    '                      <td valign="top" width="300" style="background-color:#1f2533;padding-top:10px">'+
                    '                        <a href="http://www.elementsculmyca.com" style="text-decoration:none;color:#1f2533;font-weight:bold" target="_blank" >'+
                    '                          <img src="http://www.elementsculmyca.com/images/logo.png" style="display:block;background-color:#1f2533;color:#010101;padding:10px;padding-left:30px" alt="" border="0" height="100" >'+
                    '                        </a>'+
                    '                      </td>'+
                    '                      <td valign="top" width="300" style="background-color:#1f2533;color:#ffffff;font-size:14px;font-family:Arial,sans-serif;text-align:right;padding:20px 20px 0px 0px;word-spacing:1px"><span style="font-size:20px;font-weight:bold;">ELEMENTS CULMYCA\'19<br/><small>Annual cultural and technical fest</small></span><br><br>YMCA University of Science and Technology<br/>Faridabad, Haryana, India- 121006</td>'+
                    '                    </tr>'+
                    '                  </tbody></table>'+
                    '                </td>'+
                    '              </tr>'+
                    '              <tr>'+
                    '                <td valign="top">'+
                    '                  <table cellpadding="0" cellspacing="0" width="600" border="0" align="center">'+
                    '                    <tbody><tr><center>'+
                    '                      <td valign="top" width="500" style="background-color:#ffffff;color:#666666;font-size:18px;font-family:Arial,sans-serif;text-align:center;padding-top: 10px;padding-bottom: 10px;line-height:20px"> <b>E-TICKET</b></td></center>'+
                    '                    </tr>'+
                    '                  </tbody></table>'+
                    '                </td>'+
                    '              </tr>'+
                    '              <tr>'+
                    '                <td valign="top" width="540" style="padding-top:20px">'+
                    '                </td>'+
                    '              </tr>'+
                    '              <tr>'+
                    '                <td valign="top" style="width:540px;background-color:#f2f2f2;color:#666666;font-size:12px;font-family:Arial,sans-serif;text-align:left;padding:0px 30px 20px 30px;line-height:20px">'+
                    '                  <span style="font-weight:bold;font-size:20px">Hello '+ai.name+'</span>'+
                    '                  <br>You have successfully registered for the event.</td>'+
                    '                </tr>'+
                    '                <tr>'+
                    '                  <td valign="top">'+
                    '                    <table cellpadding="0" cellspacing="0" width="540" border="0" align="center" bgcolor="#1f2533">'+
                    '                      <tbody><tr>'+
                    '                        <td width="15">'+
                    '                        </td><td width="370" valign="top" style="color:#ffffff;font-size:15px;font-family:Arial,sans-serif;text-align:left;padding:25px 10px 25px 15px;line-height:24px;border-right:1px dotted #ffffff">'+
                    '                        '+
                    '                        '+
                    '                        <span style="color:#ffffff">You must carry the soft copy of this ticket with you at the event-site. Print-out for the same is not required.</span>'+
                    '                        <br>'+
                    '                        '+
                    '                      </td>'+
                    '                      <td width="140" valign="top" style="color:#ffffff;font-size:15px;font-family:Arial,sans-serif;text-align:center;padding:25px 10px 15px 10px;line-height:20px">'+
                    '                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data='+ai.qrcode+'" alt="" width="110" height="110" border="0" >'+
                    '                      </td>'+
                    '                      <td width="15">'+
                    '                      </td></tr>'+
                    '                    </tbody></table>'+
                    '                  </td>'+
                    '                </tr>'+
                    '                <tr>'+
                    '                  <td valign="top">'+
                    '                    <table cellpadding="0" cellspacing="0" width="538" border="0" align="center" bgcolor="#ffffff" style="border:1px solid #e1e5e8">'+
                    '                      <tbody><tr>'+
                    '                        <td width="538" valign="top">'+
                    '                          <table cellpadding="0" cellspacing="0" width="538" border="0" align="center" bgcolor="#ffffff" style="padding:0 30px">'+
                    '                            <tbody>'+
                    '                              <tr>'+
                    '                                <td valign="top" style="width:478px;background-color:#ffffff;color:#666666;font-size:12px;font-family:Arial,sans-serif;text-align:left;padding:10px 10px 10px 0;border-bottom:1px solid #e1e5e8">'+
                    '                                  <!--<span style="font-size:12px">ORDER SUMMARY </span>-->'+
                    '                                </td>'+
                    '                              </tr>'+
                    '                            </tbody>'+
                    '                          </table>'+
                    '                        </td>'+
                    '                      </tr>'+
                    '                      <tr>'+
                    '                        <td width="538" valign="top">'+
                    '                          <table cellpadding="0" cellspacing="0" width="538" border="0" align="center">'+
                    '                            <tbody>'+
                    '                              <tr>'+
                    '                                <td style="width:30px">'+
                    '                                </td><td valign="top" style="width:265px;background-color:#ffffff;color:#666666;font-size:15px;font-family:Arial,sans-serif;text-align:left;padding:10px 10px 10px 0;border-bottom:2px dotted #bfbfbf">'+
                    '                                <span style="font-size:14px;font-weight:bold">EVENT</span>'+
                    '                              </td>'+
                    '                              <td valign="top" width="213" style="background-color:#ffffff;color:#666666;font-size:12px;font-family:Arial,sans-serif;text-align:right;padding:10px 0 10px 10px;border-bottom:2px dotted #bfbfbf">'+eventinfo.title+'</td>'+
                    '                              <td style="width:30px">'+
                    '                              </td></tr>'+
                    '                            </tbody>'+
                    '                          </table>'+
                    '                        </td>'+
                    '                      </tr>'+
                    '                      <tr>'+
                    '                        <td valign="top" width="538">'+
                    '                          <table cellpadding="0" cellspacing="0" width="538" border="0" align="center">'+
                    '                            <tbody>'+
                    '                              <tr>'+
                    '                                <td style="width:30px">'+
                    '                                </td><td valign="top" style="width:265px;background-color:#ffffff;color:#1f2533;font-size:13px;font-family:Arial,sans-serif;text-align:left;padding:10px 0 10px 0">'+
                    '                                <strong>Date</strong>'+
                    '                              </td>'+
                    '                              <td valign="top" width="213" style="background-color:#ffffff;color:#1f2533;font-size:12px;font-family:Arial,sans-serif;text-align:right">'+
                    '                                <br>'+
                    '                                <strong>'+date+'</strong>'+
                    '                              </td>'+
                    '                              <td style="width:30px">'+
                    '                              </td></tr>'+
                    '                            </tbody>'+
                    '                          </table>'+
                    '                        </td>'+
                    '                      </tr>'+
                    '                      <tr>'+
                    '                        <td valign="top" width="538">'+
                    '                          <table cellpadding="0" cellspacing="0" width="538" border="0" align="center">'+
                    '                            <tbody>'+
                    '                              <tr>'+
                    '                                <td style="width:30px">'+
                    '                                </td><td valign="top" style="width:265px;padding:10px 0 10px 0;background-color:#ffffff;color:#1f2533;font-size:13px;font-family:Arial,sans-serif;text-align:left">'+
                    '                                <strong>Venue</strong>'+
                    '                              </td>'+
                    '                              <td valign="top" width="213" style="background-color:#ffffff;color:#1f2533;font-size:12px;font-family:Arial,sans-serif;text-align:right;vertical-align:top">'+
                    '                                <br>'+
                    '                                <strong>'+eventinfo.venue+'</strong>'+
                    '                              </td>'+
                    '                              <td style="width:30px">'+
                    '                              </td></tr>'+
                    '                              <td style="width:30px">'+
                    '                              </td><td valign="top" style="width:265px;background-color:#ffffff;color:#666666;font-size:9px;font-family:Arial,sans-serif;text-align:left;line-height:20px"></td>'+
                    '                              <td valign="top" width="213" style="background-color:#ffffff;color:#666666;font-size:9px;font-family:Arial,sans-serif;text-align:right;vertical-align:top"></td>'+
                    '                              <td style="width:30px">'+
                    '                              </td></tr>'+
                    '                              <tr>'+
                    '                                <td style="width:30px">'+
                    '                                </td><td valign="top" style="width:265px;background-color:#ffffff;color:#666666;font-size:9px;font-family:Arial,sans-serif;text-align:left;line-height:20px"></td>'+
                    '                                <td valign="top" width="213" style="background-color:#ffffff;color:#666666;font-size:9px;font-family:Arial,sans-serif;text-align:right;vertical-align:top"></td>'+
                    '                                <td style="width:30px">'+
                    '                                </td></tr>'+
                    '                                <tr>'+
                    '                                  <td style="width:30px">'+
                    '                                  </td><td valign="top" style="width:265px;background-color:#ffffff;color:#666666;font-size:9px;font-family:Arial,sans-serif;text-align:left;line-height:20px"></td>'+
                    '                                  <td valign="top" width="213" style="background-color:#ffffff;color:#666666;font-size:9px;font-family:Arial,sans-serif;text-align:right;vertical-align:top"></td>'+
                    '                                  <td style="width:30px">'+
                    '                                  </td></tr>'+
                    '                                </tbody>'+
                    '                              </table>'+
                    '                            </td>'+
                    '                          </tr>'+
                    '                        </tbody></table>'+
                    '                      </td>'+
                    '                    </tr>'+
                    '                    <tr><br></tr>'+
                    '                    <td valign="top" width="540" style="background-color:#ffffff">'+
                    '                      <table cellpadding="0" cellspacing="0" width="540" border="0" align="center">'+
                    '                        <tbody><tr>'+
                    '                          <td valign="top" width="540" style="color:#666666;font-size:12px;font-family:Arial,sans-serif;text-align:justify;padding:30px 0 40px;line-height:20px">'+
                    '                            <span style="font-size:12px">'+
                    '                              <b> Download Culmyca\'19 android application to view and manage all your registrations at one place.</b>'+
                    '                            </span>'+
                    '                            <table>'+
                    '                              <tr><td><img src="http://blog.timeneye.com/wp-content/uploads/2014/11/Android-app-store.png" height="70" width="250"></td>'+
                    '                                <!--<td><img src="http://blog.timeneye.com/wp-content/uploads/2014/11/Android-app-store.png" height="70" width="250"></td>--></tr>'+
                    '                              </table>'+
                    '                            </tr>'+
                    '                          </tbody></table>'+
                    '                        </td>'+
                    '                      </tr>'+
                    ''+
                    '                      <tr>'+
                    '                        <td valign="top">'+
                    '                          <table cellpadding="0" cellspacing="0" width="600" border="0" align="center" bgcolor="1F2533">'+
                    '                            <tbody><tr>'+
                    '                              <td valign="top" width="260" style="background-color:#1f2533;color:#49ba8e;font-size:12px;font-family:Arial,sans-serif;text-align:left;padding:20px 10px 15px 20px">For any further query<br><a href="mailto:culmycaelements@gmail.com" style="text-decoration:none;color:#49ba8e;font-weight:bold" target="_blank">culmycaelements@gmail.com</a><br/><a href="http://www.elementsculmyca.com" style="text-decoration:none;color:#49ba8e;font-weight:bold" target="_blank">www.elementsculmyca.com</a></td>'+
                    '                              <td style="width:200px;vertical-align:top;background-color:#1f2533;text-align:right;padding:25px 0 15px 0">'+
                    '                                <img src="https://ci3.googleusercontent.com/proxy/SyVYUNSQvbO4Vpaz4vI18sLBe2mw869TmO_vsG2pCeAKavB7aEfM4-d-6da_55SKmc90xda9joSORt4Lnq5JrfJ1u0uoUOkq0yze=s0-d-e1-ft#http://in.bmscdn.com/webin/emailer/helpline-phone.png" alt="helpline phone" width="18" height="20" border="0" >'+
                    '                              </td>'+
                    '                              <td style="width:105px;vertical-align:top;padding:25px 0 15px 10px;text-align:left;background-color:#1f2533;color:#49ba8e;line-height:14px;font-size:12px;font-weight:bold">'+
                    '                                <a href="tel:+91 82228 31183" style="text-decoration:none;color:#49ba8e" target="_blank">Ph: 8222831183</a>'+
                    '                                '+
                    '                              </td>'+
                    '                            </tr>'+
                    '                          </tbody></table>'+
                    '                        </td>'+
                    '                      </tr>'+
                    '                    </tbody>'+
                    '                  </table>'+
                    '                </td>'+
                    '              </tr>'+
                    '            </tbody></table>'+
                    '          </body>'+
                    '          </html>';

                pdf.create(html).toFile('public/eticket.pdf', function(err, res1) {
                    if (err) return console.log(err);
                    var fs = require('fs');
                    var file = fs.createReadStream(path.resolve('public/eticket.pdf'));
                    var stat = fs.statSync(path.resolve('public/eticket.pdf'));
                    res.setHeader('Content-Length', stat.size);
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', 'attachment; filename=eticket_'+ai.qrcode+'.pdf');
                    file.pipe(res);
                });
            })
        })
});

module.exports = router;

const EmailonRegistration = async (name,qrcode,eventName,eventid,email)=>{
	console.log("in email registration form")
	const event = await Event.findById(eventid)
	console.log(event)
	const venue = event.venue
	const date = dateHelper(event.timing.from)
	console.log(date)
	const msg = {
	  to: email,
	  from: `Elements Culmyca'19<manmeetrana06@gmail.com>`,
	  subject:"Congratulations! You have been registered",
	  html : '<html>'+
        '<head>'+
        '  <title>Confirmation</title>'+
        '</head>'+
        '<body>'+
        '  <div marginwidth="0" marginheight="0" style="font-family:Arial,sans-serif;padding:20px 0 0 0">'+
        '    <table cellpadding="0" cellspacing="0" width="100%" border="0" align="center" style="padding:25px 0 15px 0">'+
        '      <tbody><tr>'+
        '        <td width="100%" valign="top">'+
        '          <table cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="f2f2f2" style="min-width:600px;margin:0 auto">'+
        '            <tbody>'+
        '              <tr>'+
        '                <td valign="top">'+
        '                  <table cellpadding="0" cellspacing="0" width="600" border="0" align="center">'+
        '                    <tbody><tr>'+
        '                      <td valign="top" width="300" style="background-color:#1f2533;padding-top:10px">'+
        '                        <a href="http://www.elementsculmyca.com" style="text-decoration:none;color:#1f2533;font-weight:bold" target="_blank" >'+
        '                          <img src="http://www.elementsculmyca.com/images/logo.png" style="display:block;background-color:#1f2533;color:#010101;padding:10px;padding-left:30px" alt="" border="0" height="100" >'+
        '                        </a>'+
        '                      </td>'+
        '                      <td valign="top" width="300" style="background-color:#1f2533;color:#ffffff;font-size:14px;font-family:Arial,sans-serif;text-align:right;padding:20px 20px 0px 0px;word-spacing:1px"><span style="font-size:20px;font-weight:bold;">ELEMENTS CULMYCA\'19<br/><small>Annual cultural and technical fest</small></span><br><br>YMCA University of Science and Technology<br/>Faridabad, Haryana, India- 121006</td>'+
        '                    </tr>'+
        '                  </tbody></table>'+
        '                </td>'+
        '              </tr>'+
        '              <tr>'+
        '                <td valign="top">'+
        '                  <table cellpadding="0" cellspacing="0" width="600" border="0" align="center">'+
        '                    <tbody><tr><center>'+
        '                      <td valign="top" width="500" style="background-color:#ffffff;color:#666666;font-size:18px;font-family:Arial,sans-serif;text-align:center;padding-top: 10px;padding-bottom: 10px;line-height:20px"> <b>E-TICKET</b></td></center>'+
        '                    </tr>'+
        '                  </tbody></table>'+
        '                </td>'+
        '              </tr>'+
        '              <tr>'+
        '                <td valign="top" width="540" style="padding-top:20px">'+
        '                </td>'+
        '              </tr>'+
        '              <tr>'+
        '                <td valign="top" style="width:540px;background-color:#f2f2f2;color:#666666;font-size:12px;font-family:Arial,sans-serif;text-align:left;padding:0px 30px 20px 30px;line-height:20px">'+
        '                  <span style="font-weight:bold;font-size:20px">Hello '+name+'</span>'+
        '                  <br>You have successfully registered for the event.<br/><br/>Download PDF of your ticket, <a href="http://culmyca19.herokuapp.com/pdf/'+qrcode+'">Click here</a></td>'+
        '                </tr>'+
        '                <tr>'+
        '                  <td valign="top">'+
        '                    <table cellpadding="0" cellspacing="0" width="540" border="0" align="center" bgcolor="#1f2533">'+
        '                      <tbody><tr>'+
        '                        <td width="15">'+
        '                        </td><td width="370" valign="top" style="color:#ffffff;font-size:15px;font-family:Arial,sans-serif;text-align:left;padding:25px 10px 25px 15px;line-height:24px;border-right:1px dotted #ffffff">'+
        '                        '+
        '                        '+
        '                        <span style="color:#ffffff">You must carry the soft copy of this ticket with you at the event-site. Print-out for the same is not required.</span>'+
        '                        <br>'+
        '                        '+
        '                      </td>'+
        '                      <td width="140" valign="top" style="color:#ffffff;font-size:15px;font-family:Arial,sans-serif;text-align:center;padding:25px 10px 15px 10px;line-height:20px">'+
        '                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data='+qrcode+'" alt="" width="110" height="110" border="0" >'+
        '                      </td>'+
        '                      <td width="15">'+
        '                      </td></tr>'+
        '                    </tbody></table>'+
        '                  </td>'+
        '                </tr>'+
        '                <tr>'+
        '                  <td valign="top">'+
        '                    <table cellpadding="0" cellspacing="0" width="538" border="0" align="center" bgcolor="#ffffff" style="border:1px solid #e1e5e8">'+
        '                      <tbody><tr>'+
        '                        <td width="538" valign="top">'+
        '                          <table cellpadding="0" cellspacing="0" width="538" border="0" align="center" bgcolor="#ffffff" style="padding:0 30px">'+
        '                            <tbody>'+
        '                              <tr>'+
        '                                <td valign="top" style="width:478px;background-color:#ffffff;color:#666666;font-size:12px;font-family:Arial,sans-serif;text-align:left;padding:10px 10px 10px 0;border-bottom:1px solid #e1e5e8">'+
        '                                  <!--<span style="font-size:12px">ORDER SUMMARY </span>-->'+
        '                                </td>'+
        '                              </tr>'+
        '                            </tbody>'+
        '                          </table>'+
        '                        </td>'+
        '                      </tr>'+
        '                      <tr>'+
        '                        <td width="538" valign="top">'+
        '                          <table cellpadding="0" cellspacing="0" width="538" border="0" align="center">'+
        '                            <tbody>'+
        '                              <tr>'+
        '                                <td style="width:30px">'+
        '                                </td><td valign="top" style="width:265px;background-color:#ffffff;color:#666666;font-size:15px;font-family:Arial,sans-serif;text-align:left;padding:10px 10px 10px 0;border-bottom:2px dotted #bfbfbf">'+
        '                                <span style="font-size:14px;font-weight:bold">EVENT</span>'+
        '                              </td>'+
        '                              <td valign="top" width="213" style="background-color:#ffffff;color:#666666;font-size:12px;font-family:Arial,sans-serif;text-align:right;padding:10px 0 10px 10px;border-bottom:2px dotted #bfbfbf">'+eventName+'</td>'+
        '                              <td style="width:30px">'+
        '                              </td></tr>'+
        '                            </tbody>'+
        '                          </table>'+
        '                        </td>'+
        '                      </tr>'+
        '                      <tr>'+
        '                        <td valign="top" width="538">'+
        '                          <table cellpadding="0" cellspacing="0" width="538" border="0" align="center">'+
        '                            <tbody>'+
        '                              <tr>'+
        '                                <td style="width:30px">'+
        '                                </td><td valign="top" style="width:265px;background-color:#ffffff;color:#1f2533;font-size:13px;font-family:Arial,sans-serif;text-align:left;padding:10px 0 10px 0">'+
        '                                <strong>Date</strong>'+
        '                              </td>'+
        '                              <td valign="top" width="213" style="background-color:#ffffff;color:#1f2533;font-size:12px;font-family:Arial,sans-serif;text-align:right">'+
        '                                <br>'+
        '                                <strong>'+date+'</strong>'+
        '                              </td>'+
        '                              <td style="width:30px">'+
        '                              </td></tr>'+
        '                            </tbody>'+
        '                          </table>'+
        '                        </td>'+
        '                      </tr>'+
        '                      <tr>'+
        '                        <td valign="top" width="538">'+
        '                          <table cellpadding="0" cellspacing="0" width="538" border="0" align="center">'+
        '                            <tbody>'+
        '                              <tr>'+
        '                                <td style="width:30px">'+
        '                                </td><td valign="top" style="width:265px;padding:10px 0 10px 0;background-color:#ffffff;color:#1f2533;font-size:13px;font-family:Arial,sans-serif;text-align:left">'+
        '                                <strong>Venue</strong>'+
        '                              </td>'+
        '                              <td valign="top" width="213" style="background-color:#ffffff;color:#1f2533;font-size:12px;font-family:Arial,sans-serif;text-align:right;vertical-align:top">'+
        '                                <br>'+
        '                                <strong>'+venue+'</strong>'+
        '                              </td>'+
        '                              <td style="width:30px">'+
        '                              </td></tr>'+
        '                              <td style="width:30px">'+
        '                              </td><td valign="top" style="width:265px;background-color:#ffffff;color:#666666;font-size:9px;font-family:Arial,sans-serif;text-align:left;line-height:20px"></td>'+
        '                              <td valign="top" width="213" style="background-color:#ffffff;color:#666666;font-size:9px;font-family:Arial,sans-serif;text-align:right;vertical-align:top"></td>'+
        '                              <td style="width:30px">'+
        '                              </td></tr>'+
        '                              <tr>'+
        '                                <td style="width:30px">'+
        '                                </td><td valign="top" style="width:265px;background-color:#ffffff;color:#666666;font-size:9px;font-family:Arial,sans-serif;text-align:left;line-height:20px"></td>'+
        '                                <td valign="top" width="213" style="background-color:#ffffff;color:#666666;font-size:9px;font-family:Arial,sans-serif;text-align:right;vertical-align:top"></td>'+
        '                                <td style="width:30px">'+
        '                                </td></tr>'+
        '                                <tr>'+
        '                                  <td style="width:30px">'+
        '                                  </td><td valign="top" style="width:265px;background-color:#ffffff;color:#666666;font-size:9px;font-family:Arial,sans-serif;text-align:left;line-height:20px"></td>'+
        '                                  <td valign="top" width="213" style="background-color:#ffffff;color:#666666;font-size:9px;font-family:Arial,sans-serif;text-align:right;vertical-align:top"></td>'+
        '                                  <td style="width:30px">'+
        '                                  </td></tr>'+
        '                                </tbody>'+
        '                              </table>'+
        '                            </td>'+
        '                          </tr>'+
        '                        </tbody></table>'+
        '                      </td>'+
        '                    </tr>'+
        '                    <tr><br></tr>'+
        '                    <td valign="top" width="540" style="background-color:#ffffff">'+
        '                      <table cellpadding="0" cellspacing="0" width="540" border="0" align="center">'+
        '                        <tbody><tr>'+
        '                          <td valign="top" width="540" style="color:#666666;font-size:12px;font-family:Arial,sans-serif;text-align:justify;padding:30px 0 40px;line-height:20px">'+
        '                            <span style="font-size:12px">'+
        '                              <b> Download Culmyca\'19 android application to view and manage all your registrations at one place.</b>'+
        '                            </span>'+
        '                            <table>'+
        '                              <tr><td><img src="http://blog.timeneye.com/wp-content/uploads/2014/11/Android-app-store.png" height="70" width="250"></td>'+
        '                                <!--<td><img src="http://blog.timeneye.com/wp-content/uploads/2014/11/Android-app-store.png" height="70" width="250"></td>--></tr>'+
        '                              </table>'+
        '                            </tr>'+
        '                          </tbody></table>'+
        '                        </td>'+
        '                      </tr>'+
        ''+
        '                      <tr>'+
        '                        <td valign="top">'+
        '                          <table cellpadding="0" cellspacing="0" width="600" border="0" align="center" bgcolor="1F2533">'+
        '                            <tbody><tr>'+
        '                              <td valign="top" width="260" style="background-color:#1f2533;color:#49ba8e;font-size:12px;font-family:Arial,sans-serif;text-align:left;padding:20px 10px 15px 20px">For any further query<br><a href="mailto:culmycaelements@gmail.com" style="text-decoration:none;color:#49ba8e;font-weight:bold" target="_blank">culmycaelements@gmail.com</a><br/><a href="http://www.elementsculmyca.com" style="text-decoration:none;color:#49ba8e;font-weight:bold" target="_blank">www.elementsculmyca.com</a></td>'+
        '                              <td style="width:200px;vertical-align:top;background-color:#1f2533;text-align:right;padding:25px 0 15px 0">'+
        '                                <img src="https://ci3.googleusercontent.com/proxy/SyVYUNSQvbO4Vpaz4vI18sLBe2mw869TmO_vsG2pCeAKavB7aEfM4-d-6da_55SKmc90xda9joSORt4Lnq5JrfJ1u0uoUOkq0yze=s0-d-e1-ft#http://in.bmscdn.com/webin/emailer/helpline-phone.png" alt="helpline phone" width="18" height="20" border="0" >'+
        '                              </td>'+
        '                              <td style="width:105px;vertical-align:top;padding:25px 0 15px 10px;text-align:left;background-color:#1f2533;color:#49ba8e;line-height:14px;font-size:12px;font-weight:bold">'+
        '                                <a href="tel:+91 82228 31183" style="text-decoration:none;color:#49ba8e" target="_blank">Ph: 8222831183</a>'+
        '                                '+
        '                              </td>'+
        '                            </tr>'+
        '                          </tbody></table>'+
        '                        </td>'+
        '                      </tr>'+
        '                    </tbody>'+
        '                  </table>'+
        '                </td>'+
        '              </tr>'+
        '            </tbody></table>'+
        '          </body>'+
        '          </html>',
	};

	sgMail.send(msg);
}

var dateHelper=function (time) {

    var date=new Date(time);
    var s=" PM";
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if(date.getUTCHours()<12){
        s=" AM";
    }
    console.log( months[date.getUTCMonth()] + ' ' + date.getUTCDate() + ', ' + date.getUTCFullYear()+ ', '+date.getUTCHours()+':'+date.getUTCMinutes()+s);
    return months[date.getUTCMonth()] + ' ' + date.getUTCDate() + ', ' + date.getUTCFullYear()+ ', '+date.getUTCHours()+':'+date.getUTCMinutes()+s;

}