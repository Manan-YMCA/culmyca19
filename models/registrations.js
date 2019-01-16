var mongoose = require('mongoose');

mongoose.connect('mongodb://namansachdeva:namansachdeva12@ds159204.mlab.com:59204/culmyca19',{ useNewUrlParser: true });

var db = mongoose.connect

var RegistrationSchema = mongoose.Schema({

	arrived: Boolean,
    paymentstatus: Boolean,
    qrcode: String,
    name: String,
    phone: Number,
    email: String,
    college: String,
    eventid: String,
    eventname: String,
    timestamp: Date,
});
var Registration = module.exports = mongoose.model('Registration',RegistrationSchema);
module.exports.createRegistration = function(newRegistration,callback){
	newRegistration.save(callback);
}