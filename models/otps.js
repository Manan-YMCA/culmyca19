var mongoose = require('mongoose');

mongoose.connect('mongodb://namansachdeva:namansachdeva12@ds159204.mlab.com:59204/culmyca19',{ useNewUrlParser: true });

var db = mongoose.connect

var OtpSchema = mongoose.Schema({

	phone: Number,
	session_id: String,
	otp: Number,
	status: Boolean

});
var Otp = module.exports = mongoose.model('Otp',OtpSchema);
module.exports.createOtp = function(newOtp,callback){
	newOtp.save(callback);
}